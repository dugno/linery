import { handleApiError, ok } from "@/server/api-response";
import { getCartContext, setCartCookie, updateCartNote } from "@/server/firestore/cart";
import { parseJson } from "@/server/request";
import { updateCartNoteSchema } from "@/server/schemas/cart";

export async function PATCH(request: Request) {
  try {
    const input = await parseJson(request, updateCartNoteSchema);
    const context = await getCartContext(request);
    const response = ok(await updateCartNote(context, input.note));

    return context.isNewGuestCart ? setCartCookie(response, context.cartId) : response;
  } catch (error) {
    return handleApiError(error);
  }
}
