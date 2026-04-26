import assert from "node:assert/strict";
import test from "node:test";

import { listDistricts, listProvinces, listWards } from "@/server/firestore/shipping";

test("location helpers return fallback location options", () => {
  assert.ok(listProvinces().length > 0);
  assert.ok(listDistricts("hcm").length > 0);
  assert.ok(listWards("unknown").length > 0);
});
