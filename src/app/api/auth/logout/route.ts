import { handleApiError, ok } from "@/server/api-response";
import { clearSessionCookie } from "@/server/auth/session";

export async function POST() {
  try {
    return clearSessionCookie(ok({ loggedOut: true }));
  } catch (error) {
    return handleApiError(error);
  }
}
