import { handleApiError, ok } from "@/server/api-response";
import { requirePermission } from "@/server/admin/auth";
import { listMediaAssets, uploadMediaAsset } from "@/server/admin/media";
import { getSearchParamNumber } from "@/server/request";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "media.read");
    const url = new URL(request.url);
    const limit = getSearchParamNumber(url.searchParams, "limit", 100, 300);

    return ok(await listMediaAssets(limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requirePermission(request, "media.upload");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return ok({ uploaded: false });
    }

    return ok(await uploadMediaAsset(file, admin), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
