import { deleteHandler, getHandler, patchHandler } from "@/server/admin/handlers";
import { adminContentPatchSchema } from "@/server/schemas/admin";

export const GET = getHandler("articles", "slug", "content.read");
export const PATCH = patchHandler("articles", "slug", adminContentPatchSchema, "content.update");
export const DELETE = deleteHandler("articles", "slug", "content.delete");
