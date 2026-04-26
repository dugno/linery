import { z } from "zod";

import { ApiErrorResponse } from "@/server/api-response";
import { sha256 } from "@/server/crypto";
import { getCart, type CartContext } from "@/server/firestore/cart";
import type { CartItemDocument, CheckoutSuccessApi, ProductDocument } from "@/server/firestore/models";
import { calculateShippingFee } from "@/server/firestore/shipping";
import { FieldValue, getFirebaseAdmin } from "@/server/firebase-admin";
import { formatVndPrice } from "@/server/money";
import type { checkoutSchema } from "@/server/schemas/checkout";

type CheckoutInput = z.infer<typeof checkoutSchema>;

type DiscountDocument = {
  active: boolean;
  expiresAt?: { toDate: () => Date };
  minSubtotal?: number;
  type: "fixed" | "percent";
  value: number;
};

function getOrderCode() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomPart = crypto.randomUUID().slice(0, 8).toUpperCase();

  return `TSQ-${datePart}-${randomPart}`;
}

function calculateDiscount(subtotal: number, discount?: DiscountDocument | null) {
  if (!discount || !discount.active) {
    return 0;
  }

  if (discount.minSubtotal && subtotal < discount.minSubtotal) {
    return 0;
  }

  if (discount.expiresAt && discount.expiresAt.toDate() < new Date()) {
    return 0;
  }

  if (discount.type === "percent") {
    return Math.min(subtotal, Math.round((subtotal * discount.value) / 100));
  }

  return Math.min(subtotal, Math.max(0, Math.round(discount.value)));
}

export async function validateDiscount(code: string, subtotal: number) {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return {
      code: "",
      discount: 0,
      discountText: formatVndPrice(0),
      valid: false,
    };
  }

  const snapshot = await getFirebaseAdmin().db.collection("discountCodes").doc(normalizedCode).get();
  const discount = snapshot.exists ? (snapshot.data() as DiscountDocument) : null;
  const discountValue = calculateDiscount(subtotal, discount);

  return {
    code: normalizedCode,
    discount: discountValue,
    discountText: formatVndPrice(discountValue),
    valid: discountValue > 0,
  };
}

export async function checkout(context: CartContext, input: CheckoutInput): Promise<CheckoutSuccessApi> {
  const { db } = getFirebaseAdmin();
  const cartBeforeTransaction = await getCart(context);

  if (!cartBeforeTransaction.items.length) {
    throw new ApiErrorResponse("empty_cart", "Cart is empty.", 400);
  }

  const discountResult = input.discountCode ? await validateDiscount(input.discountCode, cartBeforeTransaction.subtotal) : null;
  const discount = discountResult?.discount || 0;
  const shipping = await calculateShippingFee(input.shippingAddress.province);
  const shippingFee = shipping.fee;
  const subtotal = cartBeforeTransaction.subtotal;
  const total = Math.max(0, subtotal - discount + shippingFee);
  const orderRef = db.collection("orders").doc();
  const orderCode = getOrderCode();
  const orderAccessToken = crypto.randomUUID();
  const paymentStatus = input.paymentMethod === "cod" ? "cod_pending" : "unpaid";
  const status = input.paymentMethod === "cod" ? "confirmed" : "pending_payment";

  await db.runTransaction(async (transaction) => {
    const cartRef = db.collection("carts").doc(context.cartId);
    const itemSnapshots = await transaction.get(cartRef.collection("items"));

    if (itemSnapshots.empty) {
      throw new ApiErrorResponse("empty_cart", "Cart is empty.", 400);
    }

    for (const itemSnapshot of itemSnapshots.docs) {
      const item = itemSnapshot.data() as CartItemDocument;
      const productRef = db.collection("products").doc(item.productSlug);
      const productSnapshot = await transaction.get(productRef);

      if (!productSnapshot.exists) {
        throw new ApiErrorResponse("not_found", `Product not found: ${item.productSlug}`, 404);
      }

      const product = productSnapshot.data() as ProductDocument;

      if (product.status !== "active") {
        throw new ApiErrorResponse("product_unavailable", `Product is not available: ${product.title}`, 409);
      }

      if (item.quantity > product.inventoryQuantity) {
        throw new ApiErrorResponse("insufficient_inventory", `Insufficient inventory: ${product.title}`, 409);
      }

      transaction.update(productRef, {
        inventoryQuantity: FieldValue.increment(-item.quantity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.set(orderRef, {
      cartId: context.cartId,
      customerId: context.customerId || null,
      discount,
      discountCode: input.discountCode?.trim().toUpperCase() || null,
      note: input.note || null,
      orderCode,
      orderAccessTokenHash: sha256(orderAccessToken),
      paymentMethod: input.paymentMethod,
      paymentStatus,
      shippingAddress: input.shippingAddress,
      shippingFee,
      status,
      subtotal,
      total,
      totalQuantity: cartBeforeTransaction.totalQuantity,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    for (const itemSnapshot of itemSnapshots.docs) {
      transaction.set(orderRef.collection("items").doc(itemSnapshot.id), itemSnapshot.data());
      transaction.delete(itemSnapshot.ref);
    }

    transaction.set(
      cartRef,
      {
        converted: true,
        convertedOrderId: orderRef.id,
        note: "",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return {
    orderCode,
    orderAccessToken: context.customerId ? undefined : orderAccessToken,
    orderId: orderRef.id,
    paymentStatus,
    status,
    total,
    totalText: formatVndPrice(total),
  };
}

export async function getOrder(orderId: string) {
  const { db } = getFirebaseAdmin();
  const orderSnapshot = await db.collection("orders").doc(orderId).get();

  if (!orderSnapshot.exists) {
    return null;
  }

  const itemsSnapshot = await orderSnapshot.ref.collection("items").get();

  return {
    customerId: typeof orderSnapshot.data()?.customerId === "string" ? orderSnapshot.data()?.customerId : null,
    id: orderSnapshot.id,
    ...orderSnapshot.data(),
    items: itemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })),
  } as { customerId?: string | null; id: string; items: Array<{ id: string }>; orderAccessTokenHash?: string };
}
