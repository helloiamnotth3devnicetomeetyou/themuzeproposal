import Home from "@/public/pages/home/page";
import { getPublicHomeSlidesForPage } from "@/public/features/home/server";
import { createPageMetadata } from "@/core/seo/metadata";

export const metadata = createPageMetadata("Home");

export default async function HomePage() {
  const slides = await getPublicHomeSlidesForPage();
  return <Home initialSlides={slides} />;
}
