import { ApiErrorResponse } from "@/server/api-response";
import { getSessionUser } from "@/server/auth/session";
import { getFirebaseAdmin } from "@/server/firebase-admin";
import { type AdminPermission, type AdminRole, hasPermission, normalizeAdminRole, resolvePermissions } from "@/server/admin/permissions";

export type AdminUser = {
  email?: string;
  permissions: AdminPermission[];
  role: AdminRole;
  status: "active" | "disabled";
  uid: string;
};

function normalizeStatus(value: unknown): "active" | "disabled" {
  return value === "disabled" ? "disabled" : "active";
}

export async function getAdminUser(request: Request): Promise<AdminUser> {
  const user = await getSessionUser(request);

  if (!user) {
    throw new ApiErrorResponse("unauthenticated", "Cần đăng nhập để tiếp tục.", 401);
  }

  const customerSnapshot = await getFirebaseAdmin().db.collection("customers").doc(user.uid).get();
  const customer = customerSnapshot.data() || {};
  const role = normalizeAdminRole(customer.role);
  const status = normalizeStatus(customer.status);
  const permissions = resolvePermissions({
    extraPermissions: customer.extraPermissions,
    revokedPermissions: customer.revokedPermissions,
    role,
  });

  if (status === "disabled") {
    throw new ApiErrorResponse("forbidden", "Tài khoản đã bị vô hiệu hoá.", 403);
  }

  return {
    email: user.email,
    permissions,
    role,
    status,
    uid: user.uid,
  };
}

export async function requirePermission(request: Request, permission: AdminPermission): Promise<AdminUser> {
  const admin = await getAdminUser(request);

  if (!hasPermission(admin.permissions, permission)) {
    throw new ApiErrorResponse("forbidden", "Tài khoản chưa có quyền quản trị.", 403);
  }

  return admin;
}

export async function requireAnyPermission(request: Request, permissions: AdminPermission[]): Promise<AdminUser> {
  const admin = await getAdminUser(request);

  if (!permissions.some((permission) => hasPermission(admin.permissions, permission))) {
    throw new ApiErrorResponse("forbidden", "Tài khoản chưa có quyền thực hiện thao tác này.", 403);
  }

  return admin;
}

export async function requireAllPermissions(request: Request, permissions: AdminPermission[]): Promise<AdminUser> {
  const admin = await getAdminUser(request);

  if (!permissions.every((permission) => hasPermission(admin.permissions, permission))) {
    throw new ApiErrorResponse("forbidden", "Tài khoản chưa có đủ quyền để thực hiện thao tác này.", 403);
  }

  return admin;
}

export async function requireAdmin(request: Request): Promise<AdminUser> {
  return requireAnyPermission(request, ["dashboard.read"]);
}

export function withAuditFields<T extends Record<string, unknown>>(data: T, admin: AdminUser, isCreate = false) {
  return {
    ...data,
    ...(isCreate ? { createdBy: admin.uid } : {}),
    updatedBy: admin.uid,
  };
}
