import { getFirebaseAdmin } from "@/server/firebase-admin";
import { formatVndPrice } from "@/server/money";
import { serializeFirestoreValue } from "@/server/firestore/serialize";
import type { AccountPage, Article, Blog, CartPage, Collection, HomePage, ProductCardData, RouteEntry, SearchPage, SiteSettings, StaticContentPage, UnknownPage } from "@/content/types";
import type { ProductCardApi, ProductDocument } from "@/server/firestore/models";

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

export async function getSiteSettings() {
  const snapshot = await getCollection("siteSettings").doc("main").get();

  return docData<SiteSettings>(snapshot);
}

export async function getHome() {
  const snapshot = await getCollection("home").doc("main").get();

  return docData<HomePage & { href: string; slug: string; type: "home" }>(snapshot);
}

export async function getProduct(slug: string) {
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
}

export async function listProducts(options: ProductListOptions): Promise<ProductListResult> {
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
}

export async function listCollections() {
  const snapshot = await getCollection("collections").get();

  return snapshot.docs
    .map((doc) => docData<Collection>(doc))
    .filter((collection): collection is Collection & { id: string } => Boolean(collection))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export async function getCollectionBySlug(slug: string) {
  const snapshot = await getCollection("collections").doc(slug).get();

  return docData<Collection>(snapshot);
}

export async function getPage(slug: string) {
  const snapshot = await getCollection("pages").doc(slug).get();

  return docData<StaticContentPage>(snapshot);
}

export async function getBlog(slug: string) {
  const snapshot = await getCollection("blogs").doc(slug).get();

  return docData<Blog>(snapshot);
}

export async function getArticle(slug: string) {
  const snapshot = await getCollection("articles").doc(slug).get();

  return docData<Article>(snapshot);
}

export async function getAccountPage(slug: string) {
  const snapshot = await getCollection("accounts").doc(slug).get();

  return docData<AccountPage>(snapshot);
}

export async function getCartPage() {
  const snapshot = await getCollection("cart").doc("main").get();

  return docData<CartPage>(snapshot);
}

export async function getSearchPage() {
  const snapshot = await getCollection("search").doc("main").get();

  return docData<SearchPage>(snapshot);
}

export async function getUnknownPage(slug: string) {
  const snapshot = await getCollection("unknownPages").doc(slug).get();

  return docData<UnknownPage>(snapshot);
}

export async function getRoute(path: string) {
  const snapshot = await getCollection("routes").doc(sanitizeDocId(path)).get();

  return docData<RouteEntry>(snapshot);
}

export async function listRoutes() {
  const snapshot = await getCollection("routes").get();

  return snapshot.docs
    .map((doc) => docData<RouteEntry>(doc))
    .filter((route): route is RouteEntry & { id: string } => Boolean(route))
    .sort((left, right) => left.route.localeCompare(right.route));
}

export async function searchStorefront(query: string, type?: string, limit = 48) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  type SearchItem = { author?: string; href: string; imageUrl?: string; price?: string; title: string; type: string };

  const snapshot = await getCollection("searchIndex").get();

  return snapshot.docs
    .map((doc) => docData<SearchItem>(doc))
    .filter((item): item is SearchItem & { id: string } => Boolean(item))
    .filter((item) => !type || item.type === type)
    .filter((item) => [item.title, item.author, item.type].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery))
    .slice(0, limit);
}
