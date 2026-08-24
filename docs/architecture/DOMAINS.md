# Domains: marketing site vs. application

Dwelve runs the pattern used by products like bridgemind.ai: the apex domain is
a pure marketing site that search engines index, and the product lives on an
`app.` subdomain that search engines never see.

| Host | Serves | Indexable |
|---|---|---|
| `dwelve.uz` | Landing page (and future marketing pages: pricing, about, blog) | Yes — owns `robots.txt` allow rules and `sitemap.xml` |
| `app.dwelve.uz` | Everything else: auth, dashboard, studio, exam, invites | Never — robots disallow **and** `X-Robots-Tag: noindex` on every response |
| anything else (localhost, previews) | Combined single host, exactly as before the split | No — robots disallow |

Both hostnames point at the **same Next.js deployment**. There is no second
repository and no second project: `src/proxy.ts` reads the request's `Host`
header and routes accordingly. One codebase, one deploy, two faces.

## Why the app host sends `X-Robots-Tag`

`robots.txt: Disallow: /` forbids *crawling*, not *indexing*: a URL discovered
through an external link still enters the index as a bare stub (this happened
to bridgemind — `app.bridgemind.ai` is in Google's index today). The header is
what actually keeps application URLs out of results. It is set centrally in
`src/proxy.ts` for every app-host response.

## The activation switch: `NEXT_PUBLIC_APP_URL`

The split is entirely gated on this env var so the code can merge and deploy
**before** the subdomain exists. While unset:

- landing CTAs render relative `/login`, `/signup` links;
- the proxy never classifies a request as the app host and never redirects
  application URLs off the marketing host;
- `dwelve.uz` still serves its indexable robots/sitemap (host identity for
  those comes from the `SITE_URL` constant, not from the switch).

Behaviour is identical to the pre-split site. Deploying the branch with the
var unset is safe; a redirect to a hostname that does not resolve yet would
take the product down, which is exactly what the gate prevents.

`NEXT_PUBLIC_*` values are inlined at build time: activating or deactivating
the split requires a redeploy, not just an env edit.

## Request flows once active

| Request | Result |
|---|---|
| `dwelve.uz/` | Landing page (unchanged) |
| `dwelve.uz/dashboard`, `/login`, `/invite/teacher/<token>`, any app family | `308` → same path + query on `app.dwelve.uz` — old bookmarks and emailed links (invites, password resets) keep working |
| `dwelve.uz/robots.txt` | Allow, with app families and auth pages disallowed; advertises the sitemap |
| `dwelve.uz/sitemap.xml` | Marketing URLs only |
| `app.dwelve.uz/` | `307` → `/dashboard` when signed in, `/login` when not (no landing page on the app host) |
| `app.dwelve.uz/dashboard` etc. | Normal app behaviour (auth guard, token refresh — untouched) |
| `app.dwelve.uz/robots.txt` | `Disallow: /` |
| `app.dwelve.uz/sitemap.xml` | `308` → `dwelve.uz/sitemap.xml` |
| `www.dwelve.uz/*`, `dwelve.vercel.app/*` | `308` → `dwelve.uz/*` (pre-existing config redirect), then host routing applies |

Cross-host links in the UI go through two helpers in `src/lib/hosts.ts`:
`appHref()` (landing → app: the login/signup CTAs) and `marketingHref()`
(app → landing: the auth screens' "back to home"). Everything else in the app
keeps using relative paths and needs no awareness of the split — new dashboard
pages, new landing sections, and new auth flows all work without touching this
machinery. A new *indexable marketing page* (e.g. `/pricing`) additionally
registers in `PUBLIC_INDEXABLE_ROUTES` (`src/lib/seo-routes.ts`) so the
sitemap picks it up.

## Where the pieces live

- `src/lib/hosts.ts` — host classification and the two cross-host link helpers.
- `src/proxy.ts` — marketing-host 308s, app-host root redirect, `X-Robots-Tag`.
  On the marketing host the proxy skips session decryption and token refresh
  entirely: nothing there reads auth, and rotating a single-use refresh token
  for a marketing pageview would strand the app host's copy of the session.
- `src/app/robots.txt/route.ts`, `src/app/sitemap.xml/route.ts` — host-aware
  route handlers. These replaced the static `robots.ts` / `sitemap.ts`
  metadata routes, which render once per deployment and cannot vary by host.

## Activation runbook (in order)

1. **Deploy the branch** with `NEXT_PUBLIC_APP_URL` unset. Verify nothing
   changed in production.
2. **DNS + hosting**: add `app.dwelve.uz` as a domain on the same Vercel
   project; create the CNAME record Vercel asks for. Wait until
   `https://app.dwelve.uz` serves the site (it will behave as a combined host
   until step 3).
3. **Flip the switch**: set `NEXT_PUBLIC_APP_URL=https://app.dwelve.uz` in the
   Vercel *production* environment only, and redeploy.
4. **Backend**: set `FRONTEND_URL=https://app.dwelve.uz` on the backend
   deployment. This drives CORS and the absolute links in password-reset and
   teacher-invite emails; env validation already requires `https://` in
   production. Old emails with `dwelve.uz` links keep working through the 308.
5. **Google OAuth**: in the Google Cloud console, add
   `https://app.dwelve.uz` to the OAuth client's authorized JavaScript
   origins (keep `https://dwelve.uz` during the transition). Google sign-in
   renders on the login/signup pages, which now live on the app host.
6. **Search Console**: keep the `dwelve.uz` property as-is. App URLs that were
   ever indexed will fall out on their own (they now 308 to a noindexed host).
   Optionally add an `app.dwelve.uz` property purely to monitor that it stays
   out of the index.
7. **Expect one forced re-login for everyone.** The session cookie is host-only
   on `dwelve.uz`; the app host cannot read it. There is no way around this
   short of widening the cookie to the parent domain, which would be a
   security regression — the marketing host has no business holding sessions.

Rollback at any point: unset `NEXT_PUBLIC_APP_URL` and redeploy. The site
reverts to combined single-host behaviour on `dwelve.uz`; remove the
`app.dwelve.uz` domain from the project afterwards if abandoning the split
(sessions created on the app host are lost with it, same one-time re-login).

## When the marketing site earns its own repository

One repo is the right shape **while marketing is a landing page**. The moment
it stops being one, a separate marketing repo/project stops being overhead and
starts being the correct structure. The triggers below are the definition of
"stops being one" — they were agreed with the maintainer when the domain split
shipped, so nobody has to re-litigate the question from scratch.

### Hard triggers — any single one is enough to raise the split

1. **Editorial content**: a blog, news, changelog, or any CMS-driven content
   is requested — content that publishes on its own cadence and needs an
   editing workflow does not belong inside the product deployment.
2. **A different stack**: the maintainer wants marketing built with another
   tool (Astro, Framer, Webflow, a static-site generator, anything not this
   Next.js app).
3. **A non-developer editor**: a marketer, designer, or content person needs
   to change marketing pages on their own schedule without touching product
   code.

### Soft triggers — two or more together raise the split

4. **Scale**: `PUBLIC_INDEXABLE_ROUTES` in `src/lib/seo-routes.ts` grows past
   **8 indexable marketing pages** (landing + pricing + about + a few product
   pages is the natural ceiling for the in-repo setup).
5. **Design divergence**: marketing wants to break from the product design
   system — its own fonts, campaign branding, seasonal looks. Shared tokens
   are the main benefit of one repo; when they stop being shared, the benefit
   is gone.
6. **Build weight**: marketing assets (video, heavy imagery, many pages)
   measurably slow `next build` or bloat the repo.
7. **Deploy cadence**: marketing edits start shipping clearly more often than
   product changes, so most production deploys carry zero product value but
   full product risk.

### Agent rule — binding

Any agent working in this repository that adds to or changes the marketing
surface — `src/app/(landing)`, `PUBLIC_INDEXABLE_ROUTES`, or new
marketing-facing routes — must check the triggers above **before**
implementing:

- If a trigger fires, **stop and tell the maintainer** which trigger fired,
  in plain language, and ask permission to plan the repo split. Do **not**
  create a repository, move code, or restructure on your own initiative —
  the split happens only on an explicit yes.
- If the maintainer declines, record the decision in the log below (date,
  trigger, verdict) and continue in-repo. Do not raise it again until a
  *different* trigger fires — a recorded "no" is an answer, not a nag timer.
- If no trigger has fired, do not propose the split at all; preemptive
  splitting is exactly the overhead this document exists to prevent.

### Decision log

*(empty — no trigger has fired yet)*

### What the split will look like when it happens

Roughly an afternoon, in this order: create the marketing project; move
`src/app/(landing)` plus the small pieces it leans on (logo lockup, Button,
fonts/tokens, the `landing.*` i18n strings); point `dwelve.uz` at the new
project; then in this repo delete the marketing-host branch from
`src/proxy.ts` and the `(landing)` group. The app host and its sealed
robots/`X-Robots-Tag` behaviour stay exactly as they are; the new repo takes
over `robots.txt` and `sitemap.xml` for `dwelve.uz`. Auth stays here — only
marketing moves. The `appHref()`/`marketingHref()` helpers already isolate
every cross-host link, which is what keeps this an afternoon and not a
rewrite.
