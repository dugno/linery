import { handleApiError, ok } from "@/server/api-response";
import { writeAuditLog } from "@/server/admin/audit";
import { requirePermission, withAuditFields } from "@/server/admin/auth";
import { getDoc, normalizeAdminData, patchDoc } from "@/server/admin/firestore";
import { adminContentPatchSchema } from "@/server/schemas/admin";
import { parseJson } from "@/server/request";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "content.read");
    return ok(await getDoc("home", "main"));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requirePermission(request, "content.update");
    const input = await parseJson(request, adminContentPatchSchema);
    const data = normalizeAdminData(withAuditFields(input, admin));
    const before = await getDoc("home", "main");
    const patched = await patchDoc("home", "main", data);

    await writeAuditLog({ action: "patch", admin, after: patched, before, collectionName: "home", documentId: "main" });

    return ok(patched);
  } catch (error) {
    return handleApiError(error);
  }
}
