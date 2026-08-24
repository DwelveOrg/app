import { NextResponse } from "next/server";

/**
 * The application host is never indexable, on any hostname — production,
 * previews, localhost. Crawling is refused here, and indexing of
 * link-discovered URLs is refused by the `X-Robots-Tag` header the proxy
 * sets on every response (robots.txt alone cannot do that).
 *
 * The indexable face of the product — robots allow-rules and the sitemap —
 * belongs to the marketing repository (`DwelveOrg/frontend`, dwelve.uz).
 */
export function GET() {
  return new NextResponse("User-Agent: *\nDisallow: /\n", {
    headers: { "Content-Type": "text/plain" },
  });
}
