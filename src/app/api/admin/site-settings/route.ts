import { handleApiError, ok } from "@/server/api-response";
import { writeAuditLog } from "@/server/admin/audit";
import { requirePermission, withAuditFields } from "@/server/admin/auth";
import { getDoc, normalizeAdminData, patchDoc } from "@/server/admin/firestore";
import { revalidateStorefront } from "@/server/admin/revalidate";
import { parseJson } from "@/server/request";
import { adminSettingsPatchSchema } from "@/server/schemas/admin";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "settings.read");

    return ok(await getDoc("siteSettings", "main"));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requirePermission(request, "settings.update");
    const input = await parseJson(request, adminSettingsPatchSchema);
    const data = normalizeAdminData(withAuditFields(input, admin));
    const before = await getDoc("siteSettings", "main");
    const patched = await patchDoc("siteSettings", "main", data);

    revalidateStorefront(["site-settings"]);
    await writeAuditLog({ action: "patch", admin, after: patched, before, collectionName: "siteSettings", documentId: "main" });

    return ok(patched);
  } catch (error) {
    return handleApiError(error);
  }
}
