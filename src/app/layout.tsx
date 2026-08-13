import type { Metadata } from "next";
import { connection } from "next/server";
import { cookies } from "next/headers";
import "@/styles/(core)/globals.css";
import { LocaleProvider, type Locale } from "@/core/providers/LocaleContext";
import { ThemeProvider, type Theme } from "@/core/providers/ThemeContext";
import { getSiteUrl } from "@/core/config/public-env";
import { getPublicAssetOrigin } from "@/core/storage/public-url";
import { SITE_DESCRIPTION, SITE_NAME } from "@/core/seo/metadata";

import DisclaimerBanner from "@/core/components/banner/DisclaimerBanner";
import SkipLink from "@/core/components/a11y/SkipLink";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: { default: "THE MUZE ENTERTAINMENT", template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "THE MUZE ENTERTAINMENT",
    description: SITE_DESCRIPTION,
    images: ["/images/og_image.png"],
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("muze-locale")?.value;
  const cookieTheme = cookieStore.get("muze-theme")?.value;
  const initialLocale: Locale = cookieLocale === "ko" || cookieLocale === "en" || cookieLocale === "ja" ? cookieLocale : "ko";
  const initialTheme: Theme = cookieTheme === "dark" || cookieTheme === "light" ? cookieTheme : "dark";

  return (
    <html lang={initialLocale} data-theme={initialTheme} className="h-full antialiased">
      <head>
        <link rel="preconnect" href={getPublicAssetOrigin()} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={getPublicAssetOrigin()} />
        <link rel="preload" href="/fonts/ClashDisplay-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Pretendard/subset/Pretendard-Regular.subset.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Pretendard/subset/Pretendard-Bold.subset.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={initialTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            <SkipLink />
            {false && <DisclaimerBanner />}
            {children}
            <Analytics />
            <SpeedInsights />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
