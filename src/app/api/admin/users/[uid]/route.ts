import { ApiErrorResponse, handleApiError, ok } from "@/server/api-response";
import { writeAuditLog } from "@/server/admin/audit";
import { requirePermission, withAuditFields } from "@/server/admin/auth";
import { getDoc, normalizeAdminData, patchDoc } from "@/server/admin/firestore";
import { parseJson } from "@/server/request";
import { adminUserPatchSchema } from "@/server/schemas/admin";

type UserContext = {
  params: Promise<{
    uid: string;
  }>;
};

export async function GET(request: Request, context: UserContext) {
  try {
    await requirePermission(request, "users.read");
    const { uid } = await context.params;
    const user = await getDoc("customers", uid);

    if (!user) {
      throw new ApiErrorResponse("not_found", "Không tìm thấy người dùng.", 404);
    }

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: UserContext) {
  try {
    const admin = await requirePermission(request, "users.manage_roles");
    const { uid } = await context.params;
    const input = await parseJson(request, adminUserPatchSchema);
    const before = await getDoc("customers", uid);

    if (!before) {
      throw new ApiErrorResponse("not_found", "Không tìm thấy người dùng.", 404);
    }

    if (uid === admin.uid && (input.status === "disabled" || (input.role && input.role !== "owner") || input.revokedPermissions?.includes("users.manage_roles"))) {
      throw new ApiErrorResponse("forbidden", "Không thể tự thu hồi quyền owner của chính mình.", 403);
    }

    const patched = await patchDoc("customers", uid, normalizeAdminData(withAuditFields(input, admin)));

    await writeAuditLog({
      action: input.role ? "role_update" : "user_status_update",
      admin,
      after: patched,
      before,
      collectionName: "customers",
      documentId: uid,
    });

    return ok(patched);
  } catch (error) {
    return handleApiError(error);
  }
}
