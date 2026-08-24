# Domains: this repository is the application host

Dwelve runs the pattern used by products like bridgemind.ai, as **two
repositories**:

| Repo | Host | Serves | Indexable |
|---|---|---|---|
| `DwelveOrg/frontend` | `dwelve.uz` | Marketing site (landing, future pricing/about/blog) | Yes — owns robots allow-rules and `sitemap.xml` |
| `DwelveOrg/app` (this one) | `app.dwelve.uz` | Auth, dashboard, studio, exam, invites — the product | Never |

The split was executed on 2026-08-24 at the maintainer's direction (decision
log of the earlier single-repo design). Each repo is its own Vercel project
with its own domain; there is no host sniffing left in either.

## What "never indexable" means here

Three layers, all unconditional in this repo:

1. `src/proxy.ts` stamps `X-Robots-Tag: noindex, nofollow` on **every**
   response. This is the layer that actually keeps URLs out of search
   results — robots.txt alone only forbids crawling, and link-discovered
   URLs would still be indexed as bare stubs.
2. `src/app/robots.txt/route.ts` answers `Disallow: /` on every hostname —
   production, previews, localhost.
3. Every layout already carries `PRIVATE_ROBOTS` metadata (`noindex`).

There is no sitemap in this repository; the sitemap belongs to marketing.

## Routing facts

- `/` has no page. The proxy resolves it by session — `/dashboard` when
  signed in, `/login` when not — with a 307 and no-store headers, because
  the destination depends on auth state.
- The auth screens' "back to home" links go through `marketingHref()` in
  `src/lib/hosts.ts`, which is always absolute onto `https://dwelve.uz`
  (`SITE_URL` in `src/lib/seo.ts`): the marketing pages do not exist on this
  deployment. Everything else uses relative paths.
- Old application URLs on `dwelve.uz` (bookmarks, emailed invite and
  password-reset links) keep working because the **marketing** repo 308s
  every application path here with path and query preserved.
- The retired `/settings` routes still 307 to `/profile` tabs via
  `next.config.ts`.

## Deployment expectations

- Vercel project with domain `app.dwelve.uz`.
- Env: `DWELVE_API_BASE_URL`, `SESSION_SECRET`, and production
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (its OAuth client must list
  `https://app.dwelve.uz` in authorized JavaScript origins), optional
  support contact vars.
- The backend's `FRONTEND_URL` must be `https://app.dwelve.uz` — it drives
  CORS and the absolute links in password-reset and invite emails.
- Local development needs none of this; `npm run dev` behaves as before
  (root `/` redirects to `/login`).

Cross-repo rule: marketing pages, indexable routes, and sitemap entries are
never added here — they go to `DwelveOrg/frontend`. If a feature seems to
need a public indexable page, it belongs there, linking into the app.
