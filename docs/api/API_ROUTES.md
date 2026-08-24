# Frontend-Consumed API

The application calls the NestJS API from the server. The backend's canonical endpoint reference is
[Backend API routes](../../../backend_nestJS/docs/api/API_ROUTES.md); this page maps the endpoint
families actively consumed by this frontend to their implementation.

Local base URL:

```env
DWELVE_API_BASE_URL=http://localhost:5001/api/v1
```

Do not create a browser-visible API base for authenticated traffic.

## Request contract

Every request follows:

```text
named request function -> backendJson/authedBackendJson -> Zod response schema
```

Client components call Server Actions or server helpers. The low-level client is
`src/app/(authentication)/_lib/backend.ts`. It supplies bearer tokens, request IDs, safe error
mapping, and controlled refresh behavior.

| API family                                           | Authentication/context                                 | Frontend implementation                                                              |
| ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `/auth/*`                                            | Public or refresh-token dependent                      | `src/app/(authentication)/_lib/api.ts`                                               |
| `/profile*`                                          | User JWT; selected school for role profile             | `src/app/(root)/_lib/profile.api.ts`                                                 |
| `/schools*`, `/me/classes`                           | User JWT; most mutations selected-school scoped        | `src/app/(authentication)/_lib/api.ts`, `src/app/(root)/_lib/enrollment.api.ts`      |
| `/classes*`, class student/teacher request routes    | User JWT + selected school + relationship checks       | `src/app/(root)/_lib/classes.api.ts`, `enrollment.api.ts`, `teacher-requests.api.ts` |
| `/students*`                                         | User JWT; admin or documented class capability         | `src/app/(root)/_lib/students.api.ts`                                                |
| `/notifications*`                                    | User JWT                                               | `src/app/(root)/_lib/notification-actions.ts`                                        |
| `/dashboard/*`                                       | User JWT + selected school                             | `src/app/(root)/_lib/dashboard.api.ts`                                               |
| `/tests*`, `/classes/:classId/tests*`                | User JWT + school/class/test capabilities              | `src/app/(root)/_lib/tests.api.ts`, `test-results.api.ts`                            |
| `/attempts*`                                         | User JWT + attempt ownership or grading capability     | `src/app/exam/_lib/attempts.api.ts`, `src/app/(root)/_lib/test-results.api.ts`       |
| `/tests/imports*`, `/classes/:classId/tests/imports` | Teacher/admin capability; multipart for upload         | `src/app/(root)/_lib/test-import.api.ts`                                             |
| `POST /reports`                                      | User JWT; intentionally no selected-school requirement | `src/lib/reports/reports.api.ts`                                                     |

Detailed test-authoring shapes live in [`test-creation.md`](./test-creation.md). Other feature
contracts live under [`../features/`](../features/), next to the UI rules that depend on them.

## Auth and session behavior

Login, signup, Google auth, password reset, refresh, logout, and school selection may return fresh
tokens. Tokens are stored only in the encrypted `httpOnly` application session. Response handlers
must never expose them to client components or browser storage.

The proxy proactively refreshes expiring access tokens. A reactive request may refresh only when
`canPersistSession` confirms the current execution boundary can save the rotated cookie. See
[`../architecture/SECURITY.md`](../architecture/SECURITY.md).

## Errors and validation

- Backend JSON is parsed by the response schema before it reaches UI code.
- Expected action failures become safe user-facing messages; internal payloads and stack traces stay
  server-side.
- `401` may trigger controlled token refresh; `403` must not be presented as missing data when the
  distinction matters.
- Validation and conflict responses may contain feature-specific issue data; preserve those shapes
  only in the owning schema/action rather than teaching components raw backend errors.
- Request IDs are forwarded for correlation. Do not log tokens, passwords, query-string secrets, or
  multipart contents.

## Adding or changing an endpoint

Update the backend controller/service/DTO and backend API docs, then add or change the named frontend
request, Zod schema, action/helper, query key, invalidation behavior, feature docs, and this family map
when its architecture changes.
