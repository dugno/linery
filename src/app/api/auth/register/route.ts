import { handleApiError, ok } from "@/server/api-response";
import { getFirebaseAdmin, FieldValue } from "@/server/firebase-admin";
import { enforceRateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/request";
import { registerSchema } from "@/server/schemas/auth";

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "auth_register", 5, 60 * 1000);

    const input = await parseJson(request, registerSchema);
    const { auth, db } = getFirebaseAdmin();
    const user = await auth.createUser({
      displayName: `${input.lastName} ${input.firstName}`.trim(),
      email: input.email,
      password: input.password,
      phoneNumber: input.phone.startsWith("+") ? input.phone : undefined,
    });

    await db.collection("customers").doc(user.uid).set({
      createdAt: FieldValue.serverTimestamp(),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      uid: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return ok({
      email: input.email,
      uid: user.uid,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
