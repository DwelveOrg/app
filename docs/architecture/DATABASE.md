# Data Ownership

This frontend does not own a database schema, ORM, or migrations. Persistent records are owned by
the sibling NestJS repository.

Canonical sources:

- [`backend_nestJS/prisma/schema.prisma`](../../../backend_nestJS/prisma/schema.prisma) — PostgreSQL schema
- [`backend_nestJS/prisma/schema.local.prisma`](../../../backend_nestJS/prisma/schema.local.prisma) — local SQLite mirror where supported
- [Backend database architecture](../../../backend_nestJS/docs/architecture/DATABASE.md) — entities, relationships, constraints, and lifecycle
- [Backend RBAC](../../../backend_nestJS/docs/architecture/RBAC.md) — tenant and role rules

Frontend Zod schemas under route `_lib` folders are runtime response contracts, not database models.
Do not infer ownership, required fields, or deletion behavior from a UI type alone. Coordinate schema
changes in the backend first, then update request functions, response schemas, feature behavior, and
both repositories' documentation.
