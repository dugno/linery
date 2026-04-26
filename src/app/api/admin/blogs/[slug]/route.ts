import { deleteHandler, getHandler, patchHandler } from "@/server/admin/handlers";
import { adminContentPatchSchema } from "@/server/schemas/admin";

export const GET = getHandler("blogs", "slug", "content.read");
export const PATCH = patchHandler("blogs", "slug", adminContentPatchSchema, "content.update");
export const DELETE = deleteHandler("blogs", "slug", "content.delete");
