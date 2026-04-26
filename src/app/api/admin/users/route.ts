import { handleApiError, ok } from "@/server/api-response";
import { requirePermission } from "@/server/admin/auth";
import { listDocs } from "@/server/admin/firestore";
import { getSearchParamNumber } from "@/server/request";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "users.read");
    const url = new URL(request.url);
    const limit = getSearchParamNumber(url.searchParams, "limit", 100, 300);

    return ok(await listDocs("customers", { limit, query: url.searchParams.get("q") || undefined }));
  } catch (error) {
    return handleApiError(error);
  }
}
