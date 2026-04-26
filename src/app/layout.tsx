import type { Metadata } from "next";

import { LanguageProvider } from "@/components/language-provider";
import { getSiteAssets } from "@/lib/storefront";
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

  return (
    <html lang="vi">
      <head>
        {siteAssets.stylesheetUrls.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body className="site-body" suppressHydrationWarning>
        <LanguageProvider initialLocale="vi">{children}</LanguageProvider>
      </body>
    </html>
  );
}
