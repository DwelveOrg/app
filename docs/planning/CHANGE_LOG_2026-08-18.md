# Change log — 2026-08-18

Thirteen requested fixes, across `frontend/` and `backend_nestJS/`. This file is
written **for a reviewing agent**: each entry names the reported problem, the
root cause, the files changed, and the specific check that proves it.

Read the "How to verify" column as an instruction, not a summary. Several fixes
are behavioural and cannot be confirmed by reading the diff alone.

---

## Status of the gates

| Gate | Command | Result |
|---|---|---|
| Backend types | `cd backend_nestJS && npm run typecheck` | clean |
| Backend lint | `cd backend_nestJS && npm run lint` | clean |
| Backend tests | `cd backend_nestJS && npm test -- --runInBand` | 179 passed / 25 suites |
| Backend build | `cd backend_nestJS && npm run build` | succeeds |
| Prisma schemas | PostgreSQL and SQLite `prisma validate` | both valid; both clients generate |
| Frontend types | `cd frontend && npx tsc --noEmit` | clean |
| Frontend lint | `cd frontend && npm run lint` | clean |
| Frontend build | `cd frontend && npm run build` | succeeds |
| Contrast gate | `cd frontend && npm run check:contrast` | all checks passed |

The backend test count went 164 → 179: **15 new tests** (6 ownership/delegation,
4 blocklist, 2 experience feedback, 3 retake state). Two pre-existing tests
were updated because they asserted behaviour that was deliberately changed —
both are called out below.

The pre-publish review also hardened the implementation beyond the original
happy paths: email-based blocking now applies owner/admin/self protections and
removes an existing membership; inactive owner rows remain protected; join and
invite acceptance recheck the block inside their transaction; deactivation
cleans both retained profile types after role changes; all rated retake sittings
are included in experience statistics; role changes are reflected from the
backend on the next render instead of waiting for session rotation; and the
rating widget now leaves its optional comment usable and implements keyboard
radio-group navigation.

**Not run:** no database migration was applied. `20260818000000_owner_blocklist_experience`
is written but unexecuted; see [Migration](#migration).

---

## 1. A student could not retake a test even with retakes enabled

**Root cause.** `TestAttemptsService.resolveState` returned `GRADED`/`SUBMITTED`
as soon as the last attempt was finished — *before* it checked whether attempts
remained. The exam cover screen treats every state other than `AVAILABLE` and
`IN_PROGRESS` as blocked, so with `attemptsAllowed: 3` a student who finished
attempt 1 was permanently locked out. The "Take it again" button on the result
screen led to a screen with a disabled Start button.

**Fix.** Reordered the state resolution: with attempts left *and* the window
open, the state is `AVAILABLE`. The terminal states are only reported when one
of those two is false, so the single-attempt case is byte-for-byte unchanged.

- `backend_nestJS/src/tests/test-attempts.service.ts` — `resolveState`
- `frontend/src/components/tests/StudentTestCard.tsx` — the `AVAILABLE` branch
  now says "Take it again" after the first attempt and keeps a "See result" link
  to the previous attempt, which would otherwise become unreachable
- `frontend/src/app/exam/_components/CoverScreen.tsx` — same relabelling

**How to verify.** `npx jest src/tests/test-attempts.service.spec.ts` — the
`TestAttemptsService retake state` block covers three cases: attempts remaining
(`AVAILABLE`), attempts exhausted (`GRADED`), and attempts remaining but the
window closed (`GRADED`, *not* reopened). Manually: publish a test with
`attemptsAllowed > 1`, submit once, and confirm the cover screen offers a start.

---

## 2. Text-size control made almost no difference

**Root cause.** The four exam text sizes were 0.9375 / 1.0625 / 1.1875 / 1.375rem
— a 2px step between the first three, which is below the threshold at which a
reader notices anything changed.

**Fix.** Widened to 0.875 / 1.0625 / 1.3125 / 1.625rem (~20% per step), with the
line height easing off as the type grows. The "A" swatches in the picker were
re-ramped to match, so the preview reflects the jump the student will get.

- `frontend/src/app/globals.css` — `[data-exam-size]` block
- `frontend/src/app/exam/_components/ExamAppearanceMenu.tsx`

**How to verify.** Sit any test, open the appearance menu, step through all four
sizes. Every `.exam-prose` element scales — question prompts, options, passages,
text inputs.

---

## 3. Blacklist

**New feature.** A school can bar someone. The list is keyed on the **email
address**, not the user id, because that is the only version of a block that
survives the person signing up again — a user-id block stops exactly one account
and the join code lets them back in minutes later.

Blocking a current member removes their membership in the same action and
withdraws any pending invitation to that address.

**Enforced on every route back in:** the student join code (`joinByCode`), the
code lookup (`previewJoinByCode`, so they find out before pressing the button),
teacher-invite creation, and teacher-invite acceptance.

- `backend_nestJS/prisma/schema.prisma` — new `SchoolBlocklistEntry` model
- `backend_nestJS/src/schools/schools.service.ts` — `listBlocklist`,
  `addToBlocklist`, `removeFromBlocklist`, private `ensureNotBlocked`
- `backend_nestJS/src/schools/schools.controller.ts` — `GET`/`POST`/`DELETE /schools/:schoolId/blocklist`
- `backend_nestJS/src/schools/dto/create-blocklist-entry.dto.ts`
- `frontend/src/app/(root)/(pages)/school/_components/SchoolBlocklistTab.tsx`
- `frontend/src/app/(root)/(pages)/school/_components/BlockMemberDialog.tsx`

**Rules a reviewer should check are enforced.** The owner can never be blocked.
An admin can only be blocked by the owner. Nobody can block themselves. Emails
are normalised, so a block on `Student@Example.com` stops `student@example.com`.

**How to verify.** `npx jest src/schools` — the `blocklist` describe block covers
the join-code refusal and the member-removal path including email normalisation.

---

## 4. Class activity did not show results

**Root cause.** `listActivity` only attached `score`/`maxScore` when the attempt
status was `GRADED`. Any test containing one essay question stays `SUBMITTED`
until a human marks it, so the feed said "submitted" and nothing else on exactly
the tests a teacher most wants to look at.

**Fix.** The score now travels with every submission event, alongside
`attemptStatus`, `percentage` and `passed` so the UI can distinguish a final
mark from a part-marked one. The row shows a score badge with the percentage,
tinted by the pass flag when there is one and neutral while marking is pending,
plus a direct "See result" link.

- `backend_nestJS/src/classes/classes.service.ts` — `ClassActivityItem`, `listActivity`
- `frontend/src/app/(root)/_lib/class-activity.schemas.ts`
- `frontend/src/app/(root)/(pages)/groups/[classId]/_components/ClassActivitySection.tsx`

**Updated test.** `classes.service.spec.ts` → "orders attempt reads by their
event timestamps…" previously asserted `score: null` for a `SUBMITTED` attempt.
That assertion encoded the bug; it now asserts the auto-marked score with
`attemptStatus: 'SUBMITTED'`.

---

## 5. Experience rating at the end of each test

**New feature.** A 1–5 rating with an optional comment, asked once on the result
screen. It measures the *sitting* — timer, layout, anything in the way — not the
difficulty and not the student's performance.

Deliberately **not** attached to the submit button: a rating collected at the
moment a student presses submit measures adrenaline. It is accepted only on a
submitted attempt, only by the student who sat it, and a second call overwrites
the first rather than being refused.

- `backend_nestJS/prisma/schema.prisma` — `TestAttempt.experienceRating` / `experienceComment` / `experienceRatedAt`
- `backend_nestJS/src/tests/test-attempts.service.ts` — `rateExperience`; the aggregate
  (`responses`, `average`) is exposed to teachers on `GET /tests/:testId/statistics`
- `backend_nestJS/src/tests/test-attempts.controller.ts` — `POST /attempts/:attemptId/experience`
- `frontend/src/app/exam/_components/ExperienceRating.tsx`
- `frontend/src/app/exam/_components/ResultScreen.tsx`

**Note on the average.** It is computed over responders, not over the cohort — a
mean that counted silence as zero would read as a complaint nobody made.

---

## 6. Contact support / report a problem on the dashboard

**New feature.** Two tinted cards at the foot of the dashboard, for every role.
They use the PDF-importer's visual treatment (tinted panel, tile, radial glow)
because they are offers rather than navigation — but tinted with `--info` rather
than `--primary`, so "we can build this for you" and "something is wrong" stay
distinguishable while sharing a shape.

**Contact support** is a menu, not one link: email (a thread you can follow) and
Telegram (fast). Picking one for the user sent half of them to a channel they do
not use. The Telegram row is simply absent when `NEXT_PUBLIC_SUPPORT_TELEGRAM`
is unset.

**Report a problem** stays inside the product with three entry points (bug,
idea, question) that open the existing `ReportProblemDialog` with the kind
preselected — the dialog sends the text and page context directly instead of
depending on a configured mail client.

- `frontend/src/app/(root)/_components/SupportCta.tsx` (new)
- `frontend/src/app/(root)/(pages)/dashboard/_components/composer/DashboardComposer.tsx` — `GettingHelp` module, priority 10
- `frontend/.env.example` — both support variables documented. Note this file is
  caught by the repo's `.env*` ignore rule, so the addition will **not** appear
  in the diff; the variables are `NEXT_PUBLIC_SUPPORT_EMAIL` (already used by the
  profile Support tab, default unchanged) and `NEXT_PUBLIC_SUPPORT_TELEGRAM`
  (new, optional)

---

## 7. Owner role, and admins who may (or may not) appoint admins

**New feature, and the largest change here.** Read this section before reviewing
the permission code.

### The model

`SchoolMember` gained two booleans rather than `SchoolRole` gaining an `OWNER`
member. That was deliberate: adding an enum value would have required auditing
every `@Roles('ADMIN')` and every `role === 'ADMIN'` comparison in the codebase,
and a single missed site is a silent privilege bug. With flags, every existing
admin check keeps working unchanged and the new rules are additive.

- `isOwner` — set **only** by the school-creation transaction. No endpoint grants
  it, moves it, or clears it.
- `canManageAdmins` — whether this admin may promote teachers. The owner always may.

### The two rules

1. **The owner is untouchable.** Their membership cannot be demoted, removed, or
   blocked, by anyone including themselves. A school whose creator can be locked
   out by an admin they appointed is a school that can be taken.
2. **Delegation stops one level below the owner.** Only the owner can grant
   `canManageAdmins`. An admin who holds it can create admins but the flag they
   pass is forced to `false` server-side — so the set of people who can widen the
   admin group stays small and stays visible in one list.

Demoting an admin is owner-only, so two admins cannot demote each other.

### Data-integrity note a reviewer should confirm

Promotion **does not** delete the teacher profile. `ClassTeacher` and
`ClassTeacherRequest` both cascade off `TeacherProfile`, so deleting it would
silently unassign the person from every class they teach — and demoting them
would not bring those assignments back. Demotion upserts the profile instead, so
an admin who was never a teacher gets one.

- `backend_nestJS/prisma/schema.prisma` — `SchoolMember.isOwner`, `.canManageAdmins`
- `backend_nestJS/src/schools/schools.service.ts` — `create` (sets the flags),
  `updateMemberRole`, private `ensureCanManageAdmins`
- `backend_nestJS/src/schools/schools.controller.ts` — `PATCH /schools/:schoolId/members/:memberId/role`
- `backend_nestJS/src/schools/dto/update-member-role.dto.ts`
- `frontend/src/app/(root)/(pages)/school/_components/SchoolAccessTab.tsx` (new)
- `frontend/src/app/(root)/(pages)/school/_components/PromoteTeacherDialog.tsx` (new)
- `frontend/src/app/(root)/(pages)/school/_components/DemoteAdminDialog.tsx` (new)

**UI detail.** The "let this admin add other admins" checkbox is shown **only to
the owner** — absent, not disabled. A control that can never be pressed implies
the ability exists behind some setting.

**How to verify.** `npx jest src/schools` — the `ownership and admin delegation`
block covers all five rules plus the profile-restore case.

**Frontend permission source.** `school/page.tsx` reads the viewer's `isOwner` /
`canManageAdmins` from the **roster row**, not from the session. `getUser` also
hydrates the current membership role from the request-cached school response,
so a promoted or demoted person gets the correct navigation and page gates on
the next render instead of waiting for token rotation or logging in again.

---

## 8. Only owner and admins approve requests; teachers cannot create classes

**Class creation** was already `@Roles('ADMIN')` on the backend and already
gated to admins in the frontend. Verified, not changed.

**Approvals were not.** `POST /class-enrollments/:id/approve` and `/reject`
accepted `TEACHER`, and `GET /classes/:classId/join-requests` did too.

**Fix.** Both restricted to `ADMIN` (which includes the owner, who is an admin
with `isOwner`). The listing endpoint is gated with them, because the list exists
to be acted on.

- `backend_nestJS/src/classes/classes.controller.ts`
- `frontend/.../groups/[classId]/_components/ClassDetailView.tsx` — the requests
  button is now inside the `isAdmin` branch, not the `canManage` one
- `frontend/.../groups/[classId]/requests/page.tsx` — redirects teachers

---

## 9. Teacher links

**Root cause.** An invite's token is stored **hashed** — correct, and not
changed: a leaked database must not hand out teacher access, which is the role
that exposes answer keys. The consequence was a dead end. The link is shown once
in the creation dialog; close it and the link is gone forever, and creating a
replacement was refused by the "an active invite already exists" check.

**Fix.** A pending-invites list with two actions:

- **Get a new link** — rotates the token and returns a usable link. The old link
  stops working immediately, which is stated on the panel rather than hidden in
  a tooltip, because it changes what the admin should do with a link they may
  already have pasted somewhere.
- **Cancel invite** — marks it declined.

The freshly minted link renders inline on its own row and is deliberately not
persisted across a refresh: that is the one moment it exists in plaintext, and a
lingering link would end up copied from a stale render after being rotated again.

- `backend_nestJS/src/schools/schools.service.ts` — `listTeacherInvites`, `reissueTeacherInvite`, `revokeTeacherInvite`
- `backend_nestJS/src/schools/schools.controller.ts` — three routes under `/schools/:schoolId/invites/teacher`
- `frontend/src/app/(root)/(pages)/school/_components/TeacherInvitesList.tsx` (new)

Reissue also re-checks the blocklist, so a blocked address cannot be handed a
fresh link.

---

## 10. Cursor pointer everywhere

**Root cause.** Tailwind v4's Preflight does not set `cursor: pointer` on
buttons, and browsers default `<button>` to an arrow. Roughly 50 call sites had
remembered `cursor-pointer`; the rest had not, and the inconsistency read as
some buttons being disabled.

**Fix.** One base-layer rule in `globals.css` rather than 50 more class names —
"is this pressable" is a property of the element, not a styling decision each
call site should get to make differently. It covers real buttons, `role`-bearing
Radix primitives (`button`, `tab`, `radio`, `option`, `menuitem`,
`menuitemcheckbox`, `menuitemradio`, `switch`, `checkbox`), `summary`,
label-wrapped checkboxes and radios, `select`, the pressable input types, and
`::file-selector-button`. Disabled and `aria-disabled` elements get
`not-allowed`, which is the one case where a different cursor is correct rather
than an oversight.

**Two real bugs the base rule could not fix**, because a utility class beats a
base-layer rule:

- `frontend/src/components/ui/dropdown-menu.tsx` — four items shipped with
  shadcn's `cursor-default` (macOS native menus do this; web menus should not).
- `frontend/src/components/ui/select.tsx` — the two scroll affordances.

Both changed to `cursor-pointer`.

**Audited and found clean:** no `<div onClick>` or `<span onClick>` anywhere
(every hit was a container wrapping a real button), and no `<a>` without `href`.

**How to verify.** `grep -rn "cursor-default" frontend/src` returns exactly
three hits, and all three are correct — they mark genuinely non-interactive
states rather than pressable ones:

| File | Why `cursor-default` is right there |
|---|---|
| `onboarding/_components/StepRail.tsx` | a step the user has not reached yet |
| `components/tests/paper/inputs/ChoiceInput.tsx` | read-only review mode |
| `components/tests/charts/QuestionDifficultyRow.tsx` | a row with no detail to expand |

Then hover: sidebar rows, dropdown items, tab bars, checkboxes, the switch,
select options, dialog buttons, the chart-type segmented control.

---

## 11. Chart display options

`TrendChart` gained **area / line / bar**, chosen from a segmented control in
the panel header and remembered in `localStorage` under
`dwelve-dashboard-chart-type`.

This is a fix as much as a feature: a school with one month of results was shown
a single dot floating in an empty area chart, which reads as a bug rather than
as "one month of data". A bar is a bar whether there are twelve of them or one.

The y-axis is pinned to 0–100 in all three forms, so switching never changes what
a given height means. The toggle is hidden when there are no points — three ways
to look at nothing is not a choice.

- `frontend/.../composer/TrendChart.tsx` — rewritten with a `type` prop
- `frontend/.../composer/ChartTypeToggle.tsx` (new) — the control and its
  `useSyncExternalStore` persistence hook
- `frontend/.../composer/DashboardComposer.tsx` — `PerformanceTrend`

The `root.dashboard.trend.aria` string was also corrected: it claimed "Bar chart
… from January to June", which was wrong on both counts.

---

## 12. AI-to-PDF panel was too stretched

**Root cause.** The dashboard's row packer widens a lone panel to the full 12
columns rather than leaving a hole. The CTA's hero layout was a stacked column,
so at full width a one-sentence pitch got a ~1200px measure and the button plus
the class picker wrapped onto their own line underneath.

**Fix.** Layout, not packing — the grid contract is worth keeping. The hero is
now a banner: text capped at 46 characters per line, actions beside it from `md`
up, `shrink-0` on the action group so the class `Select` keeps its own width
instead of stretching. Padding reduced from `p-5 sm:p-6` to `p-4 sm:p-5`. A new
`root.tests.import.cta.short` string carries the promise; the long explanation
belongs on the importer screen, where the user has already said yes.

- `frontend/src/app/(root)/_components/AiImportCta.tsx`
- three message catalogs

---

## 13. "Choose how to enter a school" screen

**Root cause.** Three outlined buttons of equal weight read as a toolbar.
Nothing said that "Create school" is the founding act while the other two are
redemptions of a credential someone else has to give you.

**Fix.** Three cards, staggered in on mount (with a reduced-motion equivalent).
The create-school card carries the brand gradient tile and a tinted panel and
comes first, because it is the only route that needs nothing from anybody else.
Each card now states **what you need in hand** — "Nothing needed", "Needs a
school code", "Needs an invite link" — which is the fact that actually decides
whether a route is open to a given user, and which was previously discovered
only inside the dialog.

- `frontend/src/app/(root)/_components/OnboardingActions.tsx`
- three message catalogs

**Accessibility detail worth checking.** The featured card is not a `<div>` with
a click handler. Its title is a real `<Link>` stretched over the card by an
`::after` pseudo-element, so the accessibility tree holds exactly one link,
named by its own text. The other two render *as* the `<button>` so Radix's
`asChild` trigger does not nest one interactive element inside another.

---

## Migration

`backend_nestJS/prisma/migrations/20260818000000_owner_blocklist_experience/migration.sql`
is **written but not applied**. It:

1. adds `SchoolMember.isOwner` and `.canManageAdmins`;
2. backfills the earliest `ADMIN` of each school as its owner — that is the
   member the school-creation transaction produced;
3. grants `canManageAdmins` to existing non-owner admins, preserving the ability
   they had in practice (there was no gate before) minus the power to delegate;
4. adds a partial unique index that prevents a second owner in one school;
5. adds the three `TestAttempt` experience columns and a database check that a
   rating is either null or 1–5;
6. creates `SchoolBlocklistEntry` with its unique `(schoolId, email)` index and
   three foreign keys.

Run `npx prisma migrate deploy` against a database before testing anything in
sections 3, 5, or 7. The Prisma client has already been regenerated, which is
why the backend typechecks without it.

---

## Translations

Every new string was added to all three catalogs (`en`, `ru`, `uz`):
`root.schoolPage.access.*` (roles, blocklist, invites), `root.dashboard.support.*`,
`root.dashboard.trend.chartType.*`, `root.dashboard.empty.actions.*Note`,
`root.classDetail.activity.partiallyMarked` / `.viewResult`,
`exam.result.experience.*`, `root.tests.import.cta.short`.
Role-change notification copy (`root.notifications.items.rolePromoted` /
`.roleDemoted`) is also present in all three catalogs.

`root.tests.import.cta.description` is now unused by any component. It was left
in place rather than deleted — it is still an accurate description of the
feature and may be wanted on the importer screen.

---

## Known gaps, stated plainly

- **No migration has been run.** Nothing in sections 3, 5, or 7 has been
  exercised against a live database.
- **No end-to-end run.** Every claim above is backed by unit tests, the type
  checker, lint, the production build, and the contrast gate. The UI changes
  were not opened in a browser.
- **The blocklist has no bulk import**, and no notification is sent to the person
  blocked. Both were out of scope for the request.
