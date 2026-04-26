import { createHandler, listHandler } from "@/server/admin/handlers";
import { adminCollectionSchema } from "@/server/schemas/admin";

export const GET = listHandler("collections", "collections.read");
export const POST = createHandler("collections", adminCollectionSchema, "slug", "collections.create");
