import { handleApiError, ok } from "@/server/api-response";
import { calculateShippingFee } from "@/server/firestore/shipping";
import { parseJson } from "@/server/request";
import { z } from "zod";

const shippingQuoteSchema = z.object({
  province: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, shippingQuoteSchema);

    return ok(await calculateShippingFee(input.province));
  } catch (error) {
    return handleApiError(error);
  }
}
