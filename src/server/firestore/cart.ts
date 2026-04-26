import type { NextResponse } from "next/server";

import { ApiErrorResponse } from "@/server/api-response";
import { getSessionUser, getRequestCookie } from "@/server/auth/session";
import { FieldValue, getFirebaseAdmin } from "@/server/firebase-admin";
import { formatVndPrice } from "@/server/money";
import type { CartApi, CartApiItem, CartItemDocument, ProductDocument } from "@/server/firestore/models";

export const CART_COOKIE_NAME = "cart_id";

export type CartContext = {
  cartId: string;
  customerId?: string;
  guestCartId?: string;
  isNewGuestCart: boolean;
};

function cartsCollection() {
  return getFirebaseAdmin().db.collection("carts");
}

function productsCollection() {
  return getFirebaseAdmin().db.collection("products");
}

function makeGuestCartId() {
  return `guest_${crypto.randomUUID()}`;
}

function makeCustomerCartId(customerId: string) {
  return `customer_${customerId}`;
}

export async function getCartContext(request: Request): Promise<CartContext> {
  const user = await getSessionUser(request);
  const guestCartId = getRequestCookie(request, CART_COOKIE_NAME);

  if (user) {
    return {
      cartId: makeCustomerCartId(user.uid),
      customerId: user.uid,
      guestCartId,
      isNewGuestCart: false,
    };
  }

  if (guestCartId) {
    return {
      cartId: guestCartId,
      guestCartId,
      isNewGuestCart: false,
    };
  }

  return {
    cartId: makeGuestCartId(),
    isNewGuestCart: true,
  };
}

export function setCartCookie(response: NextResponse, cartId: string) {
  response.cookies.set(CART_COOKIE_NAME, cartId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export function clearCartCookie(response: NextResponse) {
  response.cookies.set(CART_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

async function ensureCart(context: CartContext) {
  await cartsCollection().doc(context.cartId).set(
    {
      converted: false,
      customerId: context.customerId || null,
      id: context.cartId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export function summarizeCart(cartId: string, items: CartApiItem[], note?: string): CartApi {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: cartId,
    itemCount: items.length,
    items,
    note: note || undefined,
    subtotal,
    subtotalText: formatVndPrice(subtotal),
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function toCartApiItem(id: string, item: CartItemDocument): CartApiItem {
  const lineTotal = item.price * item.quantity;

  return {
    ...item,
    id,
    lineTotal,
    lineTotalText: formatVndPrice(lineTotal),
    priceText: formatVndPrice(item.price),
  };
}

export async function getCart(context: CartContext): Promise<CartApi> {
  await ensureCart(context);

  const cartRef = cartsCollection().doc(context.cartId);
  const [cartSnapshot, itemsSnapshot] = await Promise.all([cartRef.get(), cartRef.collection("items").get()]);
  const note = cartSnapshot.data()?.note;
  const items = itemsSnapshot.docs.map((doc) => toCartApiItem(doc.id, doc.data() as CartItemDocument));

  return summarizeCart(context.cartId, items, typeof note === "string" ? note : undefined);
}

export async function addCartItem(context: CartContext, productSlug: string, quantity: number) {
  await ensureCart(context);

  const productSnapshot = await productsCollection().doc(productSlug).get();

  if (!productSnapshot.exists) {
    throw new ApiErrorResponse("not_found", "Product not found.", 404);
  }

  const product = productSnapshot.data() as ProductDocument;

  if (product.status !== "active") {
    throw new ApiErrorResponse("product_unavailable", "Product is not available.", 409);
  }

  const itemRef = cartsCollection().doc(context.cartId).collection("items").doc(productSlug);
  const itemSnapshot = await itemRef.get();
  const existingQuantity = itemSnapshot.exists ? (itemSnapshot.data() as CartItemDocument).quantity : 0;
  const nextQuantity = existingQuantity + quantity;

  if (nextQuantity > product.inventoryQuantity) {
    throw new ApiErrorResponse("insufficient_inventory", "Requested quantity exceeds inventory.", 409);
  }

  await itemRef.set(
    {
      currency: "VND",
      href: product.href,
      imageAlt: product.image?.alt || product.title,
      imageUrl: product.image?.src || "",
      price: product.price,
      productSlug,
      quantity: nextQuantity,
      title: product.title,
    } satisfies CartItemDocument,
    { merge: true },
  );

  return getCart(context);
}

export async function updateCartItem(context: CartContext, itemId: string, quantity: number) {
  const itemRef = cartsCollection().doc(context.cartId).collection("items").doc(itemId);
  const itemSnapshot = await itemRef.get();
  const productSnapshot = await productsCollection().doc(itemId).get();

  if (!itemSnapshot.exists) {
    throw new ApiErrorResponse("not_found", "Cart item not found.", 404);
  }

  if (!productSnapshot.exists) {
    throw new ApiErrorResponse("not_found", "Product not found.", 404);
  }

  const product = productSnapshot.data() as ProductDocument;

  if (quantity > product.inventoryQuantity) {
    throw new ApiErrorResponse("insufficient_inventory", "Requested quantity exceeds inventory.", 409);
  }

  await itemRef.update({
    quantity,
  });

  return getCart(context);
}

export async function removeCartItem(context: CartContext, itemId: string) {
  const itemRef = cartsCollection().doc(context.cartId).collection("items").doc(itemId);
  const itemSnapshot = await itemRef.get();

  if (!itemSnapshot.exists) {
    throw new ApiErrorResponse("not_found", "Cart item not found.", 404);
  }

  await itemRef.delete();

  return getCart(context);
}

export async function updateCartNote(context: CartContext, note: string) {
  await ensureCart(context);
  await cartsCollection().doc(context.cartId).set(
    {
      note,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return getCart(context);
}

export async function mergeGuestCartIntoCustomer(guestCartId: string | undefined, customerId: string) {
  if (!guestCartId || guestCartId === makeCustomerCartId(customerId)) {
    return;
  }

  const customerCartRef = cartsCollection().doc(makeCustomerCartId(customerId));
  const guestItemsSnapshot = await cartsCollection().doc(guestCartId).collection("items").get();

  await customerCartRef.set(
    {
      converted: false,
      customerId,
      id: makeCustomerCartId(customerId),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await Promise.all(
    guestItemsSnapshot.docs.map(async (doc) => {
      const guestItem = doc.data() as CartItemDocument;
      const productSnapshot = await productsCollection().doc(doc.id).get();

      if (!productSnapshot.exists) {
        return;
      }

      const product = productSnapshot.data() as ProductDocument;
      const customerItemRef = customerCartRef.collection("items").doc(doc.id);
      const customerItemSnapshot = await customerItemRef.get();
      const currentQuantity = customerItemSnapshot.exists ? (customerItemSnapshot.data() as CartItemDocument).quantity : 0;
      const quantity = Math.min(product.inventoryQuantity, currentQuantity + guestItem.quantity);

      if (quantity < 1 || product.status !== "active") {
        return;
      }

      await customerItemRef.set(
        {
          ...guestItem,
          quantity,
        },
        { merge: true },
      );
    }),
  );

  await cartsCollection().doc(guestCartId).set(
    {
      converted: true,
      mergedIntoCustomerId: customerId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
