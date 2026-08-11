# Dwelve Frontend Docs

The canonical frontend documentation for Dwelve. One source of truth per topic — `AGENTS.md` and
`CLAUDE.md` summarize and link to these files, and must never duplicate them.

## Start here

**Building or changing a feature?** → [`guides/building-a-feature.md`](./guides/building-a-feature.md)
is the step-by-step playbook, and it links out to everything below at the point you need it.

## Find it by task

| I am… | Read |
|---|---|
| Adding or changing any UI | [`design/component-library.md`](./design/component-library.md) |
| Laying out a page or a panel | [`design/layout-and-composition.md`](./design/layout-and-composition.md) |
| Picking a colour, size, shadow, or duration | [`design/design-system.md`](./design/design-system.md) |
| Handling loading / empty / error / destructive / async | [`design/interaction-and-states.md`](./design/interaction-and-states.md) |
| Writing or checking accessibility | [`design/accessibility.md`](./design/accessibility.md) |
| Writing UI copy or adding translations | [`design/content-and-i18n.md`](./design/content-and-i18n.md) |
| Building a form | [`architecture/FORMS.md`](./architecture/FORMS.md) |
| Fetching data or fixing stale UI | [`architecture/RENDERING_AND_STATE.md`](./architecture/RENDERING_AND_STATE.md) |
| Calling the backend, adding a schema, adding a library | [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md) |
| Working on roles, permissions, or sessions | [`architecture/RBAC.md`](./architecture/RBAC.md), [`architecture/SECURITY.md`](./architecture/SECURITY.md) |
| Working on a specific flow | [`features/`](./features/) |
| Checking a request contract | [`api/API_ROUTES.md`](./api/API_ROUTES.md) |
| Using the logo or brand assets | [`design/brand-assets.md`](./design/brand-assets.md) |

## Structure

```txt
docs/
  guides/
    building-a-feature.md         step-by-step playbook + verification checklist
  product/
    PRD.md                        product scope and priorities
  architecture/
    SYSTEM_DESIGN.md              system overview
    ARCHITECTURE.md               request stack, libraries, schema placement
    RENDERING_AND_STATE.md        server/client seam, data ownership, caching, invalidation
    FORMS.md                      schema → RHF → action → mutation → feedback
    DATABASE.md
    RBAC.md
    SECURITY.md
  design/
    design-system.md              tokens: type, colour, elevation, motion, shell
    component-library.md          every shared component: props, variants, rules
    layout-and-composition.md     environments, page anatomy, widths, responsive, stacking
    interaction-and-states.md     control states, screen states, feedback, motion, freshness
    accessibility.md              the WCAG contract and how to verify it
    content-and-i18n.md           copy voice, key conventions, three-catalog rule
    brand-assets.md               logo inventory
    redesign-remaining-work.md    open visual work + what the gates don't catch
  api/
    API_ROUTES.md
    test-creation.md
  features/
    classes.md · tests.md · test-studio.md · test-taking.md · notifications.md
    school-membership.md · school-profile-and-groups-ux.md · students-page-contract.md
    profile-page-contract.md · password-auth-settings.md · teacher-class-requests.md
    landing.md · redis-backend-integration.md · …
  planning/
    MVP_PLAN.md
```

## Reading order for a new contributor

1. [`product/PRD.md`](./product/PRD.md) — what the product is for
2. [`architecture/SYSTEM_DESIGN.md`](./architecture/SYSTEM_DESIGN.md)
3. [`architecture/ARCHITECTURE.md`](./architecture/ARCHITECTURE.md)
4. [`architecture/RENDERING_AND_STATE.md`](./architecture/RENDERING_AND_STATE.md)
5. [`design/design-system.md`](./design/design-system.md)
6. [`design/component-library.md`](./design/component-library.md)
7. [`design/layout-and-composition.md`](./design/layout-and-composition.md)
8. [`design/interaction-and-states.md`](./design/interaction-and-states.md)
9. [`guides/building-a-feature.md`](./guides/building-a-feature.md)
10. Feature docs as needed

`RBAC.md`, `SECURITY.md`, `accessibility.md`, and `content-and-i18n.md` are reference — read the
relevant one when the work touches it.

## Documentation rules

- Keep this folder frontend-focused.
- **One source of truth per topic.** Link across documents; do not copy sections between them.
- Update docs in the **same change** as the code. A rule that describes a tree that no longer exists
  is worse than no rule.
- Update `api/` when frontend request contracts change.
- Update `architecture/` when request, form, schema, state, or caching rules change.
- Update `design/` when tokens, components, layout rules, states, or copy conventions change.
- Update `features/` when user flows, route behavior, or backend dependencies change.
- Record **why**, not just what. Several decisions in this codebase look wrong until you know the
  failure they prevent; those reasons belong in the docs and in the doc comments.
- Put temporary analysis in issues or PR notes, not permanent docs.
- New documents go in a structured folder. Avoid loose markdown directly under `docs/` other than
  this index.
