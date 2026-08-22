import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

const PRIVATE_ROUTE_PREFIXES = [
  "/api/",
  "/assignments",
  "/dashboard",
  "/exam",
  "/groups",
  "/invite",
  "/notifications",
  "/onboarding",
  "/profile",
  "/school",
  "/schools",
  "/settings",
  "/studio",
  "/tests",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_ROUTE_PREFIXES],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
