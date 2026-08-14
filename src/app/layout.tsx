import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/(core)/globals.css";
import { LocaleProvider } from "@/core/providers/LocaleContext";
import { ThemeProvider } from "@/core/providers/ThemeContext";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      data-theme="dark"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <Script src="/theme-bootstrap.js" strategy="beforeInteractive" />
        <link
          rel="preconnect"
          href={getPublicAssetOrigin()}
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href={getPublicAssetOrigin()} />
        <link
          rel="preload"
          href="/fonts/ClashDisplay-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Pretendard/subset/Pretendard-Regular.subset.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Pretendard/subset/Pretendard-Bold.subset.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme="dark">
          <LocaleProvider initialLocale="ko">
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
