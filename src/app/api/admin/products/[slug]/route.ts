import { archiveProductHandler, getHandler, patchHandler } from "@/server/admin/handlers";
import { adminProductPatchSchema } from "@/server/schemas/admin";

export const GET = getHandler("products", "slug", "products.read");
export const PATCH = patchHandler("products", "slug", adminProductPatchSchema, "products.update");
export const DELETE = archiveProductHandler();
