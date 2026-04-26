import { handleApiError, ok } from "@/server/api-response";
import { getCartContext } from "@/server/firestore/cart";
import { checkout } from "@/server/firestore/orders";
import { enforceRateLimit } from "@/server/rate-limit";
import { parseJson } from "@/server/request";
import { checkoutSchema } from "@/server/schemas/checkout";

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "checkout", 20, 60 * 1000);

    const input = await parseJson(request, checkoutSchema);
    const context = await getCartContext(request);
    const result = await checkout(context, input);
    const response = ok(result);

    if (result.orderAccessToken) {
      response.cookies.set(`order_access_${result.orderId}`, result.orderAccessToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
