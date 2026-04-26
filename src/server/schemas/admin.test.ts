import assert from "node:assert/strict";
import test from "node:test";

import { adminDiscountSchema, adminOrderPatchSchema, adminProductSchema, adminProfilePatchSchema } from "@/server/schemas/admin";

test("adminProductSchema accepts product admin payload", () => {
  const product = adminProductSchema.parse({
    href: "/book",
    inventoryQuantity: 3,
    price: 350000,
    seo: { title: "Book" },
    slug: "book",
    title: "Book",
  });

  assert.equal(product.currency, "VND");
  assert.equal(product.status, "draft");
});

test("adminOrderPatchSchema rejects invalid order status", () => {
  assert.throws(() => adminOrderPatchSchema.parse({ status: "deleted" }));
});

test("adminDiscountSchema normalizes code", () => {
  const discount = adminDiscountSchema.parse({
    code: " welcome10 ",
    type: "percent",
    value: 10,
  });

  assert.equal(discount.code, "WELCOME10");
});

test("adminProfilePatchSchema accepts profile update without password change", () => {
  const profile = adminProfilePatchSchema.parse({
    firstName: " An ",
    lastName: "Nguyen",
  });

  assert.equal(profile.firstName, "An");
  assert.equal(profile.newPassword, undefined);
});

test("adminProfilePatchSchema requires current password when changing password", () => {
  assert.throws(() =>
    adminProfilePatchSchema.parse({
      firstName: "An",
      lastName: "Nguyen",
      newPassword: "password123",
    }),
  );
});
