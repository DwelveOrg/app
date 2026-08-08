# Tests (authoring UI)

> **Superseded in part, 9 August 2026.** The builder and the publish flow moved
> out of the dashboard into the **test studio** — see
> [test-studio.md](./test-studio.md). What is still current here: the data layer
> (§"Data Layer"), the catalogue contract, the list page, and the frontend rules
> at the bottom. What is not: the `_components` tree, the dialog-based create and
> publish flows, and "reordering uses buttons, not drag-and-drop" — the studio
> ships both.

The test builder lets teachers and admins author assessments **inside a class**, in
several exam formats, and publish them. This document is the frontend contract.

Students have no test UI in this pass. They receive a notification when a test is
published for their class, and that notification links to the class page. Taking
tests comes in a later pass.

The backend contract this UI codes against is
`backend_nestJS/docs/features/tests.md`. Read it first — the question-type
catalogue and format blueprints are **served by the backend**, not duplicated here.

## Routes

Tests nest under the existing class detail route. `/groups` is already in
`protectedRoutes`, so **`src/proxy.ts` needs no change**.

```txt
/groups/[classId]/tests             test list      (ADMIN + TEACHER)
/groups/[classId]/tests/[testId]    the builder
```

Creation is a **dialog on the list page**, not a route — it matches
`CreateClassDialog` and drops the teacher straight into the builder.

Add `tests: "root.pages.tests"` to `ROUTE_LABEL_KEYS` in
`src/app/(root)/_constants/routes.ts` so the breadcrumb renders.

### Entry point

`ClassDetailView.tsx` currently nests its "Add test" dropdown inside `{isAdmin ? …}`
and fires `notifySoon("root.classDetail.actions.addTest")`. Move that item into the
existing `canManage` branch so teachers see it, and replace `notifySoon` with
navigation to `/groups/[classId]/tests`.

The mock `/assignments/exams` page, its hardcoded `examItems`, and the locked
"Assignments" sidebar item are **not touched** by this change.

## Data Layer

The five layers in `docs/architecture/ARCHITECTURE.md` are mandatory. No `fetch` in
components, no hard-coded URLs, no bearer-token handling outside `authedBackendJson`.

```txt
src/app/(root)/_lib/tests.api.ts               named endpoint functions
src/app/(root)/_lib/tests.schemas.ts           Zod RESPONSE schemas
src/app/(root)/_lib/tests.actions.schemas.ts   Zod FORM/INPUT schemas
src/app/(root)/_lib/test-actions.ts            "use server" next-safe-action mutations
src/app/(root)/_utils/getClassTests.ts         "server-only" RSC read
src/app/(root)/_utils/getTest.ts               "server-only" RSC read
src/lib/query/keys.ts                          + tests branch
```

`tests.actions.schemas.ts` must be a **plain module** (no `"use server"`), because
both the server action and the client `zodResolver` import from it — the same reason
`_lib/actions.schemas.ts` is split out today.

Endpoint functions follow the existing injectable-requester convention:

```ts
export function getTestRequest(testId: string, requestJson: BackendRequester = authedBackendJson) {
  return requestJson(`/tests/${testId}`, { responseSchema: testDetailResponseSchema });
}
```

Query keys:

```ts
tests: {
  all: ["tests"] as const,
  list: (classId: string, filters: { status: string; page: number }) =>
    [...queryKeys.tests.all, "list", classId, filters] as const,
  detail: (testId: string) => [...queryKeys.tests.all, "detail", testId] as const,
  validation: (testId: string) => [...queryKeys.tests.all, "validation", testId] as const,
  formats: () => [...queryKeys.tests.all, "formats"] as const,
}
```

### The catalogue is fetched, never duplicated

`GET /tests/formats` returns the format blueprints and the question-type catalogue.
It is loaded **server-side in the builder page** and passed down as props, with a
long `staleTime` on the client mirror.

Type labels arrive as i18n **key strings**
(`root.tests.questionTypes.SAT_GRID_IN.label`) that the client simply `t()`s. There
must be no hand-maintained list of question types in the frontend — that is exactly
the drift this design exists to prevent.

## The Builder

One `useForm` at `TestBuilder`, three nested `useFieldArray` levels, one submit that
issues one `PUT /tests/:testId/structure`.

```txt
sections
 └── sections.${si}.groups
      └── sections.${si}.groups.${gi}.questions
           └── sections.${si}.groups.${gi}.questions.${qi}.options
```

`useFieldArray` is **not currently used anywhere in this repo**. It is the main new
pattern here. `react-hook-form@7.71` supports nesting natively, so no new dependency.

Performance rules — a 40-question IELTS test registers roughly 800 fields:

- `key={field.id}` from RHF, never the array index.
- Children receive `control` plus a composed `name`; `QuestionCard` is wrapped in `React.memo`.
- Narrow `useWatch({ control, name })`. Never a bare `watch()` inside the tree.
- `mode: "onSubmit"` so typing in a passage does not revalidate every field.
- Saving is one request. No per-field mutations.

### Reordering uses buttons, not drag-and-drop

No DnD library exists in this repo, and `docs/architecture/ARCHITECTURE.md` forbids
adding one without updating that document. Up/down move buttons are also
keyboard- and touch-accessible, which `dnd-kit` is not by default. Order is array
position — `move()` from `useFieldArray`, with zero backend involvement.

### No rich-text editor

IELTS passages are plain prose. A `<Textarea>` at a comfortable reading measure with
a character counter is enough. Blank-line-separated paragraphs get auto A/B/C labels
so matching-headings questions can reference them. This also avoids a new dependency.

## Components

```txt
src/app/(root)/(pages)/groups/[classId]/tests/
  page.tsx  loading.tsx
  [testId]/page.tsx  loading.tsx
  _components/
    TestsListView.tsx        status tabs (Draft / Published / Archived), <Empty> state
    TestCard.tsx             title, format badge, question count, points, status
    CreateTestDialog.tsx     title + format picker as selectable cards, not a <select>
    TestBuilder.tsx          the single useForm host + sticky save/publish bar
    SectionCard.tsx          collapsed entirely when blueprint.hidesStructure
    QuestionGroupCard.tsx    passage <Textarea>, char counter, image, paragraph labels
    AddQuestionDialog.tsx    the tabbed picker: Basic | IELTS | SAT
    QuestionCard.tsx         switches on answerKind
    editors/ChoiceEditor.tsx  TextAnswerEditor.tsx  NumericEditor.tsx
    editors/MatchingEditor.tsx  OrderingEditor.tsx  ManualEditor.tsx
    PublishDialog.tsx        renders GET /validation issues, each deep-linked
    TestStatusBadge.tsx  DeleteTestDialog.tsx  DuplicateTestButton.tsx
  _hooks/
    useCreateTestMutation.ts  useSaveTestStructureMutation.ts  usePublishTestMutation.ts
    useDeleteTestMutation.ts  useDuplicateTestMutation.ts  useTestValidationQuery.ts
  _types/index.ts  _constants/index.ts
```

### The tabbed question picker

This is the surface the whole feature is judged on. `AddQuestionDialog` renders one
tab per `family` in the catalogue (Basic / IELTS / SAT), filtered to the current
test's `allowedQuestionTypes`. Each entry shows its label, a one-line description,
and whether it is auto-graded. Picking one appends a question pre-shaped for its
`answerKind` — fixed options already filled in for
`IELTS_TRUE_FALSE_NOT_GIVEN`, four blank options for `SAT_RW_MCQ`, and so on.

## Missing UI Primitives

`src/components/ui` has no `Tabs`, `Checkbox`, `RadioGroup`, `Label`, `Card`,
`Badge`, or `Switch`, and all are needed here. `components.json` is configured with
the `radix-nova` style, so:

```bash
npx shadcn@latest add tabs checkbox radio-group label switch badge
```

These are `@radix-ui/*` packages and `radix-ui` is already a dependency, so this is
the sanctioned path — but `docs/architecture/ARCHITECTURE.md` requires new libraries
be recorded in the same change, so that document gets a line too.

Everything else reuses what exists: `Dialog` from `(root)/_components/Dialog`,
`SectionCard` and `Row` from `(pages)/_components/layout`, `Empty`, `Skeleton`,
`DropdownMenu`, `AlertDialog` for destructive confirms, and `ImagePicker` from
`src/components/Custom` for passage and question images — its `imageFileSchema` in
`_lib/actions.schemas.ts` already mirrors the backend's 5 MB / PNG-JPEG-WebP rules.

## Frontend Rules

- Validate every backend test response with Zod before rendering; `.passthrough()`
  only at the edges.
- Never send `answerKind` — the backend derives it from `type`.
- Never send `questionNumber`; it is computed server-side at read time.
- Echo back existing `id`s in the structure payload so rows are updated rather than
  recreated.
- Hide authoring controls from students, but rely on the backend as the
  authorization boundary. Hiding a button is not authorization.
- Correctness is never signalled by colour alone — the correct-option marker pairs a
  check icon with its tint, per `docs/design/design-system.md`.
- Use design tokens (`bg-[var(--card)]`, `border-[var(--border)]`), not raw palette
  classes. Do not copy `ExamCard`'s `slate-*` styling.
- Add every visible string to the `en`, `ru`, and `uz` catalogs in the same change.
- `router.refresh()` after mutations so server-rendered class data re-pulls.

## Internationalization

Add to `src/i18n/messages/{en,ru,uz}.ts`:

```txt
root.pages.tests
root.tests.list.*
root.tests.create.*
root.tests.builder.*
root.tests.formats.*
root.tests.questionTypes.<TYPE>.label
root.tests.questionTypes.<TYPE>.description
root.tests.validation.<CODE>
root.tests.status.*
root.notifications.items.testPublished.title
root.notifications.items.testPublished.description
```

Existing `root.exams.*` keys stay untouched. The question-type and validation keys
are the ones the **backend** emits — their names are fixed by
`backend_nestJS/docs/features/tests.md` and must match exactly.

## Verification

```bash
npm run lint
npm run build
npm run dev
```

Walk the flow: teacher → class → "Add test" → pick SAT → builder → add a
`SAT_RW_MCQ` from the SAT tab and a `SHORT_ANSWER` from the Basic tab → save →
reload and confirm the tree round-trips with stable ids → publish with a deliberate
error to see the issue list → fix → publish → confirm a student account receives the
notification and that it links to the class page → confirm a student hitting
`/groups/[classId]/tests` directly is refused. Repeat the builder smoke test in `ru`
and `uz` to catch missing keys.

## Related Docs

```txt
docs/architecture/ARCHITECTURE.md
docs/architecture/RBAC.md
docs/design/design-system.md
docs/features/classes.md
docs/features/notifications.md
backend_nestJS/docs/features/tests.md
```
