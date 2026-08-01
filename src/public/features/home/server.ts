import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/core/config/public-env";
import { getPublicHomeSlides } from "./repository";

const { url, anonKey } = getPublicSupabaseConfig();

export const getPublicHomeSlidesForPage = () => getPublicHomeSlides(createClient(url, anonKey));
