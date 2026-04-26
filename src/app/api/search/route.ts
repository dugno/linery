import type { NextRequest } from "next/server";

import { handleApiError, ok } from "@/server/api-response";
import { searchStorefront } from "@/server/firestore/storefront";
import { getSearchParamNumber } from "@/server/request";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const limit = getSearchParamNumber(params, "limit", 48, 100);
    const results = await searchStorefront(params.get("q") || params.get("query") || "", params.get("type") || undefined, limit);

    return ok(results);
  } catch (error) {
    return handleApiError(error);
  }
}
