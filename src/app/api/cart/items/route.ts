import { handleApiError, ok } from "@/server/api-response";
import { addCartItem, getCartContext, setCartCookie } from "@/server/firestore/cart";
import { parseJson } from "@/server/request";
import { addCartItemSchema } from "@/server/schemas/cart";

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, addCartItemSchema);
    const context = await getCartContext(request);
    const response = ok(await addCartItem(context, input.productSlug, input.quantity));

    return context.isNewGuestCart ? setCartCookie(response, context.cartId) : response;
  } catch (error) {
    return handleApiError(error);
  }
}
