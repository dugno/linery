import { handleApiError, ok } from "@/server/api-response";
import { enforceRateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/request";
import { recoverPasswordSchema } from "@/server/schemas/auth";

async function sendPasswordResetEmail(email: string) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required environment variable: FIREBASE_WEB_API_KEY");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
    body: JSON.stringify({
      email,
      requestType: "PASSWORD_RESET",
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to send password reset email.");
  }
}

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "auth_recover", 5, 60 * 1000);

    const input = await parseJson(request, recoverPasswordSchema);
    await sendPasswordResetEmail(input.email);

    return ok({
      email: input.email,
      sent: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
