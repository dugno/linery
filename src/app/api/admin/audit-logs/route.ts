import { handleApiError, ok } from "@/server/api-response";
import { requirePermission } from "@/server/admin/auth";
import { listDocs } from "@/server/admin/firestore";
import { getSearchParamNumber } from "@/server/request";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "audit.read");
    const url = new URL(request.url);
    const limit = getSearchParamNumber(url.searchParams, "limit", 50, 200);

    return ok(await listDocs("auditLogs", { limit, orderBy: "createdAt" }));
  } catch (error) {
    return handleApiError(error);
  }
}
