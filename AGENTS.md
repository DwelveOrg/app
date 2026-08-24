# Repository Guidelines

This file is for coding agents and contributors working in the Dwelve frontend repository.

`docs/README.md` is the documentation index and carries a task → document routing table. Start there
when you do not know which document owns a rule.

For adding or changing a feature, follow `docs/guides/building-a-feature.md` — the ordered playbook.

| Task | Document |
|---|---|
| Product requirements | `docs/product/PRD.md` |
| Backend requests, schemas, libraries | `docs/architecture/ARCHITECTURE.md` |
| Data fetching, caching, server/client seam | `docs/architecture/RENDERING_AND_STATE.md` |
| Forms | `docs/architecture/FORMS.md` |
| Tokens: colour, type, elevation, motion | `docs/design/design-system.md` |
| Shared components: props, variants, rules | `docs/design/component-library.md` |
| Page layout and composition | `docs/design/layout-and-composition.md` |
| Loading / empty / error / destructive / async | `docs/design/interaction-and-states.md` |
| Accessibility | `docs/design/accessibility.md` |
| Copy and translations | `docs/design/content-and-i18n.md` |

Do not duplicate full product or design documentation in this file; keep those documents in `docs/`.

---

## Project

Dwelve is a Next.js App Router frontend for a digital academic testing and performance-management platform for schools and private learning centers.

The frontend covers:

- public landing pages
- authentication pages
- authenticated dashboard pages
- test/exam workflows
- student/class management
- localization

---

## Build, test, and development commands

- `npm install` — restore dependencies from `package-lock.json`.
- `npm run dev` — start the local Next.js development server.
- `npm run build` — create a production build and validate Next.js output.
- `npm run start` — serve the production build after `npm run build`.
- `npm run lint` — run ESLint through `eslint.config.mjs`.

There is no first-party test framework or `npm test` script currently configured. Until that changes, validate with:

1. `npm run lint`
2. `npm run build`
3. manual testing in `npm run dev`

When adding tests, colocate them near the code they cover as `*.test.ts` or `*.test.tsx`, and add a package script.

---

## Frontend architecture and backend requests

`docs/architecture/ARCHITECTURE.md` is mandatory for request, form, schema, and data
fetching work.

Hard rules:

- Do not make direct backend `fetch` calls from components, hooks, or pages.
- Use `backendJson` from `src/lib/api/backend.ts` as the only low-level backend client.
- Use named feature endpoint functions, for example `createSchoolRequest`, rather than inline URL strings in feature code.
- Use `authedBackendJson` for authenticated backend calls; do not duplicate bearer-token or refresh-token logic.
- Validate backend JSON with `zod` response schemas for every response the UI relies on.
- Use `next-safe-action` for client-triggered mutations.
- Use `@tanstack/react-query` for client cache, invalidation, mutations, and pagination.
- Use `react-hook-form` plus `zod` for forms.
- Use server-only `DWELVE_API_BASE_URL` for private API calls; do not use browser-visible `NEXT_PUBLIC_API_URL` for authenticated API requests.

Do not add Axios or another request/state/form/schema library unless
`docs/architecture/ARCHITECTURE.md` is updated in the same change with a clear reason.

---

## Branch workflow

Always work on the `staging` branch for repository changes unless the maintainer explicitly says otherwise.

---

## Project structure

This is a Next.js App Router frontend — the *application* half of a two-repo split. It serves `app.dwelve.uz` and is never indexable; the marketing site (`dwelve.uz`) is the separate `DwelveOrg/frontend` repository. Do not add marketing pages here. See `docs/architecture/DOMAINS.md`.

Application routes live in `src/app`, with route groups such as:

- `src/app/(authentication)` — login, signup, password reset
- `src/app/(root)` — authenticated dashboard routes

Shared code:

- `src/components/ui` — shadcn/ui primitives
- `src/components/Custom` — custom reusable components
- `src/lib` — common helpers; `utils.ts` exports `cn`
- `src/i18n` — translations and i18next setup
- `public/images` — static images and logos

Route-local code should stay beside its route in underscored folders:

- `_components`
- `_constants`
- `_types`
- `_utils`
- `_lib`
- `_sections`
- `_types/_schemas`

---

## Coding style and naming

- Use TypeScript with strict typing.
- Prefer path aliases such as `@/components/ui/Button` over deep relative imports when crossing folders.
- Component files generally use PascalCase, for example `ThemeSwitch.tsx`.
- Next.js route files follow framework conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.
- Use Tailwind classes for styling.
- Use `cn` from `src/lib/utils.ts` for conditional class composition.
- Keep route-local constants, types, utilities, and components in route-local underscored folders.
- Reuse before you create: check `src/components/ui`, `src/components/Custom`, and the route-local `_components` for an existing component before building UI. If an element is used in more than one place, extract it into one reusable component and reuse it instead of duplicating inline classes; drive shared colours/sizes from design-system tokens (e.g. `bg-primary`), never hard-coded hex.
- Run `npm run lint` before submitting changes.

---

## Internationalization

Dwelve supports:

- English
- Russian
- Uzbek Latin

Use translation keys instead of hard-coded UI copy. When adding new copy, update all supported language catalogs.

All user-facing components must render Uzbek Latin and Russian Cyrillic correctly. Follow `docs/design/design-system.md` for font and script rules.

---

## Authentication and onboarding

A user's platform account is global and role-free at signup. Roles are created only as memberships inside a specific school or learning center. Do not add a role picker, and do not add a self-service control that lets a user declare themselves a teacher.

- **User signup** creates only a normal user account with email/password. The user may initially have no school or role.
- **Create school / learning center** is a separate post-signup action. When a user creates one, create the organization and a membership for that user with `admin` role inside that organization.
- **Teacher** access comes from an admin invite. The invited person registers or logs in as a normal user, then the invite creates a `teacher` membership inside that school or learning center.
- **Student** access comes from an admin/teacher invite or an approved class/school code. The user registers or joins as a normal user, then the credential creates a `student` membership inside that school or learning center.
- **Empty state**: a fresh account with no memberships offers entry points to create a school, redeem a teacher invite, or join as a student. The action/credential decides the membership role.
- **Login** is one screen for all users — identifier + password, no role picker. After login, route by the selected/current membership; if the account has several memberships, let the user choose the school or learning center context.

Teacher access must use a targeted invite link or email-bound one-time code, never a shareable free-floating code, because the teacher role exposes answer keys. Auth lives in the `(authentication)` route group; student join and "add student" are teacher/admin actions under `(root)`. Treat auth/session changes as high-risk.

---

## Design system usage

The design system lives in `docs/design/`. Do not copy token tables, component APIs, or font rules
into this file. Read the relevant document before making UI changes:

- `design-system.md` — tokens (colour, type, elevation, motion) and the shell contract
- `component-library.md` — which component to use, and its props
- `layout-and-composition.md` — page anatomy, widths, responsive rules
- `interaction-and-states.md` — the states every control and screen must ship
- `accessibility.md` — the WCAG contract

Key reminders only:

- use the approved sans font (IBM Plex Sans) for app UI and all user-generated text
- use `numeric` for figures that must line up — scores, marks, durations, counts, codes
- use the display serif (IBM Plex Serif) only for marketing display and the auth headline
- the wordmark is Manrope 700 via `font-wordmark`; it does **not** follow the UI face
- do not introduce competing fonts without updating the design system
- `--primary` is ink (what you press); `--brand` is violet (who this is). They are different tokens
  and must stay different. Charts read from the `--chart-*` ramp, never from `--primary`.
- `npm run check:contrast` must stay green after any change to the token layer

---

## Commit and pull request guidelines

Recent commits use short imperative messages, for example:

- `Update MainPage.tsx`
- `Add missing imports in HowItWorks component`

Keep commits focused.

Pull requests should include:

- concise summary
- testing notes
- linked issue, if applicable
- screenshots or short recordings for UI changes
- affected routes
- affected language resources
- auth/session impact, if relevant

When the maintainer asks to publish changes, use Git directly to stage, commit,
and push the intended branch. Review the working tree first and never include
unrelated changes unless the maintainer explicitly requests all changes.

A request to "push" authorizes the Git commit-and-push workflow only. Do not
require GitHub CLI authentication or create a pull request unless the maintainer
explicitly asks for one.

---

## Security and configuration

- Do not commit secrets.
- Do not commit local environment files.
- Keep generated folders such as `.next` and `node_modules` out of version control.
- Review auth/session changes carefully because they affect login and protected routes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
