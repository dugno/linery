import { handleApiError, ok } from "@/server/api-response";
import { getCart, getCartContext } from "@/server/firestore/cart";
import { validateDiscount } from "@/server/firestore/orders";
import { parseJson } from "@/server/request";
import { validateDiscountSchema } from "@/server/schemas/checkout";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, validateDiscountSchema);
    const context = await getCartContext(request);
    const cart = await getCart(context);

    return ok(await validateDiscount(input.code, cart.subtotal));
  } catch (error) {
    return handleApiError(error);
  }
}
