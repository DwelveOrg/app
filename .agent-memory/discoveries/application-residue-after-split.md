# Application Residue After Split

## Context

Public marketing routes moved to the sibling `frontend` repository, but the application still has
some assets and vocabulary from the former combined tree.

## Knowledge

There is no `(landing)` route in this repository. Nevertheless, `globals.css` retains landing/hero
tokens and keyframes, translation catalogs retain a `landing` namespace, and a few component comments
still refer to marketing usage. These remnants are not route ownership or permission to add public
pages here.

## Relevant files

- `src/app/globals.css`
- `src/i18n/messages/`
- `src/components/ui/Button.tsx`
- `docs/architecture/DOMAINS.md`
- `../frontend/src/app/(landing)/`

## Implications

Trace consumers before reusing or deleting residue. A cleanup should be dependency-graph driven and
verified by typecheck/build and visual checks; it must not move active auth/onboarding identity styles
by accident. New public marketing behavior belongs in `frontend`.

## Related memories

- [[Marketing application split]]
- [[UI consolidation gotchas]]
