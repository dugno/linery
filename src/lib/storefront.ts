import {
  getAccountPage,
  getArticle,
  getBlog,
  getCartPage,
  getCollectionBySlug,
  getHome,
  getPage,
  getProduct,
  getRoute,
  getSearchPage,
  getSiteSettings as getFirestoreSiteSettings,
  getUnknownPage,
  listRoutes,
} from "@/server/firestore/storefront";
import type { RouteEntry, StorefrontPage } from "@/content/types";

function normalizeRoute(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export async function getSiteSettings() {
  const settings = await getFirestoreSiteSettings();

  if (!settings) {
    throw new Error("Site settings not found in Firestore.");
  }

  return settings;
}

export async function getSiteAssets() {
  const settings = await getSiteSettings();

  return {
    stylesheetUrls: [...new Set(settings?.stylesheets || [])],
  };
}

export async function getAllRoutes(): Promise<RouteEntry[]> {
  return listRoutes();
}

export async function getStorefrontPage(path: string): Promise<StorefrontPage | null> {
  const route = await getRoute(normalizeRoute(path));

  if (!route) {
    return null;
  }

  switch (route.entityType) {
    case "account":
      return getAccountPage(route.slug);
    case "home":
      return getHome();
    case "product":
      return getProduct(route.slug) as Promise<StorefrontPage | null>;
    case "collection":
      return getCollectionBySlug(route.slug) as Promise<StorefrontPage | null>;
    case "page":
      return getPage(route.slug) as Promise<StorefrontPage | null>;
    case "blog":
      return getBlog(route.slug) as Promise<StorefrontPage | null>;
    case "article":
      return getArticle(route.slug) as Promise<StorefrontPage | null>;
    case "cart":
      return getCartPage();
    case "search":
      return getSearchPage();
    case "unknown":
      return getUnknownPage(route.slug);
    default:
      return null;
  }
}
