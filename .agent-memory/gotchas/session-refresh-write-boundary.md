# Session Refresh Write Boundary

## Context

Refresh tokens rotate and are single-use. A refresh that succeeds but cannot persist the replacement
token destroys the next refresh path.

## Knowledge

`src/proxy.ts` proactively refreshes expiring access tokens before the protected render. Shared
refresh logic lives in `src/app/(authentication)/_lib/token-refresh.ts`, while cookie construction is
centralized in `session-cookie.ts`. A reactive request through `authedBackendJson` must call
`canPersistSession` and decline refresh when the current Server Component boundary cannot write the
replacement cookie.

## Relevant files

- `src/proxy.ts`
- `src/app/(authentication)/_lib/backend.ts`
- `src/app/(authentication)/_lib/token-refresh.ts`
- `src/app/(authentication)/_lib/session-cookie.ts`

## Implications

Do not make Server Component reads spend a refresh token and then attempt a forbidden cookie write.
Keep proxy and server-action cookie attributes identical. Treat changes here as high risk and test
expiry, rotation, concurrent requests, and logout behavior.
