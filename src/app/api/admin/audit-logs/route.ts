import { handleApiError, ok } from "@/server/api-response";
import { requirePermission } from "@/server/admin/auth";
import { listDocs } from "@/server/admin/firestore";
import { getSearchParamNumber } from "@/server/request";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "audit.read");
    const url = new URL(request.url);
    const limit = getSearchParamNumber(url.searchParams, "limit", 50, 200);
    const page = getSearchParamNumber(url.searchParams, "page", 1, 10000);
    const result = await listDocs("auditLogs", { limit, orderBy: "createdAt", page });

    return ok(result.items, { pagination: { hasMore: page * limit < result.total, limit, page, total: result.total } });
  } catch (error) {
    return handleApiError(error);
  }
}
