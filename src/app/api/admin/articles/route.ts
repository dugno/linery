import { createHandler, listHandler } from "@/server/admin/handlers";
import { adminContentSchema } from "@/server/schemas/admin";

export const GET = listHandler("articles", "content.read");
export const POST = createHandler("articles", adminContentSchema, "slug", "content.create");
