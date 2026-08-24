# Frontend Architecture

This document is the source of truth for implementing Dwelve frontend code.
Agents must follow it before adding backend requests, forms, schemas, or
data-fetching code.

## Backend Request Architecture

All backend requests must use the server-side request stack. Do not add ad-hoc
`fetch` calls in components, hooks, or pages.

Required layers:

1. `src/lib/api/backend.ts`
   - owns the low-level `backendJson` helper
   - reads `DWELVE_API_BASE_URL`
   - serializes JSON bodies
   - adds query params
   - applies request timeouts
   - parses backend error bodies
   - validates successful responses with Zod when a schema is supplied

2. Feature endpoint modules
   - auth and school endpoints live in `src/app/(authentication)/_lib/api.ts`
   - route-specific backend calls live in the nearest route `_lib` folder
   - endpoint functions must have intention-revealing names such as
     `createSchoolRequest`, `listNotificationsAction`, or `getSchoolRequest`
   - endpoint functions must pass a Zod `responseSchema` for every JSON response
     that the UI relies on

3. Authenticated backend calls
   - use `authedBackendJson` from `src/app/(authentication)/_lib/backend.ts`
   - it attaches the session access token
   - it refreshes tokens once on HTTP `401`
   - do not manually attach bearer tokens outside this helper

4. Server actions
   - mutations from client UI must go through `next-safe-action`
   - actions live in route `_lib` files or `src/app/(authentication)/_lib/actions.ts`
   - actions must convert backend/internal errors into safe user-facing messages

5. Client hooks
   - use `@tanstack/react-query` for client mutations, cache invalidation, and
     paginated reads
   - use keys from `src/lib/query/keys.ts`
   - hooks should call server actions, not the backend URL directly

Forbidden patterns:

- direct `fetch("http://localhost:5001...")` in components, pages, or hooks
- browser-visible `NEXT_PUBLIC_API_URL` for private API calls
- copying bearer-token logic into feature code
- trusting TypeScript-only casts for backend JSON
- hard-coding request URLs in UI components
- adding Axios or another request client unless this document is updated first

## Library Responsibilities

Use the libraries already installed in this project for their assigned jobs:

| Purpose                                           | Required library / location                                 |
| ------------------------------------------------- | ----------------------------------------------------------- |
| Runtime request/response schemas                  | `zod`                                                       |
| Form schemas and form validation                  | `zod` with `@hookform/resolvers/zod`                        |
| Form state                                        | `react-hook-form`                                           |
| Server-action boundaries                          | `next-safe-action` via `src/lib/safe-action.ts`             |
| Client cache, mutations, invalidation, pagination | `@tanstack/react-query`                                     |
| Encrypted httpOnly session cookie                 | `jose` in the authentication session code                   |
| UI primitives                                     | existing shadcn/Radix components in `src/components/ui`     |
| Icons                                             | `lucide-react`                                              |
| Class composition                                 | `cn` from `src/lib/utils.ts`                                |
| Dates and relative display                        | native `Intl` or existing date helpers before new libraries |

Do not install a new library for one of these jobs unless there is a concrete
gap and this architecture document is updated in the same change.

### UI primitives added for the test builder

`src/components/ui` gained `tabs`, `checkbox`, `radio-group`, `label`, `switch`,
and `badge` via `npx shadcn@latest add` in the `radix-nova` style. These add **no
new dependency**: they import from the `radix-ui` meta package, which is already
installed.

Two notes for anyone regenerating them:

- The registry emits `data-checked:` / `data-active:` Tailwind variants, which
  target a newer Radix than the pinned `radix-ui@1.4.3`. That version writes
  `data-state="checked"` / `data-state="active"`, so the selectors in those files
  were changed to `data-[state=…]:`. Without the swap, checked and active states
  render with no visual difference. Re-running the generator overwrites this.

### Drag-and-drop: `@dnd-kit` (added for the test studio)

This document previously ruled out a drag-and-drop library, on the grounds that
up/down buttons are "keyboard- and touch-accessible, which `dnd-kit` is not by
default". Half of that was right. `dnd-kit` ships a `KeyboardSensor`, and with
`sortableKeyboardCoordinates` a sortable list is fully operable from the
keyboard — space to lift, arrows to move, space to drop, escape to cancel. What
the buttons genuinely give is discoverability and a target that does not need a
sustained drag, which matters for touch and for motor impairment.

So the studio ships **both**, and the rule is now:

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` and
  `@dnd-kit/utilities` are permitted, through the single wrapper
  `src/components/ui/SortableList.tsx`. Do not import them directly elsewhere;
  one wrapper is what keeps the sensors, modifiers and touch handling
  consistent. It moved out of `src/app/studio/_components/` when the exam
  runtime gained an ordering question — a student reordering steps and a
  teacher reordering options must behave identically, including on touch.
- It takes **either** `onReorder` (index-based, for a list that is one array) or
  `onDropOn` (id-based). The second exists because a part is rendered flat but
  stored as several wire groups, so "moved from 4 to 7" cannot be applied
  without resolving which group each index belongs to — and because an index
  pair cannot express "this question now belongs to a different passage".
- **Every sortable row keeps its up/down/remove buttons.** A handle is the fast
  path, not the only one. Removing them to "clean up" the row is a regression.
- Order remains array position — `move()` from `useFieldArray`, nothing sent to
  the backend for it.

### Fullscreen: `screenfull`

`screenfull` is permitted for Fullscreen API access. It normalises the four
vendor spellings (Safari is still `webkit`-prefixed) and exposes `isEnabled`.
`src/app/exam/_components/CoverScreen.tsx` requests fullscreen inside the
student's Start/Resume click, before the asynchronous attempt request; moving it
after that request loses the trusted user gesture and browsers reject it.
`src/app/exam/_hooks/useIntegrityGuard.ts` then observes the live state and
pauses a refreshed or restored attempt behind an explicit fullscreen retry.
An unavailable Fullscreen API lets the attempt proceed; a policy-blocked trusted
retry offers an explicit continue path. Locking a student out over browser
capability is worse than a missing precaution.

## Schema Placement

Place schemas where their ownership is clearest:

- form input schemas: route-local `_types/_schemas`
- backend response schemas shared by feature endpoints:
  - auth/school: `src/app/(authentication)/_lib/api.schemas.ts`
  - root feature payloads: nearest route or shared `_types/*.schemas.ts`
- derived UI-only types can stay in `_types/index.ts`

Backend response schemas should be permissive only at the edges. Use
`.passthrough()` for backend-owned extra fields such as timestamps, but require
fields the UI depends on.

## Environment Variables

Use server-only environment variables for private API requests:

```env
DWELVE_API_BASE_URL=http://localhost:5001/api/v1
SESSION_SECRET=...
```

`NEXT_PUBLIC_*` variables are visible in the browser. Use them only for values
that are intentionally public, such as a Google OAuth client ID.

## Validation Before Handoff

For code changes, run:

```txt
npm run lint
npm run build
```

When a change depends on the NestJS backend contract, also smoke-test the
relevant endpoint or verify the matching backend controller/service/DTO in the
sibling `../backend_nestJS` repository.
