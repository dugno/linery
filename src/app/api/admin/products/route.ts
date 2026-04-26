import { createHandler, listHandler } from "@/server/admin/handlers";
import { adminProductSchema } from "@/server/schemas/admin";

export const GET = listHandler("products", "products.read");
export const POST = createHandler("products", adminProductSchema, "slug", "products.create");
