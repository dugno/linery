import { deleteHandler, getHandler, patchHandler } from "@/server/admin/handlers";
import { adminContentPatchSchema } from "@/server/schemas/admin";

export const GET = getHandler("pages", "slug", "content.read");
export const PATCH = patchHandler("pages", "slug", adminContentPatchSchema, "content.update");
export const DELETE = deleteHandler("pages", "slug", "content.delete");
