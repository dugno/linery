import { handleApiError, ok } from "@/server/api-response";
import { getCartContext, removeCartItem, updateCartItem } from "@/server/firestore/cart";
import { parseJson } from "@/server/request";
import { updateCartItemSchema } from "@/server/schemas/cart";

type CartItemRouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: Request, contextInput: CartItemRouteContext) {
  try {
    const input = await parseJson(request, updateCartItemSchema);
    const context = await getCartContext(request);
    const { itemId } = await contextInput.params;

    return ok(await updateCartItem(context, itemId, input.quantity));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, contextInput: CartItemRouteContext) {
  try {
    const context = await getCartContext(request);
    const { itemId } = await contextInput.params;

    return ok(await removeCartItem(context, itemId));
  } catch (error) {
    return handleApiError(error);
  }
}
