# Problem reporting

A user can say "this is broken" from wherever it broke, and send a screenshot
with it.

## Why it exists in this shape

Reporting used to live in the profile Support tab, and the composer it opened
built a `mailto:` URL. Two problems, both fatal:

1. **A `mailto:` cannot carry an attachment.** The one artefact that makes a bug
   report actionable was the one thing it could not send. The modal ended up
   asking the user to attach the screenshot themselves, in a mail client they
   may never have configured.
2. **It was three clicks from the problem.** By the time a user navigated to
   Profile → Support, the URL, the filter, and the state that produced the bug
   were gone — and so was the ability to screenshot it.

## The control

`src/components/Custom/ReportProblem` — a floating button, mounted in every
authenticated shell:

| Shell | File |
|---|---|
| Dashboard | `src/app/(root)/layout.tsx` |
| Studio | `src/app/studio/layout.tsx` |
| Exam room | `src/app/exam/layout.tsx` |
| Onboarding | `src/app/onboarding/layout.tsx` |

**It hides itself on `/exam/[testId]/attempt`.** The exam room's rule is that
while an attempt is live there is nothing else on screen to click; on a delivery
with `detectLeaveScreen: SUBMIT`, a floating button that opens a modal is an
invitation to end the attempt. The hide is inside the component (`HIDDEN_PATHS`)
rather than at the mount site, so a shell added later cannot forget it.

The open state lives one component below the route check, so walking into the
exam room *destroys* it rather than parking it — otherwise a dialog left open on
the cover screen would reappear by itself on the submitted screen afterwards.

## The dialog

`ReportProblemDialog`. Kind (bug / feedback / question), a message, and an
optional screenshot.

**Paste is a first-class input.** The way a person actually takes a screenshot
is a system shortcut that puts it on the clipboard; requiring them to save it to
disk first to satisfy a file input adds a step at the exact moment they are
already frustrated. The dialog's whole body accepts a paste.

**Context is collected and disclosed.** Page URL (`location.href`, not
`pathname` — a report about a filtered view should point at that view), user
agent, viewport, and locale. These are the questions a maintainer asks first and
the reporter is worst placed to answer. The dialog says it is sending them; the
part that would be objectionable is collecting silently, not collecting.

## The request

`POST /reports`, multipart, through `submitReportAction` — a plain server action
rather than a `next-safe-action` one, because the payload carries a file. The
action rebuilds the `FormData` rather than forwarding it, so a field the dialog
never sends cannot be injected into the backend request.

Identity on the report is the **session's**, read on the backend. Nothing the
client sends is trusted to say who is reporting.

Backend contract: `backend_nestJS/docs/api/API_ROUTES.md#reports`. Notable
properties it guarantees —

- JWT only, **no selected-school context**: a user can hit a bug before picking
  a school, or because picking one is what is broken.
- 10 reports per account per 10 minutes.
- 8 MB screenshot cap, JPEG/PNG/WebP.
- A failed insert deletes the object it had already uploaded.
- Reads are platform-operator only. A report carries another user's words, page
  URL, and screenshot, so a school `ADMIN` is not an audience for it.
