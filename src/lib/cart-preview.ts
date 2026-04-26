import { getProduct, listProducts } from "@/server/firestore/storefront";
import type { ProductCardApi } from "@/server/firestore/models";

export type CartPreviewItem = {
  href: string;
  imageAlt: string;
  imageUrl: string;
  price: string;
  quantity: number;
  title: string;
};

type ProductPreviewSource = ProductCardApi | Awaited<ReturnType<typeof getProduct>>;

function isProductCard(product: ProductPreviewSource): product is ProductCardApi {
  return Boolean(product && "imageUrl" in product);
}

function getImageAlt(product: ProductPreviewSource) {
  if (!product) {
    return "";
  }

  if (isProductCard(product)) {
    return product.imageAlt || product.title;
  }

  if ("image" in product) {
    return product.image?.alt || product.title;
  }

  return product.title;
}

function getImageUrl(product: ProductPreviewSource) {
  if (!product) {
    return "";
  }

  if (isProductCard(product)) {
    return product.imageUrl || "";
  }

  if ("image" in product) {
    return product.image?.src || "";
  }

  return "";
}

export async function getCartPreviewItem(): Promise<CartPreviewItem> {
  const preferredProduct = await getProduct("9780143106852");
  const product = preferredProduct || (await listProducts({ limit: 1, page: 1 })).items[0];

  if (!product) {
    return {
      href: "/",
      imageAlt: "",
      imageUrl: "",
      price: "0₫",
      quantity: 1,
      title: "Sản phẩm",
    };
  }

  return {
    href: product.href,
    imageAlt: getImageAlt(product),
    imageUrl: getImageUrl(product),
    price: typeof product.price === "string" ? product.price : "0₫",
    quantity: 1,
    title: product.title,
  };
}
