import { handleApiError, ok } from "@/server/api-response";
import { writeAuditLog } from "@/server/admin/audit";
import { requirePermission, withAuditFields } from "@/server/admin/auth";
import { archiveProduct, getDoc, normalizeAdminData, patchDoc } from "@/server/admin/firestore";
import { getHandler } from "@/server/admin/handlers";
import { syncProductSearchIndex } from "@/server/admin/search-index";
import { parseJson } from "@/server/request";
import { adminProductPatchSchema } from "@/server/schemas/admin";

type IdContext = {
  params: Promise<{ slug: string }>;
};

export const GET = getHandler("products", "slug", "products.read");

export async function PATCH(request: Request, context: IdContext) {
  try {
    const admin = await requirePermission(request, "products.update");
    const params = await context.params;
    const input = await parseJson(request, adminProductPatchSchema);
    const data = normalizeAdminData(withAuditFields(input, admin));
    const before = await getDoc("products", params.slug);
    const patched = await patchDoc("products", params.slug, data);

    await syncProductSearchIndex(patched as Record<string, unknown> | null);
    await writeAuditLog({ action: "patch", admin, after: patched, before, collectionName: "products", documentId: params.slug });

    return ok(patched);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: IdContext) {
  try {
    const admin = await requirePermission(request, "products.archive");
    const params = await context.params;
    const before = await getDoc("products", params.slug);
    const archived = await archiveProduct(params.slug, admin.uid);

    await syncProductSearchIndex(archived as Record<string, unknown> | null);
    await writeAuditLog({ action: "archive", admin, after: archived, before, collectionName: "products", documentId: params.slug });

    return ok(archived);
  } catch (error) {
    return handleApiError(error);
  }
}
