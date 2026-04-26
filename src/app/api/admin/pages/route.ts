import { createHandler, listHandler } from "@/server/admin/handlers";
import { adminContentSchema } from "@/server/schemas/admin";

export const GET = listHandler("pages", "content.read");
export const POST = createHandler("pages", adminContentSchema, "slug", "content.create");
