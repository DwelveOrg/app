# CLAUDE.md

Guidance for Claude Code when working in this repository.

Read `AGENTS.md` first for general repository rules.
Read `docs/README.md` for the documentation index and a task → document routing table.
Read `docs/guides/building-a-feature.md` before adding or changing any feature — it is the ordered playbook and links out to everything else.
Read `docs/product/PRD.md` for product scope and priorities.

Do not start UI work without reading the relevant one of these:

| Task | Document |
|---|---|
| Any UI change | `docs/design/component-library.md` — every shared component's props, variants, and rules |
| Page or panel layout | `docs/design/layout-and-composition.md` |
| Tokens: colour, type, elevation, motion | `docs/design/design-system.md` |
| Loading / empty / error / destructive / async | `docs/design/interaction-and-states.md` |
| Accessibility | `docs/design/accessibility.md` |
| Copy and translations | `docs/design/content-and-i18n.md` |
| Forms | `docs/architecture/FORMS.md` |
| Data fetching, caching, stale UI | `docs/architecture/RENDERING_AND_STATE.md` |
| Backend requests, schemas, libraries | `docs/architecture/ARCHITECTURE.md` |

This file is intentionally root-level because Claude Code uses root project guidance. Do not move it into `docs/`.

---

## Project

Dwelve, package name `dwelve-app`, is a Next.js App Router frontend for a digital academic testing and performance-management platform for schools and private learning centers.

Primary product areas:

- test creation
- test submission
- automated grading
- student/class analytics
- authentication
- trilingual UI

Stack noted in the existing project documentation:

**Dwelve** (package name `dwelve-app`) is a Next.js App Router frontend for a digital academic testing and performance-management platform for schools and learning centers — test creation, submission, automated grading, and analytics.

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS v4
- shadcn/ui with Radix primitives
- i18next / react-i18next
- next-themes
- react-hook-form + zod
- jose for JWT sessions
- motion
- three

Verify package versions in `package.json` before making dependency-specific changes.

---

## Commands

- `npm install` — restore dependencies from `package-lock.json`
- `npm run dev` — local dev server
- `npm run build` — production build and output validation
- `npm run start` — serve production build
- `npm run lint` — ESLint through `eslint.config.mjs`
- `npm run check:contrast` — WCAG gate over the `globals.css` token layer; must pass after any palette change

There is no configured `npm test` script in the uploaded guidance. Validate changes with `npm run lint`, `npm run build`, and manual route testing.

---

## Branch workflow

Use the `staging` branch for repository changes unless the maintainer explicitly says otherwise.

---

## Project structure

Routes live in `src/app`.

**This repository is the application host** (`app.dwelve.uz`) of a two-repo
split, bridgemind.ai-style. The marketing site — the landing page, robots
allow-rules, and the sitemap — lives in the separate `DwelveOrg/frontend`
repository and owns `dwelve.uz`. Nothing here is ever indexable:
`src/proxy.ts` stamps `X-Robots-Tag: noindex` on every response, `robots.txt`
disallows everything, and `/` resolves by session to `/dashboard` or
`/login`. Links back to the marketing site go through `marketingHref()` from
`src/lib/hosts.ts`; everything else stays relative. Marketing pages must not
be added to this repository. See `docs/architecture/DOMAINS.md`.

Known route groups:

- `src/app/(authentication)` — login, signup, password reset
- `src/app/(root)` — authenticated dashboard
- `src/app/(root)/(pages)` — dashboard pages
- `src/app/(root)/(pages)/(small-container)` — narrow-width pages such as profile, settings, notifications
- `src/app/studio` — test authoring. A separate environment: no sidebar, one document. See `docs/features/test-studio.md`.
- `src/app/exam` — sitting a test. The same idea from the student's side, with a stricter rule: while an attempt is live there is nothing else on screen to click. See `docs/features/test-taking.md`.

Shared test code that both environments (and the teacher's results screens) use:

- `src/lib/tests/` — the paper schemas, the answer shapes, and the question-presentation registry
- `src/components/tests/paper/` — **one** question renderer, in `answer` / `review` / `preview` modes, so what a student saw and what a teacher marks cannot drift apart
- `src/lib/motion/` — the motion variants, bound to the `--dur-*` / `--ease-*` tokens, with reduced-motion equivalents in one place

Shared code:

- `src/components/ui` — shadcn/ui primitives
- `src/components/Custom` — custom reusable components
- `src/lib` — helpers; `utils.ts` exports `cn` and `getInitials`
- `src/i18n` — translations and i18next setup
- `public/images` — static assets

Route-local code goes in underscored folders such as `_components`, `_constants`, `_types`, `_utils`, `_lib`, `_sections`, and `_types/_schemas`.

---

## Coding conventions

- Type everything.
- Prefer `@/*` path aliases over deep relative imports when crossing folders.
- Use PascalCase for component files.
- Use Next.js route file names such as `page.tsx` and `layout.tsx`.
- Use client-component suffixes such as `page-client.tsx` or `profile.client.tsx` when the existing codebase follows that pattern.
- Use Tailwind classes and `cn` from `@/lib/utils`.
- Dark mode uses the class strategy through `next-themes`.
- Forms use `react-hook-form` and `zod` schemas, commonly under `_types/_schemas`.
- Icons use `lucide-react`.

### Reuse before you create

Before adding any UI element, check whether a component for it already exists, and prefer it over re-styling from scratch:

- Look in `src/components/ui` (shadcn primitives), `src/components/Custom` (shared cross-app components), and the route-local `_components` folder.
- If the same visual element appears — or will appear — in more than one place, extract it into a single reusable component and use that everywhere, instead of copy-pasting inline Tailwind classes. One source of truth means one place to change.
- Drive shared values (colours, sizes, radii) from design-system tokens (`bg-primary`, `var(--primary)`, etc.), not hard-coded hex. Two call sites that hard-code different hexes for "the same" button is the bug this rule prevents.
- Promote a component up the tree as its reach grows: route-local `_components` → `src/components/Custom` (or `ui`) once it is used across route groups.

Reference examples: `src/components/ui/Button.tsx` is the only button in the product (variants cover primary, outline, ghost, destructive, and the landing `brand` treatment; `asChild` covers button-shaped links); `src/components/ui/Surface.tsx` is the only bordered container; the brand mark uses `src/components/Custom/DwelveLogo.tsx`.

`docs/design/component-library.md` is the full reference: the decision table in §2 answers "which component do I use", and §3–9 give every primitive's props and rules. `docs/design/design-system.md` §8 lists the same set at a glance.

---

## Auth and sessions

Existing guidance says:

- Session is a JWT in an httpOnly cookie named `session`.
- The session JWT is encrypted (JWE), not merely signed: `jose` `EncryptJWT` with `dir` + `A256GCM`, keyed by a SHA-256 digest of `SESSION_SECRET`. Token lifetime derives from `SESSION_DURATION_MS`.
- Authenticated server-to-backend calls go through `authedBackendJson` in `src/app/(authentication)/_lib/backend.ts` (attaches the session Bearer token); unauthenticated calls use `backendJson` from `src/lib/api/backend.ts` through named endpoint functions.
- Backend responses used by UI code must be validated with Zod response schemas. See `docs/architecture/ARCHITECTURE.md`.
- Session code lives in `src/app/(authentication)/_lib/session.ts`.
- `SESSION_SECRET` should come from the environment.
- Login/logout server actions live in `src/app/(authentication)/_lib/actions.ts`.
- Server-side current user is read through `getUser()` in `src/app/(root)/_utils/getUser.ts`.
- Auth currently uses hard-coded `testUsers` in `src/app/(authentication)/_constants/index.ts`.
- The local NestJS backend is expected at `D:\IT\projects\Dwelve\backend_nestJS` and `DWELVE_API_BASE_URL=http://localhost:5000/api/v1`.
- `protectedRoutes` and `publicRoutes` live in `_constants/routes.ts`. Route protection runs in `src/proxy.ts` — the Next 16 replacement for `middleware.ts` (shown as "Proxy (Middleware)" in build output); it redirects unauthenticated users off protected routes and authenticated users off public ones.
- The proxy also **refreshes an expiring access token** before the render that needs it. This is not an optimisation: Next only permits cookie writes during the action phase, so a Server Component render that refreshed would spend the single-use refresh token and then be unable to save its replacement, ending the session permanently. Rotation logic is shared with `authedBackendJson` through `_lib/token-refresh.ts`; the cookie itself is built by `_lib/session-cookie.ts` so both runtimes write identical attributes. Before refreshing reactively, `authedBackendJson` calls `canPersistSession` and declines rather than spending a token it cannot save.

Treat auth/session changes as high-risk. Verify the current code before editing.

### Onboarding and access model (target design)

A user's platform account is global and role-free at signup. Roles are not stored as one global user role; they are memberships inside a specific school or learning center. There is no self-service "I am a teacher" control and no role picker during signup or login.

- **User signup** creates only a normal account with email/password. The user may have no memberships yet.
- **Admin** is created by action, not by a separate admin signup. After signup/login, a user can create a school or learning center; that action creates the organization and gives the creator an `admin` membership inside it. Center setup (logo, classes, inviting teachers/students) is progressive onboarding inside the app.
- **Teacher** access comes from an admin invite. The invited person registers or logs in as a normal user, then the invite creates a `teacher` membership inside that school or learning center. Existing accounts invited to another center skip password creation and only gain the new membership.
- **Student** access comes from an admin/teacher invite or an approved class/school code. The user registers or joins as a normal user, then the credential creates a `student` membership inside that school or learning center.
- **Empty-state redemption**: a freshly registered account with no memberships shows entry points to create a school, redeem a teacher invite, or join as a student. The button only opens the flow; the action/credential decides the membership role.
- **Login** is one screen for all users: identifier + password, no role picker. After login, route by the selected/current membership. If one account holds memberships at several centers, let the user choose which center to open.
- **Email verification**: invited users can be verified through the invite link. For cold self-registration, admit immediately and verify lazily — required only at sensitive points such as password reset. OTP at the signup gate is optional.
- **Identity**: key the unique account on email or phone so one person can hold multiple center memberships. Model organization creation, invite-token, and class-code paths before wiring a real backend.

Teacher access must never come from a free-floating code that could be shared in a group chat; use a unique invite link or an email-bound one-time code, because the teacher role exposes answer keys.

---

## Internationalization

Existing guidance says:

- i18n uses `i18next` and `react-i18next`.
- Supported languages are `en`, `ru`, and `uz`.
- Default language is `en`.
- Message catalogs live in `src/i18n/messages/{en,ru,uz}.ts`.
- UI copy should use dotted translation keys through `t(...)`, not literal strings.
- Selected language persists to `localStorage` under `gf-language`.
- `<html lang>` is kept in sync by app providers.

When adding UI copy, update all three catalogs.

---

## Design system

Do not treat `AGENTS.md` as the design-system source of truth.

Use:

- `docs/design/design-system.md` for design decisions
- `src/app/globals.css`, `src/app/layout.tsx`, and Tailwind theme setup for implementation values

The important correction from the old docs is that there should not be three competing font directions. Do not mix Inter, Geist, Montserrat, DM Sans, and DM Serif without updating the design system.

---

## Commits and PRs

Use short imperative commit messages and keep commits focused.

PR notes should include:

- what changed
- how it was tested
- affected routes
- screenshots or recordings for UI changes
- affected translations
- auth/session impact, if any

---

## Security and config

- Never commit secrets or local env files.
- Keep `.next` and `node_modules` out of version control.
- Set `SESSION_SECRET` in real environments.
- Review global providers carefully. `src/app/providers.tsx` sets up next-themes (class strategy, `dwelve-theme` storage key, `disableTransitionOnChange`), i18n language sync, and the query client. Older guidance claimed it disabled the right-click context menu globally — that behavior no longer exists.
