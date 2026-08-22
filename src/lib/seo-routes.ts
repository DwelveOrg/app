import { SITE_URL } from "@/lib/seo";

/**
 * Public pages that are useful, canonical, and intentionally indexable.
 *
 * Keep this list explicit: application URLs must never enter the sitemap just
 * because a new App Router page is added. Auth pages and invite-token workflows
 * are publicly reachable, but they emit `noindex` and therefore do not belong
 * here.
 */
export const PUBLIC_INDEXABLE_ROUTES = [
  {
    pathname: "/",
    changeFrequency: "weekly",
    priority: 1,
  },
] as const;

/** Private application route families shared with the robots metadata route. */
export const PRIVATE_ROUTE_PREFIXES = [
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

/**
 * Builds sitemap URLs from the one production origin without introducing
 * trailing-slash, query-string, or alternate-host variants.
 */
export function canonicalRouteUrl(pathname: string) {
  if (
    !pathname.startsWith("/") ||
    pathname.includes("?") ||
    pathname.includes("#") ||
    (pathname.length > 1 && pathname.endsWith("/"))
  ) {
    throw new Error(`Invalid canonical sitemap pathname: ${pathname}`);
  }

  return pathname === "/" ? SITE_URL : `${SITE_URL}${pathname}`;
}
