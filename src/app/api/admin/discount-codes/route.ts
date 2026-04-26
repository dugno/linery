import { createHandler, listHandler } from "@/server/admin/handlers";
import { adminDiscountSchema } from "@/server/schemas/admin";

export const GET = listHandler("discountCodes", "discounts.read");
export const POST = createHandler("discountCodes", adminDiscountSchema, "code", "discounts.create");
