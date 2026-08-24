# UI Consolidation Gotchas

## Context

Earlier UI audits found route-local components copied instead of promoted, primitives with no
consumers, duplicate form fields, and Tailwind classes built dynamically in ways the extractor could
not see. Lint, TypeScript, and production builds all passed.

## Knowledge

- Duplication is not a compile error. Search `src/components/ui`, `src/components/Custom`, the route
  group, and sibling features before creating a component.
- Promotion is one-way: route-local -> route-group -> product-wide. Move the shared behavior when a
  second branch consumes it; do not copy markup and merely restyle both copies.
- Tailwind must see literal class names. Do not construct token utility names with template holes.
- Drift greps must include both `*.ts` and `*.tsx`; important class constants live in TypeScript
  files without JSX.

## Relevant files

- `docs/design/component-library.md`
- `docs/design/design-system.md`
- `docs/guides/building-a-feature.md`
- `src/components/ui/`
- `src/app/(root)/_components/`

## Implications

Compare drift-grep results before and after a task and investigate new matches. Do not rely on dated
absolute counts after new product areas or repository splits.

## Related memories

- [[Application residue after split]]
