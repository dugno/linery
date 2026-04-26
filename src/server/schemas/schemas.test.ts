import assert from "node:assert/strict";
import test from "node:test";

import { registerSchema } from "@/server/schemas/auth";
import { addCartItemSchema } from "@/server/schemas/cart";
import { checkoutSchema } from "@/server/schemas/checkout";

test("registerSchema accepts valid customer input", () => {
  const parsed = registerSchema.parse({
    email: "customer@example.com",
    firstName: "An",
    lastName: "Nguyen",
    password: "password123",
    phone: "0900000000",
  });

  assert.equal(parsed.email, "customer@example.com");
});

test("addCartItemSchema defaults quantity to one", () => {
  const parsed = addCartItemSchema.parse({
    productSlug: "example-book",
  });

  assert.equal(parsed.quantity, 1);
});

test("checkoutSchema accepts COD checkout input", () => {
  const parsed = checkoutSchema.parse({
    paymentMethod: "cod",
    shippingAddress: {
      addressLine: "123 Nguyen Trai",
      district: "Quan 1",
      email: "customer@example.com",
      fullName: "Nguyen Van A",
      phone: "0900000000",
      province: "TP HCM",
      ward: "Ben Nghe",
    },
  });

  assert.equal(parsed.paymentMethod, "cod");
});
