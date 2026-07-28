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
GET    /schools/:schoolId/members
```

`GET /schools/:schoolId/members` is used for School page counts and admin class
assignment pickers. Counts are visible to active school members. Roster rows,
including `email`, `teacherProfileId`, and `studentProfileId`, are admin-only.

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

- `/groups` is the class directory.
- `/groups/[classId]` is the class detail page.
- Admins can see create, edit, delete, teacher assignment, and student
  assignment controls.
- Teachers and students see read-only class surfaces unless a later backend
  contract grants mutation permissions.
- Add test/add exam controls must stay coming-soon until exam frontend
  mutations are wired.

## Discover Classes Replacement

The Discover Classes UI is retired. Remove its tabs, links, mock data, and any
calls to `GET /schools/:schoolId/classes/discover`.

Use `GET /classes` as the class directory. For students, render entry/request
actions only from backend-provided `canEnter`, `canRequest`,
`studentEnrollmentStatus`, `enrollmentMode`, `capacity`, and
`activeStudentCount` fields. See `school-profile-and-groups-ux.md` for the
School-page Teachers tab and `/groups/[classId]` UX requirements.

## Related Docs

```txt
docs/architecture/RBAC.md
docs/api/API_ROUTES.md
```
