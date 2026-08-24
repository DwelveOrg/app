# Dwelve Application Documentation

This directory is the stable source of truth for the authenticated product. Use this index as a
context router; do not read every document for every task.

## Start by domain

| Task                                                | Read first                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Product scope, roles, or user journey               | [`../PRODUCT.md`](../PRODUCT.md), [`product/PRD.md`](./product/PRD.md)                                       |
| Overall structure or route ownership                | [`architecture/SYSTEM_DESIGN.md`](./architecture/SYSTEM_DESIGN.md)                                           |
| Backend requests, schemas, or libraries             | [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md), [`api/API_ROUTES.md`](./api/API_ROUTES.md) |
| Server/client ownership, fetching, or invalidation  | [`architecture/RENDERING_AND_STATE.md`](./architecture/RENDERING_AND_STATE.md)                               |
| Forms                                               | [`architecture/FORMS.md`](./architecture/FORMS.md)                                                           |
| Sessions, roles, permissions, or CSP                | [`architecture/SECURITY.md`](./architecture/SECURITY.md), [`architecture/RBAC.md`](./architecture/RBAC.md)   |
| Hosts, redirects, indexing, or robots               | [`architecture/DOMAINS.md`](./architecture/DOMAINS.md)                                                       |
| Tokens, typography, color, or motion                | [`design/design-system.md`](./design/design-system.md)                                                       |
| Shared components                                   | [`design/component-library.md`](./design/component-library.md)                                               |
| Layout or responsiveness                            | [`design/layout-and-composition.md`](./design/layout-and-composition.md)                                     |
| Loading, empty, error, destructive, or async states | [`design/interaction-and-states.md`](./design/interaction-and-states.md)                                     |
| Accessibility                                       | [`design/accessibility.md`](./design/accessibility.md)                                                       |
| Copy, translations, and scripts                     | [`design/content-and-i18n.md`](./design/content-and-i18n.md)                                                 |
| A specific product workflow                         | [`features/`](./features/)                                                                                   |
| Environment, local setup, deployment, or checks     | [`operations/DEVELOPMENT_AND_DEPLOYMENT.md`](./operations/DEVELOPMENT_AND_DEPLOYMENT.md)                     |
| Adding a coherent feature                           | [`guides/building-a-feature.md`](./guides/building-a-feature.md)                                             |

Search [`.agent-memory/`](../.agent-memory/) after selecting the domain. Memory explains expensive
discoveries and reasoning; it does not override current code or this documentation.

## Topology

```text
docs/
  product/           Product scope and business rules
  architecture/      System, request, state, form, security, and domain boundaries
  api/               Frontend-consumed backend contracts
  design/            UI system, components, layout, states, accessibility, and i18n
  features/          Flow-specific behavior and constraints
  operations/        Environment, development, deployment, and verification
  guides/            Repeatable implementation playbooks
  planning/          Dated plans and historical change records; not canonical truth
```

Feature documents vary in age. A feature file is a useful entry point, but current implementation
and backend contracts win when its status language conflicts. Dated planning files preserve context
only; never treat them as a current task list without re-auditing the code.

## Documentation rules

- Keep one canonical location per concept and cross-link instead of copying.
- Point to exact implementation paths where that saves rediscovery.
- Update the owning document in the same change as stable behavior.
- Put temporary progress in issues or task notes, not `/docs` or `.agent-memory`.
- Record uncertainty as **Unknown** or **Needs verification**.
- Never store credentials, tokens, environment values, personal data, or private URLs.

Source priority when facts conflict: executable code; configuration/schema; `AGENTS.md`; current
`/docs`; persistent memory; dated plans, old comments, and handoffs. A conflict still requires
investigation because documentation may describe an invariant the code is violating.
