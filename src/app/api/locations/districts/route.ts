import type { NextRequest } from "next/server";

import { ok } from "@/server/api-response";
import { listDistricts } from "@/server/firestore/shipping";

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  return ok(listDistricts(request.nextUrl.searchParams.get("provinceCode") || "other"));
}
