import type { NextRequest } from "next/server";

import { ok } from "@/server/api-response";
import { listWards } from "@/server/firestore/shipping";

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  return ok(listWards(request.nextUrl.searchParams.get("districtCode") || "other"));
}
