import { handleApiError, ok } from "@/server/api-response";
import { getCart, getCartContext, setCartCookie } from "@/server/firestore/cart";

export async function GET(request: Request) {
  try {
    const context = await getCartContext(request);
    const response = ok(await getCart(context));

    return context.isNewGuestCart ? setCartCookie(response, context.cartId) : response;
  } catch (error) {
    return handleApiError(error);
  }
}
