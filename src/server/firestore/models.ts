import type { MediaAsset, SeoData } from "@/content/types";

export type ProductStatus = "active" | "archived" | "draft";

export type ProductDocument = {
  author?: string;
  collectionSlugs: string[];
  comparePrice?: number;
  condition?: string;
  contentTags: string[];
  currency: "VND";
  descriptionHtml: string;
  href: string;
  image?: MediaAsset;
  inventoryQuantity: number;
  price: number;
  relatedProductSlugs: string[];
  seo: SeoData;
  slug: string;
  status: ProductStatus;
  title: string;
};

export type ProductCardApi = {
  comparePrice?: string;
  comparePriceValue?: number;
  href: string;
  imageAlt: string;
  imageUrl: string;
  price: string;
  priceValue: number;
  title: string;
  vendor?: string;
};

export type CartItemDocument = {
  currency: "VND";
  href: string;
  imageAlt?: string;
  imageUrl?: string;
  price: number;
  productSlug: string;
  quantity: number;
  title: string;
};

export type CartApiItem = CartItemDocument & {
  id: string;
  lineTotal: number;
  lineTotalText: string;
  priceText: string;
};

export type CartApi = {
  id: string;
  itemCount: number;
  items: CartApiItem[];
  note?: string;
  subtotal: number;
  subtotalText: string;
  totalQuantity: number;
};

export type CheckoutSuccessApi = {
  orderAccessToken?: string;
  orderCode: string;
  orderId: string;
  paymentStatus: string;
  status: string;
  total: number;
  totalText: string;
};
