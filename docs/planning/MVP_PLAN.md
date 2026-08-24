# Current Product Gaps

This is a gap register, not an implementation queue. Re-check code and confirm priority with the
maintainer before treating an item as planned work.

## Verified gaps

- The application has no first-party automated test suite; CI relies on lint, TypeScript, contrast,
  build, and dependency audit gates.
- `/assignments/homework` is present but does not provide a complete homework workflow.
- Deployment pins the Vercel function region to `sin1`, but backend/database region co-location has
  not been verified in repository configuration.
- File imports can be larger at the backend than the application's Vercel Server Action transport
  permits; see [`../features/problem-reporting.md`](../features/problem-reporting.md) and
  `src/lib/uploads/limits.ts`.
- No analytics or client error-monitoring integration is present.

## Needs verification

- End-to-end behavior of every role × school-membership transition against a production-like backend.
- Browser behavior for GPU-, clipboard-, fullscreen-, and leave-screen-dependent flows.
- Current production domain, DNS, backend region, and rollback process outside the checked-in Vercel
  application configuration.

Feature-level limitations belong in the relevant file under `docs/features/`. Dated records in this
directory are historical and must not override current code.
