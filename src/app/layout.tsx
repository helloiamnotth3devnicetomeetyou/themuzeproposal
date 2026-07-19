import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "./context/LocaleContext";
import { ThemeProvider } from "./context/ThemeContext";
import MainLayout from "../components/MainLayout";

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
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <LocaleProvider>
            <MainLayout>{children}</MainLayout>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
