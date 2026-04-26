export type MediaAsset = {
  alt?: string;
  height?: number;
  id: string;
  originalSrc?: string;
  src: string;
  width?: number;
};

export type SeoData = {
  canonical?: string;
  description?: string;
  title: string;
};

export type NavItem = {
  children: NavItem[];
  href: string;
  title: string;
};

export type FooterGroup = {
  links: {
    href: string;
    title: string;
  }[];
  title: string;
};

export type SiteSettings = {
  accountIcon?: MediaAsset;
  cartIcon?: MediaAsset;
  contact: {
    address?: string;
    email?: string;
    phone?: string;
  };
  footerGroups: FooterGroup[];
  footerLogo?: MediaAsset;
  logo?: MediaAsset;
  menu: NavItem[];
  searchIcon?: MediaAsset;
  stylesheets: string[];
  topBanner?: {
    href: string;
    text: string;
  };
};

export type ProductCardData = {
  comparePrice?: string;
  href: string;
  imageAlt: string;
  imageUrl: string;
  price: string;
  title: string;
  vendor?: string;
};

export type Product = {
  author?: string;
  bodyClass: string;
  bodyId: string;
  breadcrumbs: { href: string; title: string }[];
  collectionSlugs: string[];
  comparePrice?: string;
  condition?: string;
  descriptionHtml: string;
  href: string;
  image?: MediaAsset;
  price: string;
  relatedProductSlugs: string[];
  relatedProducts: ProductCardData[];
  seo: SeoData;
  slug: string;
  title: string;
  type: "product";
};

export type Collection = {
  bodyClass: string;
  bodyId: string;
  breadcrumbs: { href: string; title: string }[];
  descriptionHtml?: string;
  filters: { items: string[]; title: string }[];
  href: string;
  productSlugs: string[];
  products: ProductCardData[];
  seo: SeoData;
  slug: string;
  title: string;
  type: "collection";
};

export type HomeSection = {
  href?: string;
  products: ProductCardData[];
  title: string;
};

export type HomePage = {
  bodyClass: string;
  bodyId: string;
  sections: HomeSection[];
  seo: SeoData;
  sliderImage?: MediaAsset;
  sliderLink?: string;
  title: string;
};

export type StaticContentPage = {
  bodyClass: string;
  bodyId: string;
  breadcrumbs: { href: string; title: string }[];
  contentHtml: string;
  href: string;
  seo: SeoData;
  slug: string;
  title: string;
  type: "page";
};

export type Article = {
  author?: string;
  bodyClass: string;
  bodyId: string;
  contentHtml: string;
  date?: string;
  href: string;
  image?: MediaAsset;
  readingTime?: string;
  seo: SeoData;
  slug: string;
  title: string;
  type: "article";
};

export type Blog = {
  articles: {
    date?: string;
    href: string;
    image?: MediaAsset;
    readingTime?: string;
    summary?: string;
    title: string;
  }[];
  bodyClass: string;
  bodyId: string;
  href: string;
  seo: SeoData;
  slug: string;
  title: string;
  type: "blog";
};

export type CartPage = {
  bodyClass: string;
  bodyId: string;
  ctaHref?: string;
  ctaLabel?: string;
  emptyImage?: MediaAsset;
  href: string;
  message?: string;
  seo: SeoData;
  title: string;
  type: "cart";
};

export type SearchPage = {
  bodyClass: string;
  bodyId: string;
  href: string;
  queryPlaceholder: string;
  seo: SeoData;
  title: string;
  type: "search";
};

export type AccountPage = {
  bodyClass: string;
  bodyId: string;
  breadcrumbs: { href: string; title: string }[];
  href: string;
  mode: "login" | "register";
  seo: SeoData;
  slug: string;
  title: string;
  type: "account";
};

export type UnknownPage = {
  bodyClass: string;
  bodyId: string;
  contentHtml: string;
  href: string;
  seo: SeoData;
  slug: string;
  title: string;
  type: "unknown";
};

export type StorefrontPage =
  | (HomePage & { type: "home" })
  | Product
  | Collection
  | StaticContentPage
  | Article
  | Blog
  | CartPage
  | SearchPage
  | AccountPage
  | UnknownPage;

export type RouteEntry = {
  entityType:
    | "account"
    | "article"
    | "blog"
    | "cart"
    | "collection"
    | "home"
    | "page"
    | "product"
    | "search"
    | "unknown";
  route: string;
  slug: string;
};

export type SearchIndexItem = {
  author?: string;
  href: string;
  imageUrl?: string;
  price?: string;
  title: string;
  type: "article" | "collection" | "page" | "product";
};
