import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@/styles/(core)/globals.css";
import { LocaleProvider, type Locale } from "@/core/providers/LocaleContext";
import { ThemeProvider, type Theme } from "@/core/providers/ThemeContext";
import { getSiteUrl } from "@/core/config/public-env";
import { SITE_DESCRIPTION, SITE_NAME } from "@/core/seo/metadata";

import DisclaimerBanner from "@/core/components/banner/DisclaimerBanner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const dynamic = "force-dynamic";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });

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
  const initialLocale: Locale = "ko";
  const initialTheme: Theme = "dark";

  return (
    <html lang={initialLocale} data-theme={initialTheme} className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={initialTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            <DisclaimerBanner />
            {children}
            <Analytics />
            <SpeedInsights />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
