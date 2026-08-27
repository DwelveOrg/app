# Problem reporting

A user can say "this is broken" from wherever it broke and send a text report
with useful browser context.

## Why it exists in this shape

Reporting used to live in the profile Support tab, and the composer it opened
built a `mailto:` URL. Two problems made that unreliable:

1. **It depended on a configured mail client.** A product report should reach
   the team directly instead of handing delivery to another application.
2. **It was three clicks from the problem.** By the time a user navigated to
   Profile → Support, the URL, the filter, and the state that produced the bug
   were gone.

## The control

`src/components/Custom/ReportProblem` — a floating button, mounted in every
authenticated shell:

| Shell      | File                            |
| ---------- | ------------------------------- |
| Dashboard  | `src/app/(root)/layout.tsx`     |
| Studio     | `src/app/studio/layout.tsx`     |
| Exam room  | `src/app/exam/layout.tsx`       |
| Onboarding | `src/app/onboarding/layout.tsx` |

**It hides itself on `/exam/[testId]/attempt`.** The exam room's rule is that
while an attempt is live there is nothing else on screen to click; on a delivery
with `detectLeaveScreen: SUBMIT`, a floating button that opens a modal is an
invitation to end the attempt. The hide is inside the component (`HIDDEN_PATHS`)
rather than at the mount site, so a shell added later cannot forget it.

The open state lives one component below the route check, so walking into the
exam room _destroys_ it rather than parking it — otherwise a dialog left open on
the cover screen would reappear by itself on the submitted screen afterwards.

## The dialog

`ReportProblemDialog`. Kind (bug / feedback / question) and a message.

**Reports are text-only.** The product app does not expose a file picker, handle
pasted images, or forward a `screenshot` field. This keeps report submission
small and avoids collecting potentially sensitive screen content.

**Context is collected and disclosed.** Page URL (`location.href`, not
`pathname` — a report about a filtered view should point at that view), user
agent, viewport, and locale. These are the questions a maintainer asks first and
the reporter is worst placed to answer. The dialog says it is sending them; the
part that would be objectionable is collecting silently, not collecting.

## The request

`POST /reports` through `submitReportAction`. The browser calls the server
action with `FormData`; the action validates the message, reads only its named
text/context fields, and sends a JSON body to the backend. A caller cannot
inject a file because the action never reads or forwards one.

Identity on the report is the **session's**, read on the backend. Nothing the
client sends is trusted to say who is reporting.

Backend contract: `backend_nestJS/docs/api/API_ROUTES.md#reports`. Notable
properties it guarantees —

- JWT only, **no selected-school context**: a user can hit a bug before picking
  a school, or because picking one is what is broken.
- 10 reports per account per 10 minutes.
- Reads are platform-operator only. A report carries another user's words, page
  URL, and browser context, so a school `ADMIN` is not an audience for it.

The backend still accepts an optional screenshot for backward compatibility,
and the operator console can display screenshots on older reports. The product
app no longer creates them.
