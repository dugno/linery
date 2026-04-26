import type { NextRequest } from "next/server";

import { handleApiError, ok, fail } from "@/server/api-response";
import { getSessionUser } from "@/server/auth/session";
import { sha256 } from "@/server/crypto";
import { getOrder } from "@/server/firestore/orders";

type OrderRouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function GET(request: NextRequest, context: OrderRouteContext) {
  try {
    const { orderId } = await context.params;
    const order = await getOrder(orderId);

    if (!order) {
      return fail("not_found", "Order not found.", 404);
    }

    const user = await getSessionUser(request);

    if (order.customerId && order.customerId !== user?.uid) {
      return fail("forbidden", "You cannot access this order.", 403);
    }

    if (!order.customerId) {
      const token = request.nextUrl.searchParams.get("token") || request.cookies.get(`order_access_${orderId}`)?.value;

      if (!token || sha256(token) !== order.orderAccessTokenHash) {
        return fail("forbidden", "Order access token is required.", 403);
      }
    }

    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}
