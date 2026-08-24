# Teacher Class Visibility and Join Requests

This flow is implemented. Teachers receive active classes in the selected school from `GET /classes`
with backend-computed `teacherRequestStatus`, `canRequest`, and `canEnter` fields. The frontend must
render those decisions rather than derive access locally.

## Teacher flow

- `POST /classes/:classId/teacher-join-requests` creates a request with an optional message.
- `DELETE /classes/:classId/teacher-join-request` cancels the caller's pending request.
- Pending and rejected states remain visible; a teacher enters the class only when `canEnter` is true.
- Successful changes invalidate the teacher class list and affected detail/request queries.

Implementation:

- `src/app/(root)/_lib/teacher-requests.api.ts`
- `src/app/(root)/_lib/teacher-requests.schemas.ts`
- `src/app/(root)/_lib/teacher-requests.actions.ts`
- `src/app/(root)/_hooks/useTeacherRequests.ts`
- `src/app/(root)/(pages)/groups/`

## Administrator review

- `GET /classes/:classId/teacher-join-requests` lists requests.
- `POST /class-teacher-requests/:requestId/approve` creates the teaching assignment.
- `POST /class-teacher-requests/:requestId/reject` records rejection and optional reason.

Review actions refresh both the request list and class/member data. Authorization is backend-enforced;
the frontend's role checks only control presentation.

## Membership transition

An inactive former student membership does not permanently block accepting a teacher invite for the
same school. A successful invite response supplies a new selected-school session; persist its fresh
tokens and refresh profile, school, and class data.

## Notifications

The frontend handles teacher request created/approved/rejected notifications and resolves their
`schoolId`, `classId`, `teacherId`, and `teacherRequestId` data to class/request destinations in
`src/app/(root)/(pages)/notifications/_lib/notifications.ts`.

Related: [`classes.md`](./classes.md), [`notifications.md`](./notifications.md),
[`../architecture/RBAC.md`](../architecture/RBAC.md).
