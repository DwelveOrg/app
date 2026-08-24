# Dwelve Application

The authenticated Dwelve product for school administrators, teachers, and students. It contains
authentication, onboarding, school and class management, test authoring, exam delivery, reporting,
and account workflows. Public marketing pages live in the sibling `frontend` repository.

Start with:

- [`AGENTS.md`](./AGENTS.md) — repository operating rules and verification loop
- [`docs/README.md`](./docs/README.md) — task-oriented documentation map
- [`PRODUCT.md`](./PRODUCT.md) — concise product identity and current boundaries
- [`.agent-memory/README.md`](./.agent-memory/README.md) — durable discoveries and decisions

## Local development

Requires Node.js 22.13 or newer and the sibling NestJS backend. Configure the backend first using
`../backend_nestJS/RUN_BACKEND.md`, then:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The example configuration expects the local backend at
`http://localhost:5001/api/v1`. Replace the example session secret before using the environment
beyond local development. Google sign-in remains disabled unless a matching client ID is configured
in both frontend and backend.

## Quality gates

```bash
npm run lint
npx tsc --noEmit
npm run check:contrast
npm run build
```

There is currently no first-party automated test suite. Exercise affected user flows manually in
addition to the static and build gates.
