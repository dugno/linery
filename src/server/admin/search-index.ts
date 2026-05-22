import { revalidateTag } from "next/cache";

import { getFirebaseAdmin } from "@/server/firebase-admin";

type ProductSearchDoc = {
  author?: string;
  href: string;
  imageUrl?: string;
  price?: string;
  title: string;
  type: "product";
};

export async function syncProductSearchIndex(product: Record<string, unknown> | null) {
  if (!product) {
    return;
  }

  const slug = String(product.slug || product.id || "").trim();

  if (!slug) {
    return;
  }

  const status = String(product.status || "draft");
  const searchRef = getFirebaseAdmin().db.collection("searchIndex").doc(`product:${slug}`);

  if (status !== "active") {
    await searchRef.delete().catch(() => undefined);
    revalidateTag("storefront", "max");
    revalidateTag("products", "max");
    return;
  }

  const searchDoc: ProductSearchDoc = {
    author: typeof product.author === "string" ? product.author : undefined,
    href: typeof product.href === "string" ? product.href : `/products/${slug}`,
    imageUrl:
      product.image && typeof product.image === "object" && typeof (product.image as Record<string, unknown>).src === "string"
        ? String((product.image as Record<string, unknown>).src)
        : undefined,
    price: typeof product.price === "number" ? String(product.price) : undefined,
    title: typeof product.title === "string" ? product.title : slug,
    type: "product",
  };

  await searchRef.set(searchDoc, { merge: true });
  revalidateTag("storefront", "max");
  revalidateTag("products", "max");
}

