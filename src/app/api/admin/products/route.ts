import { handleApiError, ok } from "@/server/api-response";
import { writeAuditLog } from "@/server/admin/audit";
import { requirePermission, withAuditFields } from "@/server/admin/auth";
import { createDoc, normalizeAdminData } from "@/server/admin/firestore";
import { listHandler } from "@/server/admin/handlers";
import { syncProductSearchIndex } from "@/server/admin/search-index";
import { parseJson } from "@/server/request";
import { adminProductSchema } from "@/server/schemas/admin";

export const GET = listHandler("products", "products.read", undefined, 100);

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, "products.create");
    const input = await parseJson(request, adminProductSchema);
    const id = String(input.slug);
    const data = normalizeAdminData(withAuditFields(input, admin, true));
    const created = await createDoc("products", id, data);

    await syncProductSearchIndex(created as Record<string, unknown> | null);
    await writeAuditLog({ action: "create", admin, after: created, collectionName: "products", documentId: id });

    return ok(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
