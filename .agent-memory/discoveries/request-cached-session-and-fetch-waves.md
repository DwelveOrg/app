# Request Cached Session and Fetch Waves

## Context

Application layouts and pages often need identity plus several independent backend resources.
Repeated session work and sequential reads add latency to every navigation.

## Knowledge

`getUser`/session-derived work is request-cached so callers in the same render do not repeat it.
Independent server reads are deliberately launched together and awaited as a fetch wave. Preserve
dependency ordering only where one response actually supplies input or authorization context for the
next.

The School page is also intent-loaded. Its initial admin render uses the
request-cached school detail for identity, permission, and aggregate counts;
hidden rosters, invitations, and blocklist data wait until their dialog/subtab
is opened. School mutations read `schoolId` from the encrypted session rather
than issuing a preliminary school-detail request solely to recover that id.

## Relevant files

- `src/app/(root)/_utils/getUser.ts`
- `src/app/(root)/layout.tsx`
- `src/app/(root)/(pages)/dashboard/page.tsx`
- `src/app/(root)/(pages)/school/page.tsx`
- `src/app/(root)/(pages)/school/_hooks/useSchoolDirectory.ts`
- `src/app/(root)/_lib/school-actions.ts`

## Implications

Do not convert independent reads back into serial awaits while refactoring. Before adding another
layout-level read, check whether it is duplicated downstream and whether it lengthens every route's
critical path. Do not move hidden admin-panel reads back into the School page bootstrap.
