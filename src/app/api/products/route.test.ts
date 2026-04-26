import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex);
    let value = trimmedLine.slice(separatorIndex + 1);

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] ||= value;
  }
}

test("GET /api/products returns paginated Firestore product cards", async () => {
  loadEnvFile(".env.local");
  const { GET } = await import("@/app/api/products/route");
  const response = await GET({
    nextUrl: new URL("http://localhost/api/products?limit=3&page=1"),
  } as never);
  const payload = await response.json();

  assert.equal(payload.success, true);
  assert.equal(payload.data.length, 3);
  assert.equal(payload.pagination.limit, 3);
});
