# Classes

Classes are school-scoped academic groups. The backend owns class records, teaching assignments,
student enrollment, requests, and authorization. The frontend implementation is active under
`src/app/(root)/(pages)/groups/` with shared API and schema code under `src/app/(root)/_lib/`.

## User surfaces

- `/groups` — role-aware class directory and entry/request states
- `/groups/[classId]` — overview, assignments, activity, teacher and student rosters
- `/groups/[classId]/requests` — notification-compatible request review route
- `/groups/[classId]/tests/*` — class-specific tests and results
- `/school` — school directory and membership context feeding class discovery

The directory is driven by backend flags such as `canEnter`, `canRequest`, membership/request status,
capacity, and active counts. Do not recreate those decisions from client assumptions.

## Implemented request groups

- Class CRUD and detail/list/activity in `src/app/(root)/_lib/classes.api.ts`
- Assignable student/teacher lists and roster mutations in `classes.api.ts`
- Student directory, join/cancel/leave, direct assignment, and review in `enrollment.api.ts`
- Teacher request/cancel and admin review in `teacher-requests.api.ts`
- Zod contracts in the corresponding `*.schemas.ts` files
- TanStack Query ownership under `src/app/(root)/_hooks/` and `src/lib/query/keys.ts`

## Authorization invariants

- Always use selected-school session context and backend authorization.
- Admin-only controls may be hidden, but the backend remains the security boundary.
- Assigned teachers may manage students only where the backend grants that class capability; they
  do not receive the administrator's school-wide roster.
- Assign by `teacherProfileId` and `studentProfileId`, not global `userId`.
- The `assignable-*` endpoints are the picker source. Do not substitute `/students` or the full
  school member roster.
- Class pictures use multipart field `picture`; accept only PNG, JPEG, or WebP and render the URL
  returned by the backend.
- The retired Discover Classes endpoint/UI must not be restored. Use `/classes` and
  `/schools/:schoolId/classes` according to the documented role flow.

## UI rules

Admins can create, edit, delete, and manage both rosters. Assigned teachers can manage the student
roster where permitted; only admins manage teachers. Students see read-only or request/entry states.
Keep visible actions explicit, translate all copy in `en`, `ru`, and `uz`, and invalidate both role
directories and affected details after membership/request mutations.

Related: [`teacher-class-requests.md`](./teacher-class-requests.md),
[`school-profile-and-groups-ux.md`](./school-profile-and-groups-ux.md),
[`../architecture/RBAC.md`](../architecture/RBAC.md).
