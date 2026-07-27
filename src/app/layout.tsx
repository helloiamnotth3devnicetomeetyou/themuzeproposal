import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { cookies, headers } from "next/headers";
import "@/styles/(core)/globals.css";
import { LocaleProvider, type Locale } from "@/core/providers/LocaleContext";
import { ThemeProvider, type Theme } from "@/core/providers/ThemeContext";
import { getSiteUrl } from "@/core/config/public-env";
import { SITE_DESCRIPTION, SITE_NAME } from "@/core/seo/metadata";

import DisclaimerBanner from "@/core/components/banner/DisclaimerBanner";

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

const isLocale = (value?: string): value is Locale => value === "ko" || value === "en" || value === "ja";
const isTheme = (value?: string): value is Theme => value === "dark" || value === "light";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("muze-locale")?.value;
  const themeCookie = cookieStore.get("muze-theme")?.value;
  const initialLocale: Locale = isLocale(localeCookie) ? localeCookie : "ko";
  const initialTheme: Theme = isTheme(themeCookie) ? themeCookie : "dark";
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <html lang={initialLocale} data-theme={initialTheme} className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={initialTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            <DisclaimerBanner />
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
