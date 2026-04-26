import { handleApiError, ok, fail } from "@/server/api-response";
import { getRequestCookie, setSessionCookie, SESSION_MAX_AGE_SECONDS } from "@/server/auth/session";
import { CART_COOKIE_NAME, clearCartCookie, mergeGuestCartIntoCustomer } from "@/server/firestore/cart";
import { getFirebaseAdmin } from "@/server/firebase-admin";
import { enforceRateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/request";
import { loginSchema } from "@/server/schemas/auth";

type FirebasePasswordLoginResponse = {
  email: string;
  idToken: string;
  localId: string;
};

async function signInWithPassword(email: string, password: string) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required environment variable: FIREBASE_WEB_API_KEY");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as FirebasePasswordLoginResponse;
}

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "auth_login", 10, 60 * 1000);

    const input = await parseJson(request, loginSchema);
    const loginResult = await signInWithPassword(input.email, input.password);

    if (!loginResult) {
      return fail("invalid_credentials", "Email or password is incorrect.", 401);
    }

    const { auth } = getFirebaseAdmin();
    const decodedToken = await auth.verifyIdToken(loginResult.idToken);
    const sessionCookie = await auth.createSessionCookie(loginResult.idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });
    const response = ok({
      email: loginResult.email,
      uid: decodedToken.uid,
    });

    await mergeGuestCartIntoCustomer(getRequestCookie(request, CART_COOKIE_NAME), decodedToken.uid);

    clearCartCookie(response);

    return setSessionCookie(response, sessionCookie);
  } catch (error) {
    return handleApiError(error);
  }
}
