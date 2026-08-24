# Security Policy

## Scope

This repository handles authentication sessions, school membership context, exam workflows, user
uploads, and server-side calls to the Dwelve API. Security invariants and implementation locations
are documented in [`docs/architecture/SECURITY.md`](./docs/architecture/SECURITY.md).

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, personal data, or screenshots of
private school content. Use the maintainers' private security-reporting channel. The repository does
not currently publish a dedicated address; if you only have public contact, request a private channel
without disclosing details.

## Maintainer expectations

- Never commit credentials, tokens, session secrets, or production environment values.
- Validate authentication and authorization on the server; hidden client controls are not a guard.
- Treat backend responses and uploads as untrusted input.
- Preserve encrypted, `httpOnly` session cookies and the application-wide no-index policy.
- Review dependency advisories and do not lower the patched `postcss` override documented in
  `package.json`.
