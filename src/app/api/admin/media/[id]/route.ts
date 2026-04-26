import { handleApiError, ok } from "@/server/api-response";
import { requirePermission } from "@/server/admin/auth";
import { deleteMediaAsset } from "@/server/admin/media";

type MediaContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: MediaContext) {
  try {
    const admin = await requirePermission(request, "media.delete");
    const { id } = await context.params;

    return ok(await deleteMediaAsset(id, admin));
  } catch (error) {
    return handleApiError(error);
  }
}
