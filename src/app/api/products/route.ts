import type { NextRequest } from "next/server";

import { handleApiError, ok } from "@/server/api-response";
import { listProducts } from "@/server/firestore/storefront";
import { getSearchParamNumber } from "@/server/request";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const page = getSearchParamNumber(params, "page", 1, 10000);
    const limit = getSearchParamNumber(params, "limit", 24, 100);
    const result = await listProducts({
      author: params.get("author") || undefined,
      collection: params.get("collection") || undefined,
      condition: params.get("condition") || undefined,
      content: params.get("content") || undefined,
      cursor: params.get("cursor") || undefined,
      limit,
      page,
      sort: params.get("sort") || undefined,
    });

    return ok(result.items, {
      pagination: {
        hasMore: result.hasMore,
        limit,
        nextCursor: result.nextCursor,
        page,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
