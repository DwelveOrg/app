# Redis Backend Integration Notes

The NestJS backend now uses Redis for temporary auth and security state. Redis is
backend infrastructure only; the frontend must not connect to Redis directly.

## What Changed In The Backend

- Refresh sessions are stored in Redis instead of new `RefreshToken` database rows.
- `POST /auth/refresh` rotates refresh tokens. A refresh token can be used once.
- `POST /auth/logout` deletes the current Redis refresh session.
- `POST /auth/logout-all` was added for deleting all refresh sessions for the
  signed-in user.
- Sensitive auth and school onboarding routes can now return HTTP `429`.
- `GET /health` was added and reports API, PostgreSQL, and Redis status.

## Frontend Changes (implemented)

- `DWELVE_API_BASE_URL=http://localhost:5000/api/v1` is unchanged. No Redis env
  vars were added to the frontend.
- `refreshTokensRequest` and `authedBackendJson` already match the rotated
  refresh-token contract: `refreshAccessToken` in
  `src/app/(authentication)/_lib/backend.ts` saves the new `refreshToken`
  returned by `/auth/refresh`, so a rotated token replaces the used one.
- `logoutAllRequest` was added in `src/app/(authentication)/_lib/api.ts`:
  `POST /auth/logout-all`, called through `authedBackendJson` (Bearer auth).
- A `logoutAll()` server action sits next to `logout()` in
  `src/app/(authentication)/_lib/actions.ts`. It best-effort calls
  `logoutAllRequest`, then `deleteSession()`, then redirects to
  `/login?logout=all` (login shows a distinct confirmation toast).
- The settings security area exposes "Logout from all devices" via
  `SecuritySection.tsx` and the `LogoutAllButton` confirm dialog under
  `src/app/(root)/(pages)/(small-container)/profile/_components/`.
- Backend `429` responses are surfaced as a calm, intentional message
  (`getActionError` in `actions.ts` maps status `429` to a dedicated copy)
  across login, signup, google, create-school, and join-school actions.
- `healthRequest` (`GET /health`) exists in `api.ts` for admin/dev diagnostics.
  It is not called on normal user page loads.

## What Not To Change

- Do not install a Redis client in the frontend.
- Do not expose Redis URLs through `NEXT_PUBLIC_*`.
- Do not store refresh tokens in browser local storage. Keep the existing
  encrypted httpOnly session cookie flow.
- Do not change auth response schemas for login/signup/google/refresh; token
  response shape is still `{ accessToken, refreshToken }`.

## Local Development

Run Redis with the backend before testing auth flows:

```powershell
docker run --name dwelve-redis -p 6379:6379 redis:7-alpine
```

Then run the backend from `D:\IT\projects\Dwelve\backend_nestJS` and the
frontend from this repo:

```powershell
npm.cmd run dev
```

If Redis is not running, auth refresh/rate-limited flows may fail because those
sessions are no longer stored in PostgreSQL.
