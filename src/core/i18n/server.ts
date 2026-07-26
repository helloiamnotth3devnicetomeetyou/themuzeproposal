import "server-only";

import { cookies } from "next/headers";
import { isLocale, type Locale } from "./localized";

export async function getServerLocale(): Promise<Locale> {
  const value = (await cookies()).get("muze-locale")?.value;
  return isLocale(value) ? value : "ko";
}
