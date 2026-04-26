import { deleteHandler, getHandler, patchHandler } from "@/server/admin/handlers";
import { adminDiscountPatchSchema } from "@/server/schemas/admin";

export const GET = getHandler("discountCodes", "code", "discounts.read");
export const PATCH = patchHandler("discountCodes", "code", adminDiscountPatchSchema, "discounts.update");
export const DELETE = deleteHandler("discountCodes", "code", "discounts.delete");
