import { SITE_URL } from "@/lib/seo";

/**
 * Origin of the application host (`https://app.dwelve.uz`) once the
 * marketing/app domain split is active, or `null` while it is not.
 *
 * The split is activated by configuration, not by code: set
 * `NEXT_PUBLIC_APP_URL` in the production environment (origin only — scheme +
 * host, no path, no trailing slash) after the subdomain exists in DNS and on
 * the hosting project. Until then this module must keep the deployment inert —
 * a redirect to a hostname that does not resolve would take the product down.
 * While unset: both link helpers below return relative paths, and
 * `getRequestDomain` can never classify a request as `"app"`, so the proxy's
 * split behaviour stays dormant and the site behaves exactly as a single host.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so activating (or
 * deactivating) the split requires a redeploy, not just an env change.
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? null;

const MARKETING_HOSTNAME = new URL(SITE_URL).hostname;
const APP_HOSTNAME = APP_URL ? new URL(APP_URL).hostname : null;

export type RequestDomain = "marketing" | "app" | "neutral";

/**
 * Classifies a request's `Host` header against the two canonical origins.
 *
 * `"marketing"` is the canonical public hostname from `SITE_URL` — recognised
 * whether or not the split is active, because robots/sitemap must present the
 * indexable face only there. `"app"` exists only while the split is active.
 * `"neutral"` is everything else — localhost, LAN addresses, preview
 * deployments — and keeps today's combined single-host behaviour, so local
 * development needs no host configuration.
 */
export function getRequestDomain(host: string | null): RequestDomain {
  if (!host) return "neutral";

  let hostname: string;

  try {
    // Parsing via URL strips a port suffix (`localhost:3000`) robustly.
    hostname = new URL(`http://${host}`).hostname.toLowerCase();
  } catch {
    return "neutral";
  }

  if (APP_HOSTNAME && hostname === APP_HOSTNAME) return "app";
  if (hostname === MARKETING_HOSTNAME) return "marketing";
  return "neutral";
}

/**
 * Href for links that leave the marketing site for the application — the
 * landing page's login / signup calls to action. Relative (same-host) until
 * the split is active, absolute onto the app origin afterwards.
 */
export function appHref(path: `/${string}`): string {
  return APP_URL ? `${APP_URL}${path}` : path;
}

/**
 * Href for links that leave the application for the marketing site — the auth
 * screens' "back to home". The bare origin stands in for `/` so the URL
 * matches the canonical form the sitemap advertises.
 */
export function marketingHref(path: "/" | `/${string}`): string {
  if (!APP_URL) return path;
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
