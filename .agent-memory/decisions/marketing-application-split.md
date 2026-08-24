# Marketing Application Split

## Context

Dwelve previously mixed public marketing and authenticated product routes. They now have different
hosts, indexing requirements, caching behavior, and release concerns.

## Knowledge

The `app` repository owns `app.dwelve.uz` and is always non-indexable. The sibling `frontend`
repository owns the public `dwelve.uz` marketing site, sitemap, and indexable metadata. Old product
paths on the marketing host are redirected to the application with path/query preserved.

## Relevant files

- `src/proxy.ts`
- `src/app/robots.txt/route.ts`
- `src/lib/hosts.ts`
- `docs/architecture/DOMAINS.md`
- `../frontend/src/proxy.ts`

## Implications

Do not add landing pages, public SEO routes, or a sitemap here. Do not weaken the app-wide
`X-Robots-Tag`, metadata, or robots policy. Some landing tokens, translation keys, and comments remain
as split residue; their presence does not change route ownership.

## Related memories

- [[Application residue after split]]
