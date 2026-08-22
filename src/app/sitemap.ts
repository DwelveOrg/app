import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * Only the landing page is public marketing content today. Auth, invite-token,
 * and application routes are intentionally excluded because they are not
 * canonical public content and may expose user-specific workflow URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
