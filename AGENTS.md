# Repository Guidelines

This file is for coding agents and contributors working in the Dwelve frontend repository.

For product requirements, read `docs/product/PRD.md`.
For frontend architecture and required libraries, read `docs/architecture/ARCHITECTURE.md`.
For the design system, read `docs/design/design-system.md`.
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

This is a Next.js App Router frontend.

Application routes live in `src/app`, with route groups such as:

- `src/app/(landing)` — public marketing routes
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

The design system lives in `docs/design/design-system.md`.

Do not copy token tables or font rules into this file. Agents should read the design document before making UI changes.

Key reminder only:

- use the approved sans font for app UI and user-generated text
- use the display serif only for controlled Latin-only marketing/logo text
- do not introduce competing fonts without updating the design system

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
