import type { Metadata } from "next";
import { connection } from "next/server";
import "@/styles/(core)/globals.css";
import { LocaleProvider, type Locale } from "@/core/providers/LocaleContext";
import { ThemeProvider, type Theme } from "@/core/providers/ThemeContext";
import { getSiteUrl } from "@/core/config/public-env";
import { SITE_DESCRIPTION, SITE_NAME } from "@/core/seo/metadata";

import DisclaimerBanner from "@/core/components/banner/DisclaimerBanner";
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
  const initialLocale: Locale = "ko";
  const initialTheme: Theme = "dark";

  return (
    <html lang={initialLocale} data-theme={initialTheme} className="h-full antialiased">
      <head>
        <link rel="preload" href="/fonts/ClashDisplay-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/pretendard/subset/Pretendard-Regular.subset.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/pretendard/subset/Pretendard-Bold.subset.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={initialTheme}>
          <LocaleProvider initialLocale={initialLocale}>
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
