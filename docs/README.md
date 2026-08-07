# Dwelve Frontend Docs

This folder contains the canonical frontend documentation for Dwelve.

## Structure

```txt
docs/
  product/
    PRD.md
  architecture/
    ARCHITECTURE.md
    SYSTEM_DESIGN.md
    DATABASE.md
    RBAC.md
    SECURITY.md
  api/
    API_ROUTES.md
    test-creation.md
  features/
    school-membership.md
    notifications.md
    password-auth-settings.md
    profile-page-contract.md
    classes.md
    students-page-contract.md
    landing.md
    redis-backend-integration.md
  planning/
    MVP_PLAN.md
  design/
    design-system.md
    brand-assets.md
```

## Reading Order

1. `architecture/SYSTEM_DESIGN.md`
2. `architecture/ARCHITECTURE.md`
3. `architecture/DATABASE.md`
4. `architecture/RBAC.md`
5. `architecture/SECURITY.md`
6. `api/API_ROUTES.md`
7. `design/design-system.md`
8. Feature docs as needed.

## Documentation Rules

- Keep this folder frontend-focused.
- Keep one source of truth per topic.
- Update API docs when frontend request contracts change.
- Update architecture docs when request, form, schema, or state-management rules change.
- Update feature docs when user flows, route behavior, or backend dependencies change.
- Put temporary analysis in issues or PR notes, not permanent docs.

New documentation should use the structured folders above. Avoid adding loose
markdown files directly under `docs/` unless they are index files such as this
one.
