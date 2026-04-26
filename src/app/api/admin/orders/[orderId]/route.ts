import { ApiErrorResponse, handleApiError, ok } from "@/server/api-response";
import { requireAnyPermission, withAuditFields } from "@/server/admin/auth";
import { getDoc, normalizeAdminData, patchDoc } from "@/server/admin/firestore";
import { writeAuditLog } from "@/server/admin/audit";
import { getHandler } from "@/server/admin/handlers";
import { type AdminPermission, hasPermission } from "@/server/admin/permissions";
import { parseJson } from "@/server/request";
import { adminOrderPatchSchema } from "@/server/schemas/admin";

type OrderContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export const GET = getHandler("orders", "orderId", "orders.read");

const orderUpdatePermissions = ["orders.update_status", "orders.update_payment", "orders.add_internal_note"] as const satisfies AdminPermission[];

function hasOwn(data: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(data, key);
}

export async function PATCH(request: Request, context: OrderContext) {
  try {
    const input = await parseJson(request, adminOrderPatchSchema);
    const admin = await requireAnyPermission(request, [...orderUpdatePermissions]);
    const { orderId } = await context.params;
    const before = await getDoc("orders", orderId);

    if (!before) {
      throw new ApiErrorResponse("not_found", "Không tìm thấy tài liệu.", 404);
    }

    const previousOrder = before as Record<string, unknown>;
    const requiredPermissions = [
      hasOwn(input, "status") && input.status !== previousOrder.status ? "orders.update_status" : null,
      hasOwn(input, "paymentStatus") && input.paymentStatus !== previousOrder.paymentStatus ? "orders.update_payment" : null,
      hasOwn(input, "internalNote") && input.internalNote !== previousOrder.internalNote ? "orders.add_internal_note" : null,
      hasOwn(input, "trackingCode") && input.trackingCode !== previousOrder.trackingCode ? "orders.add_internal_note" : null,
    ].filter(Boolean) as AdminPermission[];

    if (requiredPermissions.some((permission) => !hasPermission(admin.permissions, permission))) {
      throw new ApiErrorResponse("forbidden", "Tài khoản chưa có quyền cập nhật trường này.", 403);
    }

    const patched = await patchDoc("orders", orderId, normalizeAdminData(withAuditFields(input, admin)));

    await writeAuditLog({ action: "patch", admin, after: patched, before, collectionName: "orders", documentId: orderId });

    return ok(patched);
  } catch (error) {
    return handleApiError(error);
  }
}
