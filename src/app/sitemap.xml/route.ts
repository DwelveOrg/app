import { NextRequest, NextResponse } from "next/server";

import { getRequestDomain } from "@/lib/hosts";
import { SITE_URL } from "@/lib/seo";
import {
  canonicalRouteUrl,
  PUBLIC_INDEXABLE_ROUTES,
} from "@/lib/seo-routes";

// Host-dependent (see robots.txt/route.ts) — never prerender.
export const dynamic = "force-dynamic";

/**
 * Host-aware sitemap. The canonical marketing host serves it; the app host
 * points at the canonical copy instead of publishing a body full of another
 * host's URLs, which crawlers treat as a fault.
 */
export function GET(request: NextRequest) {
  if (getRequestDomain(request.headers.get("host")) === "app") {
    return NextResponse.redirect(`${SITE_URL}/sitemap.xml`, 308);
  }

  const entries = PUBLIC_INDEXABLE_ROUTES.map(
    ({ pathname, changeFrequency, priority }) =>
      [
        "  <url>",
        `    <loc>${canonicalRouteUrl(pathname)}</loc>`,
        `    <changefreq>${changeFrequency}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n"),
  );

  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries,
    `</urlset>`,
  ].join("\n");

  return new NextResponse(`${body}\n`, {
    headers: { "Content-Type": "application/xml" },
  });
}
