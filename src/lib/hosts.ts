import { SITE_URL } from "@/lib/seo";

/**
 * This repository is the application host (`app.dwelve.uz`) of the two-repo
 * split; the marketing site lives in `DwelveOrg/frontend` and owns
 * `dwelve.uz`. See `docs/architecture/DOMAINS.md`.
 *
 * Links that leave the application for the marketing site — the auth screens'
 * "back to home" — are always absolute onto the marketing origin, because the
 * marketing pages do not exist on this deployment at all.
 */
export function marketingHref(path: "/" | `/${string}`): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
