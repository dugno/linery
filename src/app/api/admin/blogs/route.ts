import { createHandler, listHandler } from "@/server/admin/handlers";
import { adminContentSchema } from "@/server/schemas/admin";

export const GET = listHandler("blogs", "content.read");
export const POST = createHandler("blogs", adminContentSchema, "slug", "content.create");
