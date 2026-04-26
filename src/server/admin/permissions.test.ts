import assert from "node:assert/strict";
import test from "node:test";

import { hasPermission, resolvePermissions } from "@/server/admin/permissions";

test("admin has operational permissions but cannot manage roles", () => {
  const permissions = resolvePermissions({ role: "admin" });

  assert.equal(hasPermission(permissions, "products.update"), true);
  assert.equal(hasPermission(permissions, "orders.update_status"), true);
  assert.equal(hasPermission(permissions, "settings.update"), true);
  assert.equal(hasPermission(permissions, "users.manage_roles"), false);
});

test("owner has all high privilege permissions", () => {
  const permissions = resolvePermissions({ role: "owner" });

  assert.equal(hasPermission(permissions, "users.manage_roles"), true);
  assert.equal(hasPermission(permissions, "audit.read"), true);
});

test("extraPermissions add and revokedPermissions remove permissions", () => {
  const permissions = resolvePermissions({
    extraPermissions: ["media.delete"],
    revokedPermissions: ["products.update"],
    role: "catalog_manager",
  });

  assert.equal(hasPermission(permissions, "media.delete"), true);
  assert.equal(hasPermission(permissions, "products.update"), false);
});

test("catalog manager cannot archive products by default", () => {
  const permissions = resolvePermissions({ role: "catalog_manager" });

  assert.equal(hasPermission(permissions, "products.create"), true);
  assert.equal(hasPermission(permissions, "products.update"), true);
  assert.equal(hasPermission(permissions, "products.archive"), false);
  assert.equal(hasPermission(permissions, "orders.update_status"), false);
});

test("content editor cannot delete content by default", () => {
  const permissions = resolvePermissions({ role: "content_editor" });

  assert.equal(hasPermission(permissions, "content.update"), true);
  assert.equal(hasPermission(permissions, "content.delete"), false);
});

test("disabled status is handled by admin auth layer default assumptions", () => {
  const permissions = resolvePermissions({ role: "customer" });

  assert.deepEqual(permissions, []);
});
