import type { MetadataRoute } from "next";

import {
  canonicalRouteUrl,
  PUBLIC_INDEXABLE_ROUTES,
} from "@/lib/seo-routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_INDEXABLE_ROUTES.map(({ pathname, ...metadata }) => ({
    url: canonicalRouteUrl(pathname),
    ...metadata,
  }));
}
