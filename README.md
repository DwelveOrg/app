# Dwelve Docs

This repository contains the Dwelve frontend and its stable project guidance.

## Files

- `docs/README.md` - canonical documentation structure and reading order.
- `docs/product/PRD.md` - product scope, target users, priorities, roadmap, risks.
- `docs/architecture/ARCHITECTURE.md` - mandatory frontend architecture, backend request, schema, form, and data-fetching rules.
- `docs/design/design-system.md` - typography, color, layout, component, script, and accessibility rules.
- `AGENTS.md` - root-level coding-agent guidance.
- `CLAUDE.md` - root-level Claude Code guidance.

## Run locally

The frontend's production values may live in `.env`, but local development must
use the Git-ignored `.env.local` file so it never sends local sessions or API
requests to production. A local configuration is included in the working tree;
to recreate it, copy `.env.example` to `.env.local`.

Start the local NestJS API on port 5001 first, following
`../backend_nestJS/RUN_BACKEND.md`. Then run:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. The local frontend calls
`http://localhost:5001/api/v1` and uses a development-only session key.

Google sign-in is intentionally disabled in the supplied local configuration.
To test it, create or use a Google OAuth web-client ID that authorizes
`http://localhost:3000`, then set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in
`.env.local`; its matching client ID must also be configured in the local
backend.

## What Does Not Belong Here

- Generated build output.
- Local environment files.
- Temporary notes that are not maintained.

## Maintenance Rule

When code and docs disagree, update both in the same pull request.
