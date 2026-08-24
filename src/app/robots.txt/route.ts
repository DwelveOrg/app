import { NextRequest, NextResponse } from "next/server";

import { publicRoutes } from "@/app/(authentication)/_constants/routes";
import { getRequestDomain } from "@/lib/hosts";
import { SITE_URL } from "@/lib/seo";
import { PRIVATE_ROUTE_PREFIXES } from "@/lib/seo-routes";

// The answer depends on the request's Host header, so this can never be
// prerendered into one static file.
export const dynamic = "force-dynamic";

/**
 * Host-aware robots.txt — a route handler rather than a `robots.ts` metadata
 * route, because metadata routes render once per deployment and this file must
 * differ per hostname:
 *
 * - Marketing host: crawlable. Application families are disallowed, and so are
 *   the auth pages — they already emit `noindex`, but disallowing them here
 *   spares crawlers from following every landing CTA into a redirect. The
 *   sitemap is advertised only here.
 * - App host, previews, localhost: disallowed outright. Only the canonical
 *   marketing host presents an indexable face; the app host additionally sends
 *   `X-Robots-Tag: noindex` on every response (see `src/proxy.ts`).
 */
export function GET(request: NextRequest) {
  const lines =
    getRequestDomain(request.headers.get("host")) === "marketing"
      ? [
          "User-Agent: *",
          "Allow: /",
          ...[...PRIVATE_ROUTE_PREFIXES, ...publicRoutes].map(
            (prefix) => `Disallow: ${prefix}`,
          ),
          "",
          `Sitemap: ${SITE_URL}/sitemap.xml`,
        ]
      : ["User-Agent: *", "Disallow: /"];

  return new NextResponse(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain" },
  });
}
