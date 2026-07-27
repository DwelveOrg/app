# Teacher Class Visibility And Join Requests

This document describes the frontend work required to consume the backend
teacher class-request feature. No frontend implementation is included here.

## What Changed

Teachers now receive every active class in their currently selected school from
`GET /api/v1/classes`, including classes to which they have not yet been
assigned. Students continue to receive all active classes from the same route.

Teacher class items add these fields:

```ts
{
  teacherRequestStatus:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'REMOVED'
    | null;
  canRequest: boolean;
  canEnter: boolean;
}
```

`canEnter` is true only after an administrator has assigned/approved the
teacher for that class. `canRequest` is true when the teacher is not assigned
and does not already have a pending request.

## Teacher Actions

Use the existing authenticated API helper and add named endpoint functions,
Zod response schemas, server actions, and React Query invalidation for:

```txt
POST   /classes/:classId/teacher-join-requests
DELETE /classes/:classId/teacher-join-request
```

The POST body is optional:

```json
{ "message": "Optional message" }
```

POST returns `{ request }`; DELETE returns the updated `{ request }` with
status `CANCELLED`.

Teacher UI behaviour:

- Render all classes returned by `GET /classes`.
- When `canRequest` is true, show a “Request to teach” action.
- When `teacherRequestStatus` is `PENDING`, show a pending state and allow
  cancellation.
- When it is `REJECTED`, show the rejection state/reason if returned and allow
  another request.
- When `canEnter` is true, render the normal assigned-teacher class actions.
- Refresh the classes query after create/cancel and when notifications are
  acted on.

## Admin Review Actions

Add an admin-only teacher-request section to each class using:

```txt
GET  /classes/:classId/teacher-join-requests?status=PENDING&page=1&limit=20
POST /class-teacher-requests/:requestId/approve
POST /class-teacher-requests/:requestId/reject
```

The list response is:

```ts
{
  requests: Array<{
    id: string;
    schoolId: string;
    classId: string;
    teacherId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REMOVED';
    message: string | null;
    rejectionReason: string | null;
    requestedAt: string | null;
    reviewedAt: string | null;
    reviewedById: string | null;
    teacher: {
      id: string;
      memberId: string;
      userId: string;
      fullName: string;
      email: string;
    };
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
}
```

Approval creates the teacher's class assignment. Rejection accepts the same
optional `{ "reason": "..." }` body used for student request rejection. After
either action, invalidate both the request list and `GET /classes`.

## Membership Transition

An account that left a school as a student can now accept a teacher invite for
that same school. The frontend should handle the successful invite response as
a new selected-school session: store the returned tokens and refresh the
profile/school/classes queries. Do not show the previous “already a member”
message for an inactive membership.

## Notifications

Support these additional notification types for deep links and refreshes:

```txt
TEACHER_CLASS_JOIN_REQUEST_CREATED
TEACHER_CLASS_JOIN_REQUEST_APPROVED
TEACHER_CLASS_JOIN_REQUEST_REJECTED
```

Notification data includes `schoolId`, `classId`, `teacherId`, and
`teacherRequestId`.
