# Dwelve Class Enrollment - Frontend Reference

## Purpose

This document defines the frontend behavior for the implemented V1 class
enrollment backend.

The UI must clearly separate:

- school membership;
- class enrollment.

A student who joins a school is not automatically enrolled in every school
class. Only active class roster entries belong in `My Classes`.

## Backend Contract Assumptions

All API routes use:

```txt
/api/v1
```

Most enrollment routes use the selected-school JWT context. When a user switches
schools, the frontend must call the existing selected-school flow before calling
school-scoped class routes.

V1 backend details:

- `ClassEnrollment` stores request, approval, rejection, assignment, and removal
  state.
- `ClassStudent` is the active roster used by existing class/student APIs.
- `studentId` in class assignment/removal APIs means `StudentProfile.id`.
- Discovery supports `search`, `page`, and `limit`.
- V1 does not support hidden/visible class settings, grade filters, group
  filters, schedules, subjects, cohorts, or request history pages.

## Main Student Experience

After joining or selecting a school, the student sees:

```txt
School Overview
My Classes
Discover Classes
Pending Requests
```

Summary counts come from:

```http
GET /api/v1/schools/:schoolId/student-overview
```

## Student Pages

## School Overview

Suggested route:

```txt
/schools/:schoolId
```

Display:

- school name;
- school logo;
- student-visible description;
- available class count;
- active class count;
- pending request count.

Do not display private staff information, hidden admin settings, or other
students' records.

## My Classes

Suggested route:

```txt
/my-classes
```

Fetch:

```http
GET /api/v1/me/classes?status=ACTIVE
```

Display only returned active classes. Empty state:

```txt
You are not enrolled in any classes yet.
Browse available classes or wait for a teacher to assign you.
```

## Discover Classes

Suggested route:

```txt
/schools/:schoolId/classes
```

Fetch:

```http
GET /api/v1/schools/:schoolId/classes/discover?search=math&page=1&limit=20
```

Each card should use backend-provided `canRequest`,
`studentEnrollmentStatus`, `enrollmentMode`, `capacity`, and
`activeStudentCount`. Do not reconstruct authorization rules in the UI.

Card states:

- `canRequest: true`: show `Request to Join`.
- `studentEnrollmentStatus: "PENDING"`: show `Request pending` and
  `Cancel Request`.
- `enrollmentMode: "DIRECT_ASSIGNMENT"` with `canRequest: false`: show
  `Teacher assignment required`.
- `capacity` reached with `canRequest: false`: show `Class full`.

Active classes are normally excluded from discovery by the backend.

## Pending Requests

Suggested route:

```txt
/my-class-requests
```

Fetch:

```http
GET /api/v1/me/class-enrollments?status=PENDING&page=1&limit=20
```

Display:

- class name;
- teacher name when available;
- request date;
- `Awaiting approval` status;
- cancel action.

Cancel:

```http
DELETE /api/v1/classes/:classId/join-request
```

## Student Join Request Flow

1. Student opens Discover Classes.
2. Student clicks `Request to Join`.
3. Optional dialog collects a short message.
4. Frontend sends `POST /api/v1/classes/:classId/join-requests`.
5. Disable repeated clicks while loading.
6. On success, update the card state and pending counts.
7. On failure, show a mapped error message.

Body:

```json
{
  "message": "Optional message from the student"
}
```

If the class uses `OPEN`, the backend may return `status: "ACTIVE"` instead of
`PENDING`; the UI should move it into `My Classes`.

## Teacher And Admin Experience

## Class Requests

Suggested route:

```txt
/classes/:classId/requests
```

Fetch:

```http
GET /api/v1/classes/:classId/join-requests?status=PENDING&page=1&limit=20
```

Teachers can manage only classes assigned to them. Admins can manage any class
in the selected school. The backend enforces this; the UI should still hide
unavailable actions.

Approve:

```http
POST /api/v1/class-enrollments/:enrollmentId/approve
```

Reject:

```http
POST /api/v1/class-enrollments/:enrollmentId/reject
```

Body:

```json
{
  "reason": "Optional rejection reason"
}
```

## Assign Student

Suggested entry points:

```txt
Class Details -> Students -> Add Student
Student Profile -> Assign to Class
```

Fetch candidates from the class-scoped picker — never the school-wide student
API, which is admin-only and would break the picker for assigned teachers:

```http
GET /api/v1/classes/:classId/assignable-students?search=&page=1&limit=20
```

Then send:

```http
POST /api/v1/classes/:classId/students
```

Body:

```json
{
  "studentId": "studentProfileId"
}
```

Direct assignment is idempotent. If the student has a pending, rejected,
cancelled, or removed enrollment, assignment activates that existing enrollment.

Remove:

```http
DELETE /api/v1/classes/:classId/students/:studentId
```

`studentId` is `StudentProfile.id`.

## Frontend State Model

```ts
type EnrollmentStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "CANCELLED"
  | "REMOVED"
  | "COMPLETED";

type EnrollmentMode = "REQUEST_APPROVAL" | "DIRECT_ASSIGNMENT" | "OPEN";

type DiscoverableClass = {
  id: string;
  name: string;
  description?: string | null;
  pictureUrl?: string | null;
  teacher?: {
    id: string;
    userId: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  enrollmentMode: EnrollmentMode;
  studentEnrollmentStatus?: EnrollmentStatus | null;
  canRequest: boolean;
  capacity?: number | null;
  activeStudentCount: number;
};
```

Status labels:

```txt
PENDING -> Awaiting approval
ACTIVE -> Enrolled
REJECTED -> Rejected
CANCELLED -> Cancelled
REMOVED -> Removed
COMPLETED -> Completed
```

## API Summary

```txt
GET    /api/v1/schools/:schoolId/student-overview
GET    /api/v1/schools/:schoolId/classes/discover
GET    /api/v1/me/classes?status=ACTIVE
GET    /api/v1/me/class-enrollments?status=PENDING
POST   /api/v1/classes/:classId/join-requests
DELETE /api/v1/classes/:classId/join-request
GET    /api/v1/classes/:classId/join-requests?status=PENDING
POST   /api/v1/class-enrollments/:enrollmentId/approve
POST   /api/v1/class-enrollments/:enrollmentId/reject
POST   /api/v1/classes/:classId/students
DELETE /api/v1/classes/:classId/students/:studentId
```

## Cache Refresh Rules

After a student sends or cancels a request, refresh or update:

- school overview;
- discover classes;
- pending requests.

After approval or direct assignment, refresh or update:

- My Classes;
- pending requests;
- discover classes;
- class student list;
- school overview.

After rejection or removal, refresh or update:

- pending requests;
- discover classes;
- My Classes when applicable;
- class student list;
- school overview.

Suggested query keys:

```ts
["school-overview", schoolId][("my-classes", schoolId)][
  ("class-discovery", schoolId, filters)
][("my-class-requests", schoolId, filters)][
  ("class-join-requests", schoolId, classId, filters)
][("class-students", schoolId, classId)];
```

## Error Mapping

Map backend messages/statuses to clear UI text:

```txt
Student is already enrolled -> You are already enrolled in this class.
Join request is already pending -> Your request is already awaiting approval.
Class capacity reached -> This class is currently full.
Class request is not allowed -> This class requires teacher assignment.
School membership is required -> You must join this school before requesting a class.
You do not have permission -> You do not have permission to manage this class.
```

Avoid exposing raw stack traces or unprocessed server errors.

## Permission-Based UI

Student:

- request to join;
- cancel own pending request;
- open active class.

Teacher:

- view pending requests for assigned classes;
- approve/reject requests for assigned classes;
- assign/remove students for assigned classes.

Admin:

- all class enrollment management actions for the selected school.

The backend remains the security boundary.

## Accessibility

- Buttons must have clear labels.
- Status must not be communicated by color alone.
- Dialogs must trap focus and close with Escape.
- Loading states should use `aria-busy` where appropriate.
- Toasts should be announced to screen readers.
- Disabled actions should include an explanation when useful.

## V1 Acceptance Criteria

- school overview uses student-visible backend data;
- My Classes uses only `GET /api/v1/me/classes?status=ACTIVE`;
- Discover Classes uses backend `canRequest` and status fields;
- students can request and cancel class access;
- teachers/admins can approve, reject, assign, and remove where authorized;
- direct assignment uses `StudentProfile.id`;
- mutations update relevant cached data without full-page reloads;
- permission, loading, empty, and error states are handled.
