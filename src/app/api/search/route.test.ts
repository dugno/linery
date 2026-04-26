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

test("GET /api/search returns matching Firestore results", async () => {
  loadEnvFile(".env.local");
  const { GET } = await import("@/app/api/search/route");
  const response = await GET({
    nextUrl: new URL("http://localhost/api/search?query=1984&limit=5"),
  } as never);
  const payload = await response.json();

  assert.equal(payload.success, true);
  assert.ok(payload.data.length > 0);
  assert.ok(payload.data.length <= 5);
});
