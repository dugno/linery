import { handleApiError, ok, fail } from "@/server/api-response";
import { getSessionUser } from "@/server/auth/session";
import { getFirebaseAdmin } from "@/server/firebase-admin";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return fail("unauthenticated", "Authentication required.", 401);
    }

    const snapshot = await getFirebaseAdmin().db.collection("customers").doc(user.uid).get();

    return ok({
      customer: snapshot.exists ? snapshot.data() : null,
      user,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
