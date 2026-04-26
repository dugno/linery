import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import SitePage from "@/components/site-page";
import { localeCookieName, normalizeLocale } from "@/lib/i18n";
import { getSiteSettings, getStorefrontPage } from "@/lib/storefront";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getStorefrontPage("/");

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

export default async function HomePage() {
  const page = await getStorefrontPage("/");
  const settings = await getSiteSettings();
  const locale = normalizeLocale((await cookies()).get(localeCookieName)?.value);

  if (!page) {
    notFound();
  }

  return <SitePage locale={locale} page={page} settings={settings} />;
}
