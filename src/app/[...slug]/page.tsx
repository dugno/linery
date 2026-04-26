import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import SitePage from "@/components/site-page";
import { localeCookieName, normalizeLocale } from "@/lib/i18n";
import { getAllRoutes, getSiteSettings, getStorefrontPage } from "@/lib/storefront";

type CatchAllPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

function toPath(slug: string[]) {
  return `/${slug.join("/")}`;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const routes = await getAllRoutes();

  return routes
    .filter((route) => route.route !== "/")
    .map((route) => ({
      slug: route.route.replace(/^\/+/, "").split("/"),
    }));
}

export async function generateMetadata({
  params,
}: CatchAllPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStorefrontPage(toPath(slug));

  if (!page) {
    notFound();
  }

  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: {
      canonical: page.seo.canonical,
    },
  };
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;
  const page = await getStorefrontPage(toPath(slug));
  const settings = await getSiteSettings();
  const locale = normalizeLocale((await cookies()).get(localeCookieName)?.value);

  if (!page) {
    notFound();
  }

  return <SitePage locale={locale} page={page} settings={settings} />;
}
