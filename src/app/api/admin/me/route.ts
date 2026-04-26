import { ApiErrorResponse, handleApiError, ok } from "@/server/api-response";
import { getAdminUser } from "@/server/admin/auth";
import { getFirebaseAdmin } from "@/server/firebase-admin";
import { serializeFirestoreValue } from "@/server/firestore/serialize";

export async function GET(request: Request) {
  try {
    const admin = await getAdminUser(request);

    if (admin.permissions.length === 0) {
      throw new ApiErrorResponse("forbidden", "Tài khoản chưa có quyền quản trị.", 403);
    }

    const { db } = getFirebaseAdmin();
    const [snapshot, siteSettingsSnapshot] = await Promise.all([
      db.collection("customers").doc(admin.uid).get(),
      db.collection("siteSettings").doc("main").get(),
    ]);
    const siteSettings = siteSettingsSnapshot.data() as { adminUi?: { showAdvancedJsonEditor?: unknown } } | undefined;
    const showAdvancedJsonEditor = siteSettings?.adminUi?.showAdvancedJsonEditor !== false;

    return ok({
      adminUi: {
        showAdvancedJsonEditor,
      },
      customer: snapshot.exists
        ? serializeFirestoreValue({
            id: snapshot.id,
            ...snapshot.data(),
          })
        : null,
      user: {
        email: admin.email,
        uid: admin.uid,
      },
      permissions: admin.permissions,
      role: admin.role,
      status: admin.status,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
