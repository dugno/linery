import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SitePage from "@/components/site-page";
import { getSiteSettings, getStorefrontPage } from "@/lib/storefront";

export const revalidate = 300;

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

  if (!page) {
    notFound();
  }

  return <SitePage locale="vi" page={page} settings={settings} />;
}
