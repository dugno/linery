import { unstable_cache } from "next/cache";

import { getFirebaseAdmin } from "@/server/firebase-admin";
import { formatVndPrice } from "@/server/money";
import { serializeFirestoreValue } from "@/server/firestore/serialize";
import type { AccountPage, Article, Blog, CartPage, Collection, HomePage, ProductCardData, RouteEntry, SearchPage, SiteSettings, StaticContentPage, UnknownPage } from "@/content/types";
import type { ProductCardApi, ProductDocument } from "@/server/firestore/models";

const storefrontCacheOptions = {
  revalidate: 300,
  tags: ["storefront"],
};

type StorefrontCacheOptions = {
  revalidate: number;
  tags: string[];
};

function cacheStorefront<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  options: StorefrontCacheOptions,
) {
  const cached = unstable_cache(fn, keyParts, options);

  return async (...args: Args) => {
    try {
      return await cached(...args);
    } catch (error) {
      if (error instanceof Error && error.message.includes("incrementalCache missing")) {
        return fn(...args);
      }

      throw error;
    }
  };
}

export type ProductListOptions = {
  author?: string;
  collection?: string;
  condition?: string;
  content?: string;
  cursor?: string;
  limit: number;
  page: number;
  sort?: string;
};

export type ProductListResult = {
  hasMore: boolean;
  items: ProductCardApi[];
  nextCursor?: string;
};

function getCollection(name: string) {
  return getFirebaseAdmin().db.collection(name);
}

function sanitizeDocId(value: string) {
  return value.replace(/[/?#[\]]/g, "-");
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function docData<T>(snapshot: FirebaseFirestore.DocumentSnapshot) {
  if (!snapshot.exists) {
    return null;
  }

  return serializeFirestoreValue({
    id: snapshot.id,
    ...snapshot.data(),
  }) as T & { id: string };
}

export function productToCard(product: ProductDocument): ProductCardApi {
  return {
    comparePrice: typeof product.comparePrice === "number" ? formatVndPrice(product.comparePrice) : undefined,
    comparePriceValue: product.comparePrice,
    href: product.href,
    imageAlt: product.image?.alt || product.title,
    imageUrl: product.image?.src || "",
    price: formatVndPrice(product.price),
    priceValue: product.price,
    title: product.title,
    vendor: product.author,
  };
}

function productMatches(product: ProductDocument, options: ProductListOptions) {
  if (product.status !== "active") {
    return false;
  }

  if (options.collection && !product.collectionSlugs.includes(options.collection)) {
    return false;
  }

  if (options.author && product.author !== options.author) {
    return false;
  }

  if (options.condition && product.condition !== options.condition) {
    return false;
  }

  if (options.content && !product.contentTags.includes(options.content)) {
    return false;
  }

  return true;
}

function sortProducts(products: ProductDocument[], sort?: string) {
  return [...products].sort((left, right) => {
    switch (sort) {
      case "price_asc":
        return left.price - right.price;
      case "price_desc":
        return right.price - left.price;
      case "title_asc":
        return left.title.localeCompare(right.title);
      default:
        return left.slug.localeCompare(right.slug);
    }
  });
}

export const getSiteSettings = cacheStorefront(async () => {
  const snapshot = await getCollection("siteSettings").doc("main").get();

  return docData<SiteSettings>(snapshot);
}, ["storefront-site-settings"], { ...storefrontCacheOptions, tags: ["storefront", "site-settings"] });

export const getHome = cacheStorefront(async () => {
  const snapshot = await getCollection("home").doc("main").get();

  return docData<HomePage & { href: string; slug: string; type: "home" }>(snapshot);
}, ["storefront-home"], { ...storefrontCacheOptions, tags: ["storefront", "home"] });

export const getProduct = cacheStorefront(async (slug: string) => {
  const snapshot = await getCollection("products").doc(slug).get();
  const product = docData<ProductDocument & { bodyClass?: string; bodyId?: string; relatedProducts?: ProductCardData[]; type: "product" }>(snapshot);

  if (!product) {
    return null;
  }

  return {
    ...product,
    comparePrice: typeof product.comparePrice === "number" ? formatVndPrice(product.comparePrice) : undefined,
    comparePriceValue: product.comparePrice,
    price: formatVndPrice(product.price),
    priceValue: product.price,
  };
}, ["storefront-product"], { ...storefrontCacheOptions, tags: ["storefront", "products"] });

export const listProducts = cacheStorefront(async (options: ProductListOptions): Promise<ProductListResult> => {
  let query: FirebaseFirestore.Query = getCollection("products").where("status", "==", "active");

  if (options.collection) {
    query = query.where("collectionSlugs", "array-contains", options.collection);
  }

  if (options.author) {
    query = query.where("author", "==", options.author);
  }

  if (options.condition) {
    query = query.where("condition", "==", options.condition);
  }

  if (options.content && !options.collection) {
    query = query.where("contentTags", "array-contains", options.content);
  }

  const snapshot = await query.get();
  const products = snapshot.docs
    .map((doc) => docData<ProductDocument>(doc))
    .filter((product): product is ProductDocument & { id: string } => Boolean(product))
    .filter((product) => productMatches(product, options));
  const sortedProducts = sortProducts(products, options.sort);
  const cursorIndex = options.cursor ? sortedProducts.findIndex((product) => product.slug === options.cursor) + 1 : -1;
  const startIndex = cursorIndex > 0 ? cursorIndex : (options.page - 1) * options.limit;
  const pagedProducts = sortedProducts.slice(startIndex, startIndex + options.limit + 1);
  const visibleProducts = pagedProducts.slice(0, options.limit);
  const nextProduct = pagedProducts[options.limit];

  return {
    hasMore: Boolean(nextProduct),
    items: visibleProducts.map(productToCard),
    nextCursor: nextProduct?.slug,
  };
}, ["storefront-products-list"], { ...storefrontCacheOptions, tags: ["storefront", "products"] });

export const listCollections = cacheStorefront(async () => {
  const snapshot = await getCollection("collections").get();

  return snapshot.docs
    .map((doc) => docData<Collection>(doc))
    .filter((collection): collection is Collection & { id: string } => Boolean(collection))
    .sort((left, right) => left.title.localeCompare(right.title));
}, ["storefront-collections-list"], { ...storefrontCacheOptions, tags: ["storefront", "collections"] });

export const getCollectionBySlug = cacheStorefront(async (slug: string) => {
  const snapshot = await getCollection("collections").doc(slug).get();

  return docData<Collection>(snapshot);
}, ["storefront-collection"], { ...storefrontCacheOptions, tags: ["storefront", "collections"] });

export const getPage = cacheStorefront(async (slug: string) => {
  const snapshot = await getCollection("pages").doc(slug).get();

  return docData<StaticContentPage>(snapshot);
}, ["storefront-page"], { ...storefrontCacheOptions, tags: ["storefront", "pages"] });

export const getBlog = cacheStorefront(async (slug: string) => {
  const snapshot = await getCollection("blogs").doc(slug).get();

  return docData<Blog>(snapshot);
}, ["storefront-blog"], { ...storefrontCacheOptions, tags: ["storefront", "blogs"] });

export const getArticle = cacheStorefront(async (slug: string) => {
  const snapshot = await getCollection("articles").doc(slug).get();

  return docData<Article>(snapshot);
}, ["storefront-article"], { ...storefrontCacheOptions, tags: ["storefront", "articles"] });

export const getAccountPage = cacheStorefront(async (slug: string) => {
  const snapshot = await getCollection("accounts").doc(slug).get();

  return docData<AccountPage>(snapshot);
}, ["storefront-account"], storefrontCacheOptions);

export const getCartPage = cacheStorefront(async () => {
  const snapshot = await getCollection("cart").doc("main").get();

  return docData<CartPage>(snapshot);
}, ["storefront-cart"], storefrontCacheOptions);

export const getSearchPage = cacheStorefront(async () => {
  const snapshot = await getCollection("search").doc("main").get();

  return docData<SearchPage>(snapshot);
}, ["storefront-search-page"], storefrontCacheOptions);

export const getUnknownPage = cacheStorefront(async (slug: string) => {
  const snapshot = await getCollection("unknownPages").doc(slug).get();

  return docData<UnknownPage>(snapshot);
}, ["storefront-unknown-page"], storefrontCacheOptions);

export const getRoute = cacheStorefront(async (path: string) => {
  const snapshot = await getCollection("routes").doc(sanitizeDocId(path)).get();

  return docData<RouteEntry>(snapshot);
}, ["storefront-route"], { ...storefrontCacheOptions, tags: ["storefront", "routes"] });

export const listRoutes = cacheStorefront(async () => {
  const snapshot = await getCollection("routes").get();

  return snapshot.docs
    .map((doc) => docData<RouteEntry>(doc))
    .filter((route): route is RouteEntry & { id: string } => Boolean(route))
    .sort((left, right) => left.route.localeCompare(right.route));
}, ["storefront-routes-list"], { ...storefrontCacheOptions, tags: ["storefront", "routes"] });

export const searchStorefront = cacheStorefront(async (query: string, type: string | undefined = undefined, limit: number = 48) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  type SearchItem = { author?: string; href: string; imageUrl?: string; price?: string; title: string; type: string };

  if (!type || type === "product") {
    const productsSnapshot = await getCollection("products").where("status", "==", "active").get();

    return productsSnapshot.docs
      .map((doc) => docData<ProductDocument>(doc))
      .filter((product): product is ProductDocument & { id: string } => Boolean(product))
      .map<SearchItem>((product) => ({
        author: product.author,
        href: product.href,
        imageUrl: product.image?.src,
        price: formatVndPrice(product.price),
        title: product.title,
        type: "product",
      }))
      .filter((item) => normalizeSearchText([item.title, item.author, item.type].filter(Boolean).join(" ")).includes(normalizedQuery))
      .slice(0, limit);
  }

  const searchSnapshot = await getCollection("searchIndex").get();

  return searchSnapshot.docs
    .map((doc) => docData<SearchItem>(doc))
    .filter((item): item is SearchItem & { id: string } => Boolean(item))
    .filter((item) => !type || item.type === type)
    .filter((item) => normalizeSearchText([item.title, item.author, item.type].filter(Boolean).join(" ")).includes(normalizedQuery))
    .slice(0, limit);
}, ["storefront-search"], storefrontCacheOptions);
