# Development, Environment, and Deployment

## Prerequisites and local workflow

- Node.js 22.13 or newer
- npm with the committed `package-lock.json`
- The sibling `backend_nestJS` service and its PostgreSQL/Redis dependencies for live flows

```bash
npm install
cp .env.example .env.local
npm run dev
```

The application opens at `http://localhost:3000`; the example environment targets the API at
`http://localhost:5001/api/v1`. Follow the [backend runner](../../../backend_nestJS/RUN_BACKEND.md)
for backend setup. Never point routine local sessions at production.

## Environment variables

| Variable                       | Purpose                                               |          Required | Exposure            |
| ------------------------------ | ----------------------------------------------------- | ----------------: | ------------------- |
| `DWELVE_API_BASE_URL`          | Versioned NestJS API origin                           |               Yes | Server only         |
| `SESSION_SECRET`               | Encrypt/decrypt the application JWE session cookie    |               Yes | Server only; secret |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Identity Services browser client ID            |                No | Public/browser      |
| `NEXT_PUBLIC_SUPPORT_EMAIL`    | Optional support email rendered in profile/support UI |                No | Public/browser      |
| `NEXT_PUBLIC_SUPPORT_TELEGRAM` | Optional Telegram support URL/handle                  |                No | Public/browser      |
| `NODE_ENV`                     | Framework build/runtime mode                          | Framework-managed | Server/build        |

`SESSION_SECRET` must be at least 32 characters in production. Never put a client secret, API key,
or credential in a `NEXT_PUBLIC_*` variable. The backend separately requires its own Google client
configuration when Google login is enabled.

## Commands and quality gates

| Command                  | Purpose                              |
| ------------------------ | ------------------------------------ |
| `npm run dev`            | Turbopack development server         |
| `npm run dev:webpack`    | Webpack development fallback         |
| `npm run lint`           | ESLint                               |
| `npx tsc --noEmit`       | Strict TypeScript validation         |
| `npm run check:contrast` | Design-token contrast assertions     |
| `npm run build`          | Production Next.js build via webpack |
| `npm run start`          | Serve an existing production build   |

No `npm test` script or first-party test framework is configured. CI in `.github/workflows/ci.yml`
runs install, lint, type-check, contrast, build, and `npm audit --audit-level=high`. CodeQL and
Dependabot are also configured.

Before completing meaningful work:

1. Run lint and TypeScript.
2. Run the relevant contrast check for token/UI changes.
3. Run a production build.
4. Exercise the affected flow with the appropriate role and backend state.
5. Check 375px, 834px, and 1440px, both themes, and all three languages for UI changes.
6. Review keyboard/focus behavior, reduced motion, errors, loading, empty state, and authorization.
7. Review the changed diff and update docs/memory where required.

## Deployment

Checked-in configuration indicates a Vercel deployment. `vercel.json` pins functions to `sin1`, and
`next.config.ts` builds the CSP/security headers, non-permanent legacy settings redirects, image-host
policy, and the 4.5 MB Server Action limit. The expected application host is `app.dwelve.uz`; see
[`../architecture/DOMAINS.md`](../architecture/DOMAINS.md).

Production requires the backend's CORS/email-link origin to agree with the application host. The
application deployment must retain its no-index proxy and robots behavior. Database migrations,
workers, Redis, object storage, and API rollout are backend responsibilities.

## Known operational gaps

- The actual backend/database deployment region is not checked into this repository, so co-location
  with Vercel `sin1` is **Needs verification**.
- Deployment triggers, environment promotion policy, DNS ownership, preview-data policy, and rollback
  procedure are **Unknown** from the repository.
- There is no checked-in end-to-end smoke test, analytics client, or browser error-monitoring client.
- Vercel rejects request bodies above 4.5 MB before application code. See
  [`../features/problem-reporting.md`](../features/problem-reporting.md).

## Troubleshooting

- Unexpected logout after refresh work: inspect proxy refresh and session-write eligibility before
  retrying from a Server Component. See `[[Session refresh write boundary]]` in memory.
- Image/PDF upload works locally but not deployed: compare the encoded multipart request with the
  platform ceiling and `src/lib/uploads/limits.ts`.
- Authenticated request fails in the browser: it should normally not originate there; trace the named
  server request and `DWELVE_API_BASE_URL`.
- Port 5000 on macOS may be another local service. The documented Dwelve backend port is 5001.
