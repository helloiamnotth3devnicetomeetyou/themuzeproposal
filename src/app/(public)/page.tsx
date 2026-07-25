import Home from "@/public/pages/home/page";
import { getCachedPublicHomeSlides } from "@/public/features/home/server";
import { createPageMetadata } from "@/core/seo/metadata";

export const revalidate = 300;
export const metadata = createPageMetadata("Home");

export default async function HomePage() {
  const slides = await getCachedPublicHomeSlides();
  return <Home initialSlides={slides} />;
}
