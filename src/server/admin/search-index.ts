import { revalidateTag } from "next/cache";

import { getFirebaseAdmin } from "@/server/firebase-admin";

type ProductSearchDoc = {
  author?: string;
  href: string;
  imageUrl?: string;
  keywords: string[];
  price?: string;
  title: string;
  type: "product";
};

export function buildSearchKeywords(...values: (string | undefined)[]): string[] {
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;

    const normalized = value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

    for (const word of normalized.split(/\s+/)) {
      if (word.length >= 2) {
        seen.add(word);
      }
    }
  }

  return [...seen];
}

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

  const title = typeof product.title === "string" ? product.title : slug;
  const author = typeof product.author === "string" ? product.author : undefined;

  const searchDoc: ProductSearchDoc = {
    author,
    href: typeof product.href === "string" ? product.href : `/products/${slug}`,
    imageUrl:
      product.image && typeof product.image === "object" && typeof (product.image as Record<string, unknown>).src === "string"
        ? String((product.image as Record<string, unknown>).src)
        : undefined,
    keywords: buildSearchKeywords(title, author, slug),
    price: typeof product.price === "number" ? String(product.price) : undefined,
    title,
    type: "product",
  };

  await searchRef.set(searchDoc, { merge: true });
  revalidateTag("storefront", "max");
  revalidateTag("products", "max");
}

