import type { Metadata } from "next";

import { LanguageProvider } from "@/components/language-provider";
import { getSiteAssets, getSiteSettings } from "@/lib/storefront";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linery book",
  description: "Next.js rebuild for a public storefront",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteAssets, siteSettings] = await Promise.all([getSiteAssets(), getSiteSettings()]);

  return (
    <html lang="vi">
      <head>
        <link rel="icon" href={siteSettings.logo?.src || "/favicon.ico"} />
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
