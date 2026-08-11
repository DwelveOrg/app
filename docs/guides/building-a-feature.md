# Building a Feature

Status: v1 · Last updated: 11 August 2026

The step-by-step playbook for adding or changing a frontend feature in Dwelve, written for whoever —
person or agent — picks up the work next. Follow it in order; each step names the document that owns
the details rather than repeating them.

---

## 0. Before you write anything

1. **Read the feature doc** if one exists — `docs/features/` covers classes, tests, test studio,
   test taking, notifications, school membership, profile, students, landing, and more.
2. **Read the code you're about to change.** Doc comments in this codebase record *why*, including
   several decisions that look wrong until you know the failure they prevent.
3. **Search for what already exists.** Roughly half the defects recorded in
   `docs/design/redesign-remaining-work.md` were "someone built a second copy of a thing that was
   already there".

```sh
grep -rn "ThingYouAreAbout" --include='*.tsx' --include='*.ts' src
ls src/components/ui src/components/Custom "src/app/(root)/_components"
```

4. **Branch.** Work on `staging` unless the maintainer says otherwise; for a self-contained piece,
   a topic branch off it.

---

## 1. Decide the shape

| Question | Answer it with |
|---|---|
| Which environment — app shell, studio, exam, or public? | [layout-and-composition.md](../design/layout-and-composition.md) §1 |
| Is this a page, a panel, or a control? | §2 of the same |
| Does a primitive already do this? | [component-library.md](../design/component-library.md) §2 |
| Server or client component? | [RENDERING_AND_STATE.md](../architecture/RENDERING_AND_STATE.md) §1 |
| Who owns the state? | §3 of the same |

Write the answers down in the PR description. Most rework comes from getting one of these wrong
silently.

---

## 2. Scaffold the route

```
src/app/(root)/(pages)/<feature>/
  page.tsx              server: await params → fetch → state check → view
  loading.tsx           SkeletonPage matching the real rhythm
  _components/<Feature>View.tsx     client: the actual UI
  _lib/<feature>.api.ts             endpoint functions
  _lib/<feature>.schemas.ts         zod response schemas
  _lib/<feature>-actions.ts         "use server" actions
  _utils/get<Feature>.ts            server read helper, classifies failures
  _hooks/use<Feature>Mutation.ts    react-query
  _types/_schemas/index.ts          zod form schemas
  _constants/index.ts               literals, label-key maps
```

Not every feature needs all of these. Every one it does need goes where the table says.

Register the route:

- `protectedRoutes` / `publicRoutes` — `src/app/(authentication)/_constants/routes.ts`
- `ROUTE_LABEL_KEYS` — `src/app/(root)/_constants/routes.ts`, if a segment label shows
- The sidebar — only if it is a top-level destination

---

## 3. Data

Order matters: get the contract right before the pixels.

1. **Endpoint function** in `_lib/*.api.ts`, with an intention-revealing name
   (`getClassRequest`, `createTeacherInviteRequest`) and a zod `responseSchema`. Never an inline URL
   in feature code.
2. **Response schema** in `_lib/*.schemas.ts`. Require what the UI depends on; `.passthrough()` for
   backend-owned extras like timestamps.
3. **Server read helper** in `_utils/`, `import "server-only"`, returning a discriminated result
   rather than throwing.
4. **Server action** in `_lib/*-actions.ts` through `actionClient`, with `ActionError` for anything
   the user should see. Identity from the session, never from input.
5. **Query keys** added to `src/lib/query/keys.ts` — a broad `all`, plus `*All` and filtered variants
   if the data is searched or paged.
6. **Mutation hook** in `_hooks/`, unwrapping with `readSafeActionData` and invalidating in
   `onSuccess`.

Rules: [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) ·
[RENDERING_AND_STATE.md](../architecture/RENDERING_AND_STATE.md)

---

## 4. UI

1. **Page skeleton** — `BackLink?` → `PageHeader` **or** `EntityHeader` → `TabBar?` → panels, at
   `gap-6`.
2. **Panels** are `Surface`. No `Surface` inside a `Surface`.
3. **Reuse primitives.** Check the decision table in
   [component-library.md](../design/component-library.md) §2 before writing any markup. If you find
   yourself writing `rounded-2xl border border-border bg-card`, stop.
4. **All five screen states**: loading, empty, populated, forbidden/not-found, failed.
   [interaction-and-states.md](../design/interaction-and-states.md) §2.
5. **All six control states** on anything interactive. §1 of the same.
6. **Forms** follow [FORMS.md](../architecture/FORMS.md) exactly.
7. **Tabs declare `refresh`.** Every tab that shows server state.
8. **Destructive actions** go through `ConfirmDialog`, with the subject named.

---

## 5. Copy

1. Add every string to `en.ts`, `ru.ts`, **and** `uz.ts`, at the same position in each.
2. Follow the namespace shape — `states.<reason>.{title,description}` is *required* if you use
   `ResourceStateView`.
3. Plurals need all four Russian forms.
4. No literal strings in JSX. No concatenation.
5. Dates go through `RelativeTime` / `Intl`, never the catalog.

Rules: [content-and-i18n.md](../design/content-and-i18n.md)

---

## 6. Verify

Automated:

```sh
npm run lint
npx tsc --noEmit
npm run build
npm run check:contrast     # mandatory after ANY change to :root / .dark in globals.css
```

There is no test runner configured. If you add tests, colocate them as `*.test.ts(x)` and add a
package script.

Manual — this is the part that actually catches things:

- [ ] Both themes, on every route you touched
- [ ] `en` / `ru` / `uz` — no clipping, no overflow, no broken rows
- [ ] 375 / 834 / 1440 — **no horizontal page scroll at any width**
- [ ] Keyboard-only pass: everything reachable, focus ring always visible, order sensible
- [ ] `prefers-reduced-motion: reduce` emulated — every new affordance has a still equivalent
- [ ] Every mutation: pending state, success feedback, error feedback, and the list actually updates
- [ ] Every new tab actually refetches when opened
- [ ] Empty state reached deliberately (new account, empty class) and it carries an action
- [ ] Error state reached deliberately (stop the backend) and it recovers

Drift greps — cheap, and they catch what the compiler cannot. `--include='*.ts'` is load-bearing:

```sh
grep -rEn '\b(bg|text|border|ring)-\[var\(--[a-z0-9-]+\)\]' --include='*.tsx' --include='*.ts' src
grep -rEn 'text-\[[0-9.]*(px|rem)\]' --include='*.tsx' --include='*.ts' src
grep -rEn '(bg|text|border)-(slate|gray|zinc|red|green|blue|indigo|violet|teal|amber)-[0-9]{2,3}' src
grep -rn '<label' --include='*.tsx' src
grep -rn 'animate-spin' --include='*.tsx' src
grep -rEn '#[0-9A-Fa-f]{6}\b' --include='*.tsx' --include='*.ts' src
```

**Baseline, measured 11 August 2026.** A count above these means something drifted; each existing
instance is legitimate for the reason given. (`redesign-remaining-work.md` quotes lower numbers —
those predate the studio and exam, and are no longer the baseline.)

| Grep | Count | Why those are correct |
|---|---|---|
| `-[var(--token)]` classes | **33** | Tailwind has no named utility for the chart ramp or the semantic fills. 5 are `classAccents`; the rest are chart/score/question-presentation colours in `studio`, `exam`, and `components/tests` |
| `text-[Npx\|rem]` | **5** | 2 marketing display headlines (`CallToAction`, `AuthVisualParts`), `BRAND_WORDMARK_CLASSES` (2 lines incl. its comment), and `ScoreMeter`'s display numeral |
| Raw Tailwind palette | **0** | must stay 0 |
| `<label>` | **13** | clickable radio/switch cards (studio, exam, `ChoiceInput`), `Field` itself, `ImagePicker`, and the login password row |
| `animate-spin` | **7** | `Button`'s own, `SaveState`, `SaveIndicator`, `ReadinessBanner`, `ConfirmDialog`'s confirm, the landing "generating" mock, the Google script placeholder |
| `#rrggbb` | **21** | `global-error.tsx` (cannot use tokens — the provider tree is what failed), `HeroScene.tsx` (WebGL needs numeric colours), `GoogleIcon.tsx` (third-party brand mark) |

The point of the greps is the **delta**, not the absolute number. If yours is higher, find out which
file added one and whether it had a reason as good as these.

---

## 7. Document

Update docs in the same change as the code. Which one:

| You changed | Update |
|---|---|
| A token, font, colour, or elevation value | `design/design-system.md` + `globals.css` comments |
| A shared component's API | `design/component-library.md` |
| Page structure, containers, breakpoints | `design/layout-and-composition.md` |
| A state, feedback channel, or motion rule | `design/interaction-and-states.md` |
| An a11y decision | `design/accessibility.md` |
| A key convention or copy rule | `design/content-and-i18n.md` |
| Request/schema/library rules | `architecture/ARCHITECTURE.md` |
| Data ownership, caching, invalidation | `architecture/RENDERING_AND_STATE.md` |
| Form architecture | `architecture/FORMS.md` |
| A user flow or route behaviour | the relevant `features/*.md` |
| A backend request contract | `api/API_ROUTES.md` |

One source of truth per topic. `AGENTS.md` and `CLAUDE.md` may *summarize* and link, never duplicate.

---

## 8. Ship

Commit messages: short, imperative, focused.

PR notes must include:

- what changed
- how it was tested
- affected routes
- screenshots or a recording for UI changes
- affected translations
- auth/session impact, if any

A request to "push" authorizes commit-and-push on the intended branch only. Review the working tree
first; never sweep in unrelated changes. Do not open a PR unless asked.

---

## Common mistakes, in the order they usually happen

1. **Building a component that already exists.** Search first, every time.
2. **Restyling a duplicate instead of consolidating it.** Two request rows were migrated onto shared
   primitives and stayed two identical components for a week, because they looked right — and looked
   right in the same way. When you touch a component, check whether its sibling exists.
3. **Forgetting `ru` and `uz`.** Nothing in the build catches it.
4. **Forgetting `refresh` on a tab.** Nothing catches this either, and the symptom is silence.
5. **Only invalidating the query cache** when the stale data came from a server render.
6. **Shipping four of six control states.** Focus-visible and loading are the two usually missing.
7. **Nesting cards.** A bordered box inside a bordered box.
8. **A template-literal Tailwind class.** The utility is never generated; every class-accent tile in
   the product once rendered transparent for exactly this reason, while lint, `tsc`, `build`, and the
   contrast gate all passed.
9. **Assuming lint and build mean it works.** They have all passed on trees containing a never-built
   primitive, two `Field` implementations, 27 hand-rolled spinners, and two untokenised scrims.
   Duplication is not a compile error.
