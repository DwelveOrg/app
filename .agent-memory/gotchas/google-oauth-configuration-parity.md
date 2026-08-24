# Google OAuth Configuration Parity

## Context

On 2026-08-24 Google login and signup were disabled both locally and on
`app.dwelve.uz`. The shared button was correct, but the browser client ID was
absent: local had no `.env.local`, and the deployed login bundle contained no
`*.apps.googleusercontent.com` identifier.

## Knowledge

Google auth depends on three matching external settings:

- app `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (embedded at build time);
- backend `GOOGLE_CLIENT_ID` (ID-token audience verification);
- exact authorized JavaScript origins on the same Google Web OAuth client.

The page CSP must also allow the GIS client script, frame/connect parent, and
`https://accounts.google.com/gsi/style`; COOP remains
`same-origin-allow-popups` for browsers not using FedCM.

An absent app value disables the button before the backend is called. A
mismatched backend value opens Google successfully but rejects the returned
credential as an invalid token. A Vercel env change has no effect until the app
is rebuilt and redeployed.

## Relevant Files

- `src/app/(authentication)/_components/GoogleAuthButton.tsx`
- `src/app/(authentication)/_lib/actions.ts`
- `next.config.ts`
- `docs/operations/DEVELOPMENT_AND_DEPLOYMENT.md`

## Implications

Never store client secrets in this repository. The OAuth client ID is public,
but its actual environment value remains deployment configuration. Diagnose
button-disabled, Google-origin, and backend-token failures as separate stages.
