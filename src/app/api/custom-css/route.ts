import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

const CUSTOM_CSS_PATH = path.join(process.cwd(), "src/styles/custom.css");

export async function GET() {
  const css = fs.existsSync(CUSTOM_CSS_PATH) ? fs.readFileSync(CUSTOM_CSS_PATH, "utf8") : "";

  return new NextResponse(css, {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
      "content-type": "text/css; charset=utf-8",
    },
  });
}
