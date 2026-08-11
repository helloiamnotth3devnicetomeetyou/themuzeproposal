import Home from "@/public/pages/home/page";
import { getPublicHomeSlidesForPage } from "@/public/features/home/server";
import { createPageMetadata } from "@/core/seo/metadata";
import { preload } from "react-dom";

export const metadata = createPageMetadata("Home");

export default async function HomePage() {
  const slides = await getPublicHomeSlidesForPage();
  if (slides[0]?.typoLogoUrl) preload(slides[0].typoLogoUrl, { as: "image", crossOrigin: "anonymous", fetchPriority: "high" });
  return <>{slides[0]?.videoUrl && <link rel="preload" as="video" href={slides[0].videoUrl} fetchPriority="high" />}<Home initialSlides={slides} /></>;
}
