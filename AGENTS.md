# Dwelve Application Agent Guide

## Project identity

This repository is the authenticated Dwelve product at `app.dwelve.uz`. Dwelve serves schools and
learning centers: administrators manage organizations and classes, teachers create and review
tests, and students join classes and take exams. The product is active and substantial, but several
flows still have explicit gaps documented under `docs/features/` and `docs/planning/`.

The public, indexable website is the sibling `frontend` repository. Do not add marketing pages or a
sitemap here.

## Technology stack

- Next.js 16 App Router, React 19, strict TypeScript, Node.js 22+
- Tailwind CSS 4 with repository-owned semantic tokens and shadcn/Radix primitives
- Server Actions via `next-safe-action`; backend payload validation with Zod
- TanStack Query for client server-state and React Hook Form for forms
- Encrypted JWE session cookies via `jose`; i18next for English, Russian, and Uzbek Latin
- NestJS/PostgreSQL backend in the sibling `backend_nestJS` repository
- Vercel deployment; ESLint, TypeScript, contrast checks, and production build are the quality gates

## Repository map

```text
src/app/                    App Router routes and layouts
  (authentication)/        Login, signup, reset, and session flows
  (root)/                  Authenticated dashboard and school workflows
  studio/                  Test authoring
  exam/                    Test cover, attempts, and results
  invite/                  Invite acceptance
  onboarding/              First-use membership choices
src/components/ui/         Low-level reusable UI primitives
src/components/Custom/     Product-specific shared components
src/lib/                    Session, backend, upload, SEO, and shared helpers
src/i18n/                   i18next setup and three locale catalogs
docs/                       Stable product and engineering knowledge
.agent-memory/              Decisions, discoveries, and gotchas worth retaining
scripts/                    Repository quality checks
```

Keep route-specific implementation beside its route in underscored folders such as `_components`,
`_lib`, `_types`, `_schemas`, and `_hooks`.

## Critical engineering rules

- Reuse `src/components/ui`, `src/components/Custom`, and route-local components before creating a
  new pattern. Use semantic tokens; do not introduce arbitrary colors, fonts, shadows, or spacing.
- Private backend traffic stays server-side. Components must not call the API origin directly.
  Follow `backendJson`/`authedBackendJson` -> named feature request -> Zod schema -> server action or
  server helper. Do not expose `DWELVE_API_BASE_URL` to the browser.
- Client-triggered JSON mutations use `next-safe-action`; multipart upload actions are the explicit
  exception. TanStack Query owns client server-state and invalidation.
- Treat backend JSON as untrusted until a Zod response schema has parsed it.
- Preserve the encrypted-session refresh path. Authenticated helpers may refresh tokens, but
  session writes must remain in a valid Server Action or Route Handler boundary.
- A user has a global identity but no global school role. Authorization comes from the selected
  school membership and must be enforced by the backend; hidden UI is not authorization.
- Signup never accepts a role. Teacher access requires a targeted invite or approved request;
  student access requires an invite, school/class credential, or approved request.
- Add user-visible copy to all three locale catalogs. Preserve Uzbek Latin and Russian Cyrillic.
- The application is unconditionally non-indexable. Preserve `X-Robots-Tag`, private metadata, and
  `robots.txt`; indexable routes belong in `frontend`.
- Respect the 4.5 MB Vercel request ceiling. Read `docs/features/problem-reporting.md` and the
  relevant upload limits before changing uploads.
- Do not add a dependency or duplicate a utility without first checking the existing stack.
- Do not change the database contract in this repository alone; coordinate schema/API changes with
  `backend_nestJS` and update both repositories' documentation.

## Default development loop

Before a non-trivial task:

1. Read this file and use `docs/README.md` to select only the relevant documentation.
2. Search `.agent-memory/` for the affected domain and follow useful wikilinks.
3. Inspect the current implementation, its callers, schemas, and backend contract.
4. Form a short plan and identify the files likely to change.

During implementation, stay within scope, preserve unrelated behavior, investigate before
replacing an abstraction, and keep the change coherent across UI, schemas, actions, and cache
invalidation. Update stable documentation when behavior changes. Record a memory only when a
non-obvious decision, limitation, recurring bug, or costly discovery deserves to outlive the task.

Before declaring completion, run the checks that apply:

```bash
npm run lint
npx tsc --noEmit
npm run check:contrast   # token or UI work
npm run build
```

Also exercise the affected flow, responsive layout, accessibility, auth/authorization boundary,
and API behavior where relevant. Review `git diff` and never claim a behavior works solely because
code was written. There is no first-party automated test suite at present.

> When implementation changes stable project behavior, update the relevant `/docs` source of truth
> in the same task.

> When you discover a non-obvious fact, decision, limitation, recurring bug, or important gotcha
> that future agents may otherwise rediscover, write or update a persistent memory note.

## Source priority

When sources conflict, investigate using this order: executable code; current configuration and
schemas; this file; current `/docs`; `.agent-memory`; historical plans, comments, and handoffs.
Documentation may describe an invariant the implementation is violating, so do not erase it without
resolving the conflict.

## Git and security

Work on the current branch unless the maintainer requests another. Preserve unrelated working-tree
changes. Never commit secrets, `.env.local`, generated output, or user-sensitive data. Treat session,
exam-integrity, file-upload, and membership changes as high risk.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
