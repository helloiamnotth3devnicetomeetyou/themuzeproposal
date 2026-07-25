import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/core/config/public-env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/login", "/account", "/protect"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
