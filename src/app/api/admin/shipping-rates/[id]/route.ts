import { getHandler, patchHandler } from "@/server/admin/handlers";
import { adminShippingRateSchema } from "@/server/schemas/admin";

export const GET = getHandler("shippingRates", "id", "shipping.read");
export const PATCH = patchHandler("shippingRates", "id", adminShippingRateSchema.partial(), "shipping.update");
