# Post-Auth Navigation Dead Zone

## Context

Investigating why signing in "hangs" with no feedback, on both the password form and the Google
button. The cause is not the login request — that part was already covered by `Button loading`.

## Knowledge

`router.push()` after a successful auth action opens a window that is invisible to every
button-level pending state, and it is usually the **longest** part of signing in:

1. the server action resolves, the session cookie is written, and the button stops spinning;
2. `router.push` starts an RSC fetch for the destination;
3. `(root)/layout.tsx` is `export const dynamic = "force-dynamic"` and awaits `getUser()`, which
   decrypts the session **and** calls the NestJS backend via `getSchool()` to re-read the
   membership role;
4. only after that round trip does the destination's `loading.tsx` skeleton render.

Through steps 2–4 the App Router keeps the **previous** page mounted and interactive-looking. A
`loading.tsx` on the destination does **not** help here: the layout above it has to finish first.
`/onboarding`, where new accounts land, has no `loading.tsx` at all.

Measured on local dev against a live backend: the old page stayed mounted for several seconds on a
navigation to `/dashboard`, with the login form still in the DOM the whole time.

Two consequences worth keeping:

- Anything that must stay visible across an auth navigation has to be mounted in the **auth page's**
  tree. That tree is what survives the transition; the destination unmounts it when it paints.
- The Google Identity Services API announces nothing about its account chooser. Whether the chooser
  is open is inferred from `window` `blur` while `document.activeElement` is inside the button
  wrapper — true for both the iframe and plain-DOM shapes GIS renders, and false for an unrelated
  alt-tab.

## Relevant files

- `src/app/(authentication)/_components/AuthHandoff.tsx`
- `src/app/(authentication)/_components/GoogleAuthButton.tsx`
- `src/app/(root)/_utils/getUser.ts`
- `src/app/(root)/layout.tsx`
- `docs/design/interaction-and-states.md` §2

## Implications

Adding a `loading.tsx` is not the fix for a slow *entry* into the shell — the dynamic layout above
it is the cost. Reducing that cost means reducing what `getUser()` has to do, not adding skeletons.

Any future work that changes `getUser()`/`getSchool()` changes how long the sign-in handoff is on
screen, so re-check it against the 800ms phase step and the 7s slow notice in `AuthHandoff.tsx`.

## Related memories

- [[Request cached session and fetch waves]]
- [[Google OAuth configuration parity]]
- [[Session refresh write boundary]]
