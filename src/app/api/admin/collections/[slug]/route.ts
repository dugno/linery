import { getHandler, patchHandler } from "@/server/admin/handlers";
import { adminCollectionPatchSchema } from "@/server/schemas/admin";

export const GET = getHandler("collections", "slug", "collections.read");
export const PATCH = patchHandler("collections", "slug", adminCollectionPatchSchema, "collections.update");
