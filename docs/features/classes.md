# Classes

Classes are school-scoped academic groups. The backend must remain the source of
truth for class ownership, membership, teachers, and students.

## Frontend Status

Class/group UI is under active development in:

```txt
src/app/(root)/(pages)/groups/
```

When real class API wiring is added, it must follow the frontend request
architecture:

```txt
named endpoint function
-> authedBackendJson
-> Zod response schema
-> server action or server helper
-> React Query hook for client state
```

## Backend Routes

```txt
GET    /classes
GET    /classes/:classId
POST   /classes
PATCH  /classes/:classId
DELETE /classes/:classId
POST   /classes/:classId/students
DELETE /classes/:classId/students/:studentId
POST   /classes/:classId/teachers
DELETE /classes/:classId/teachers/:teacherId
GET    /classes/:classId/assignable-students
GET    /classes/:classId/assignable-teachers
GET    /classes/:classId/activity
GET    /schools/:schoolId/members
GET    /schools/:schoolId/classes
```

The add-to-class pickers are the two class-scoped `assignable-*` routes: they
return active school members not already on that class's roster, with
server-side `search`, `page`, and `limit`. `assignable-students` is open to
admins and to teachers assigned to the class; `assignable-teachers` is
admin-only. Do not use `GET /schools/:schoolId/members` or `GET /students` for a
teacher's picker — those deliberately withhold the school roster from
non-admins.

`GET /schools/:schoolId/members` remains the School page roster and counts.
Counts are visible to active school members. Roster rows, including `email`,
`teacherProfileId`, and `studentProfileId`, are admin-only.

## Frontend Rules

- Do not send `userId` to bypass backend ownership.
- Use selected school context from the session/backend.
- Hide admin-only class mutation controls for non-admin members.
- Still rely on the backend to enforce permissions.
- Use `teacherProfileId` and `studentProfileId`, not `userId`, when assigning
  teachers/students to classes.
- Do not send or render the removed `gradeLevel` field.
- School logos use the `logo` multipart field.
- Class pictures use the `picture` multipart field.
- Accept only PNG, JPEG, and WebP image uploads.
- Store and render backend-returned `logoUrl` and `pictureUrl`; do not send
  user-entered external image URLs.
- Add all visible copy to `en`, `ru`, and `uz` catalogs.
- Validate all backend class responses with Zod before rendering.

## UI Surfaces

- `/groups` is the class directory. For students it is grouped by the decision
  each class is waiting on: enter, awaiting approval, requestable, unavailable.
- The School page is server-seeded for student and teacher class discovery;
  React Query keeps request-driven changes current.
- `/groups/[classId]` contains the assignments board, class overview, activity
  feed, and separate counted Teachers and Students modal panels.
- Requests are handled on the class page itself — students for assigned
  teachers, students and teachers for admins. `/groups/[classId]/requests`
  remains as the notification deep-link target.
- Admins can see create, edit, delete, teacher assignment, and student
  assignment controls.
- Teachers assigned to a class may add and remove its students; only admins may
  change the teaching roster. Students see read-only class surfaces.
- Every action a viewer is permitted is rendered directly. Keep an overflow menu
  only where it holds two or more independent actions.
- Admins and assigned teachers author tests through the studio; the class page
  owns the filterable assignments board.
- Class activity is server-seeded and polls while visible. Teachers receive
  attempt/publication rows only for tests they authored; admins receive all
  class test activity.

## Discover Classes Replacement

The Discover Classes UI is retired. Remove its tabs, links, mock data, and any
calls to `GET /schools/:schoolId/classes/discover`.

Use `GET /classes` for staff-owned class lists and
`GET /schools/:schoolId/classes` for student/teacher discovery. Render
entry/request actions only from backend-provided flags: student rows use
`canEnter`, `canRequest`, `studentEnrollmentStatus`, `enrollmentMode`,
`capacity`, and `activeStudentCount`; teacher rows use `canEnter`, `canRequest`,
and `teacherRequestStatus`. See `school-profile-and-groups-ux.md` for the School
page and `/groups/[classId]` UX requirements.

## Related Docs

```txt
docs/architecture/RBAC.md
docs/api/API_ROUTES.md
```
