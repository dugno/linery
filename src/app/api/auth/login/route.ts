import { handleApiError, ok, fail } from "@/server/api-response";
import { signInWithPassword } from "@/server/auth/firebase-password";
import { getRequestCookie, setSessionCookie, SESSION_MAX_AGE_SECONDS } from "@/server/auth/session";
import { CART_COOKIE_NAME, clearCartCookie, mergeGuestCartIntoCustomer } from "@/server/firestore/cart";
import { getFirebaseAdmin } from "@/server/firebase-admin";
import { enforceRateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/request";
import { loginSchema } from "@/server/schemas/auth";

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
