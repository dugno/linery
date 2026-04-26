import assert from "node:assert/strict";
import test from "node:test";

import { summarizeCart } from "@/server/firestore/cart";

test("summarizeCart calculates item totals", () => {
  const cart = summarizeCart("cart_1", [
    {
      currency: "VND",
      href: "/book",
      id: "book",
      lineTotal: 700000,
      lineTotalText: "700.000₫",
      price: 350000,
      priceText: "350.000₫",
      productSlug: "book",
      quantity: 2,
      title: "Book",
    },
  ]);

  assert.equal(cart.itemCount, 1);
  assert.equal(cart.totalQuantity, 2);
  assert.equal(cart.subtotal, 700000);
  assert.equal(cart.subtotalText, "700.000₫");
});
