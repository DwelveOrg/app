# School, Profile, And Groups UX Work

## Scope

Implement the frontend work below using the existing backend contracts. Do not
change signup roles, create teacher/student accounts directly, or bypass the
selected-school session context.

## 1. Profile: Show The Active School, Not A School Count

Use `GET /profile` as the page bootstrap request.

- Display `selectedSchool.school` (logo, name, city/country where available)
  when `selectedSchool` is present.
- Do not render a numeric school or membership count on the profile page.
- When `selectedSchool` is `null`, show the existing no-school state with
  create-school and join-school actions.
- Do not expose a school-role picker. School roles come only from membership.

The backend can return membership context for session handling. That does not
mean the profile page should turn it into a count metric.

## 2. School Page: Add A Teachers Tab

Show `Teachers` beside `Students` for school admins.

```txt
GET /schools/:schoolId/members
```

The endpoint returns school counts to active members, but detailed `members`
rows only to `ADMIN` users. In the admin view, filter by:

```ts
member.role === 'TEACHER'
```

Use `fullName`, `email`, `teacherProfileId`, and `createdAt` to render the
roster. Do not use `userId` as a teacher ID for class assignment. Preserve the
teacher invite flow; never create a teacher account from this tab.

Include loading, empty, and error states. Teachers and students may use the
returned counts where needed, but their valid `members: []` response must never
be treated as a roster or render another member's email.

The school page uses intent loading rather than fetching every hidden admin
panel during the initial render. School detail supplies counts and viewer
permissions. Teachers/students load on first tab mount; access-dialog members
load when the dialog opens; invitations and blocklist load only when their
subtab is selected. Mutations invalidate `queryKeys.schools.directoryAll()` and
refresh the RSC aggregate counts where applicable.

## 3. Improve `/groups/[classId]`

- Put class identity first: picture/fallback, name, description, status,
  teacher, participant count, and capacity when available.
- Use accessible overview, people, and requests sections.
- Match actions to backend permissions and never depend on client-only role
  checks for authorization.
- Include skeleton loading, meaningful empty states, a friendly `403` access
  state, a `404` not-found state, and retryable request errors.
- Confirm destructive actions, then invalidate/refetch affected class data.
- Add all new visible text to `en`, `ru`, and `uz` catalogs.

## 4. Retire Discover Classes

Remove the Discover Classes tab, links, mock data, and calls to:

```txt
GET /schools/:schoolId/classes/discover
```

Use the single class directory instead:

```txt
GET /classes
GET /classes/:classId
POST /classes/:classId/join-requests
DELETE /classes/:classId/join-request
```

For students, render calls to action only from `canEnter`, `canRequest`,
`studentEnrollmentStatus`, `enrollmentMode`, `capacity`, and
`activeStudentCount`. Validate backend responses with Zod before rendering.

## Acceptance Checklist

- Profile shows a selected-school card and no school-count metric.
- Admins can view real teachers in a Teachers tab.
- Non-admins cannot receive or render member roster data.
- `/groups/[classId]` covers loading, empty, error, forbidden, and not-found
  states.
- Discover Classes is fully removed and the directory is backed by
  `GET /classes`.
