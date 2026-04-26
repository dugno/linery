export const ADMIN_ROLES = [
  "customer",
  "support",
  "order_manager",
  "catalog_manager",
  "content_editor",
  "marketing_manager",
  "admin",
  "owner",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "dashboard.read",
  "products.read",
  "products.create",
  "products.update",
  "products.archive",
  "collections.read",
  "collections.create",
  "collections.update",
  "orders.read",
  "orders.update_status",
  "orders.update_payment",
  "orders.add_internal_note",
  "discounts.read",
  "discounts.create",
  "discounts.update",
  "discounts.delete",
  "shipping.read",
  "shipping.update",
  "content.read",
  "content.create",
  "content.update",
  "content.delete",
  "media.read",
  "media.upload",
  "media.delete",
  "settings.read",
  "settings.update",
  "audit.read",
  "users.read",
  "users.manage_roles",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const allPermissions = new Set<string>(ADMIN_PERMISSIONS);
const allRoles = new Set<string>(ADMIN_ROLES);

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  customer: [],
  support: ["dashboard.read", "orders.read", "orders.add_internal_note"],
  order_manager: ["dashboard.read", "orders.read", "orders.update_status", "orders.update_payment"],
  catalog_manager: [
    "dashboard.read",
    "products.read",
    "products.create",
    "products.update",
    "collections.read",
    "collections.create",
    "collections.update",
    "media.read",
    "media.upload",
  ],
  content_editor: ["dashboard.read", "content.read", "content.create", "content.update", "media.read", "media.upload"],
  marketing_manager: [
    "dashboard.read",
    "products.read",
    "discounts.read",
    "discounts.create",
    "discounts.update",
    "discounts.delete",
    "settings.read",
    "settings.update",
    "media.read",
    "media.upload",
  ],
  admin: ADMIN_PERMISSIONS.filter((permission) => permission !== "users.manage_roles"),
  owner: ADMIN_PERMISSIONS,
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && allRoles.has(value);
}

export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === "string" && allPermissions.has(value);
}

export function normalizeAdminRole(value: unknown): AdminRole {
  return isAdminRole(value) ? value : "customer";
}

function normalizePermissionList(value: unknown) {
  return Array.isArray(value) ? value.filter(isAdminPermission) : [];
}

export function resolvePermissions({
  extraPermissions,
  revokedPermissions,
  role,
}: {
  extraPermissions?: unknown;
  revokedPermissions?: unknown;
  role: AdminRole;
}) {
  const permissions = new Set<AdminPermission>(ROLE_PERMISSIONS[role]);

  for (const permission of normalizePermissionList(extraPermissions)) {
    permissions.add(permission);
  }

  for (const permission of normalizePermissionList(revokedPermissions)) {
    permissions.delete(permission);
  }

  return [...permissions].sort();
}

export function hasPermission(permissions: readonly string[], permission: AdminPermission) {
  return permissions.includes(permission);
}
