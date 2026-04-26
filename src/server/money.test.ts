import assert from "node:assert/strict";
import test from "node:test";

import { formatVndPrice, parseVndPrice } from "@/server/money";

test("parseVndPrice parses formatted VND strings", () => {
  assert.equal(parseVndPrice("350.000₫"), 350000);
  assert.equal(parseVndPrice("1.250.000₫"), 1250000);
  assert.equal(parseVndPrice(""), 0);
});

test("formatVndPrice formats integer VND values", () => {
  assert.equal(formatVndPrice(350000), "350.000₫");
  assert.equal(formatVndPrice(1250000), "1.250.000₫");
});
