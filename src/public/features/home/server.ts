import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { getPublicHomeSlides } from "./repository";

const { url, anonKey } = getPublicSupabaseConfig();

const getCachedPublicHomeSlides = unstable_cache(
  () => getPublicHomeSlides(createClient(url, anonKey)),
  ["public-home-slides"],
  { revalidate: 300, tags: ["public-home-slides"] },
);

export const getPublicHomeSlidesForPage = () => getCachedPublicHomeSlides();
