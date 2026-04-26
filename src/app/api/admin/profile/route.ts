import { ApiErrorResponse, handleApiError, ok } from "@/server/api-response";
import { writeAuditLog } from "@/server/admin/audit";
import { getAdminUser, withAuditFields } from "@/server/admin/auth";
import { signInWithPassword } from "@/server/auth/firebase-password";
import { FieldValue, getFirebaseAdmin } from "@/server/firebase-admin";
import { serializeFirestoreValue } from "@/server/firestore/serialize";
import { enforceRateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/request";
import { adminProfilePatchSchema } from "@/server/schemas/admin";

function publicProfile(data: Record<string, unknown> | undefined, uid: string, email?: string) {
  return {
    email: String(data?.email || email || ""),
    firstName: String(data?.firstName || ""),
    lastName: String(data?.lastName || ""),
    uid,
  };
}

export async function PATCH(request: Request) {
  try {
    enforceRateLimit(request, "admin_profile_update", 6, 60 * 1000);

    const admin = await getAdminUser(request);

    if (admin.permissions.length === 0) {
      throw new ApiErrorResponse("forbidden", "Tài khoản chưa có quyền quản trị.", 403);
    }

    const input = await parseJson(request, adminProfilePatchSchema);
    const displayName = `${input.lastName} ${input.firstName}`.trim();
    const { auth, db } = getFirebaseAdmin();
    const ref = db.collection("customers").doc(admin.uid);
    const beforeSnapshot = await ref.get();
    const beforeData = beforeSnapshot.data();

    if (input.newPassword) {
      if (!admin.email) {
        throw new ApiErrorResponse("email_required", "Tài khoản cần có email để đổi mật khẩu.", 400);
      }

      const loginResult = await signInWithPassword(admin.email, input.currentPassword || "");

      if (!loginResult) {
        throw new ApiErrorResponse("invalid_current_password", "Mật khẩu hiện tại không đúng.", 401);
      }
    }

    await auth.updateUser(admin.uid, {
      displayName,
      ...(input.newPassword ? { password: input.newPassword } : {}),
    });

    const profilePatch = withAuditFields(
      {
        email: admin.email || beforeData?.email || null,
        firstName: input.firstName,
        lastName: input.lastName,
        uid: admin.uid,
      },
      admin,
      !beforeSnapshot.exists,
    );

    await ref.set(
      {
        ...profilePatch,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const afterSnapshot = await ref.get();
    const afterData = afterSnapshot.exists
      ? serializeFirestoreValue({
          id: afterSnapshot.id,
          ...afterSnapshot.data(),
        })
      : null;

    await writeAuditLog({
      action: input.newPassword ? "password_change" : "profile_update",
      admin,
      after: {
        profile: publicProfile(afterSnapshot.data(), admin.uid, admin.email),
        passwordChanged: Boolean(input.newPassword),
      },
      before: beforeSnapshot.exists
        ? {
            profile: publicProfile(beforeData, admin.uid, admin.email),
          }
        : null,
      collectionName: "customers",
      documentId: admin.uid,
    });

    return ok({
      customer: afterData,
      passwordChanged: Boolean(input.newPassword),
      user: {
        displayName,
        email: admin.email,
        uid: admin.uid,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
