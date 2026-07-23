import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "./context/LocaleContext";
import { ThemeProvider } from "./context/ThemeContext";
import MainLayout from "../components/MainLayout";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "THE MUZE ENTERTAINMENT",
  description: "THE MUZE Entertainment - Artists, Music, Auditions & News.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${montserrat.variable} h-full antialiased`}>
      <body id="dummybodyid" className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }} suppressHydrationWarning>
        <ThemeProvider>
          <LocaleProvider>
            <MainLayout>{children}</MainLayout>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
