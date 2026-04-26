import type { Metadata } from "next";
import { cookies } from "next/headers";

import { LanguageProvider } from "@/components/language-provider";
import { getSiteAssets } from "@/lib/storefront";
import { localeCookieName, normalizeLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiệm sách Quýt Rebuild",
  description: "Next.js rebuild for a public storefront",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteAssets = await getSiteAssets();
  const locale = normalizeLocale((await cookies()).get(localeCookieName)?.value);

  return (
    <html lang={locale}>
      <head>
        {siteAssets.stylesheetUrls.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body className="site-body" suppressHydrationWarning>
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
