# Unified Profile And Account Settings Backend Contract

This is the backend contract consumed by the consolidated frontend Profile and
Settings area. `/profile` is the canonical account destination and API; there is
no backend `/settings` route. Use these endpoints with the authenticated request
helper and Zod response schemas.

All routes are under:

```txt
/api/v1
```

## Endpoints

```txt
GET    /profile
PATCH  /profile
PATCH  /profile/avatar
PATCH  /profile/school-profile
POST   /profile/change-password
GET    /profile/sessions
DELETE /profile/sessions/:sessionId
DELETE /profile
POST   /auth/logout-all
```

Every endpoint requires a bearer access token. `GET /profile` works without a
selected school, but selected-school details are returned only when the token has
school context.

## Profile Payload

Use `GET /profile` as the page bootstrap request.

```jsonc
{
  "account": {
    "id": "userId",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "avatarUrl": null,
    "globalRole": "USER",
    "isActive": true,
    "authMethods": {
      "password": true,
      "google": false
    },
    "createdAt": "2026-07-07T00:00:00.000Z",
    "updatedAt": "2026-07-07T00:00:00.000Z"
  },
  "selectedSchool": {
    "school": {
      "id": "schoolId",
      "name": "Dwelve Academy",
      "description": null,
      "country": "Uzbekistan",
      "city": "Tashkent",
      "logoUrl": null,
      "isActive": true,
      "createdAt": "2026-07-07T00:00:00.000Z",
      "updatedAt": "2026-07-07T00:00:00.000Z"
    },
    "member": {
      "id": "memberId",
      "userId": "userId",
      "schoolId": "schoolId",
      "role": "TEACHER",
      "isActive": true,
      "createdAt": "2026-07-07T00:00:00.000Z",
      "updatedAt": "2026-07-07T00:00:00.000Z"
    },
    "roleProfile": {
      "type": "TEACHER",
      "teacherId": "teacherProfileId",
      "phone": null,
      "bio": null,
      "classes": [
        {
          "assignmentId": "classTeacherId",
          "classId": "classId",
          "name": "Mathematics",
          "description": null,
          "pictureUrl": null,
          "isActive": true,
          "createdAt": "2026-07-07T00:00:00.000Z",
          "updatedAt": "2026-07-07T00:00:00.000Z"
        }
      ],
      "classCount": 1
    }
  },
  "memberships": [
    {
      "membership": {
        "id": "memberId",
        "userId": "userId",
        "schoolId": "schoolId",
        "role": "ADMIN",
        "isActive": true,
        "createdAt": "2026-07-07T00:00:00.000Z",
        "updatedAt": "2026-07-07T00:00:00.000Z"
      },
      "school": {
        "id": "schoolId",
        "name": "Dwelve Academy",
        "description": null,
        "country": null,
        "city": null,
        "logoUrl": null,
        "isActive": true,
        "createdAt": "2026-07-07T00:00:00.000Z",
        "updatedAt": "2026-07-07T00:00:00.000Z"
      }
    }
  ],
  "notificationStatus": {
    "hasUnread": false,
    "unreadCount": 0
  }
}
```

If no school is selected, `selectedSchool` is `null`.

Role profile variants:

```jsonc
{ "type": "ADMIN" }
```

```jsonc
{
  "type": "TEACHER",
  "teacherId": "teacherProfileId",
  "phone": null,
  "bio": null,
  "classes": [],
  "classCount": 0
}
```

```jsonc
{
  "type": "STUDENT",
  "studentId": "studentProfileId",
  "studentCode": null,
  "phone": null,
  "classes": [],
  "classCount": 0
}
```

## Mutations

### Update Account Name

```txt
PATCH /profile
```

```json
{
  "fullName": "Jane Doe"
}
```

Response is the full `GET /profile` payload.

### Update Avatar

```txt
PATCH /profile/avatar
```

Use `multipart/form-data`.

Fields:

```txt
avatar       optional JPEG, PNG, or WebP file, max 2 MB
removeAvatar optional boolean string, "true" to remove current avatar
```

Do not send both `avatar` and `removeAvatar=true`. Response is the full
`GET /profile` payload.

### Update School Role Profile

```txt
PATCH /profile/school-profile
```

Requires selected school context.

Teacher request:

```json
{
  "phone": "+998901234567",
  "bio": "Math teacher"
}
```

Student request:

```json
{
  "phone": "+998901234567"
}
```

Admins do not have teacher/student profile fields. Do not show this form for
admins. Response is the full `GET /profile` payload.

### Change Password

```txt
POST /profile/change-password
```

For users who already have password login enabled:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

For users without an existing password, such as Google-only accounts:

```json
{
  "newPassword": "new-password"
}
```

On success:

```json
{
  "success": true,
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

Store the returned tokens and treat older refresh tokens as revoked.

### Sessions

```txt
GET /profile/sessions
```

```jsonc
{
  "sessions": [
    {
      "sessionId": "session-id",
      "userAgent": "Mozilla/5.0 ...",
      "ipAddress": "::1",
      "createdAt": "2026-07-07T00:00:00.000Z",
      "expiresAt": "2026-07-14T00:00:00.000Z",
      "isCurrent": true
    }
  ],
  "count": 1
}
```

```txt
DELETE /profile/sessions/:sessionId
```

```json
{
  "success": true,
  "revokedCurrent": false
}
```

If `revokedCurrent` is `true`, clear local tokens and route to login.

### Logout All Devices

```txt
POST /auth/logout-all
```

This returns `{ "success": true }` after revoking all refresh sessions. Clear
the encrypted local session after success.

### Delete Account

```txt
DELETE /profile
```

This returns `{ "success": true }` after permanently deleting the authenticated
account. Clear the encrypted local session after success and do not retry the
mutation automatically.

## Frontend-Owned Preferences

Theme, language, support links, feedback composition, and documentation
navigation remain frontend-owned. They are not part of `GET /profile` and must
not trigger requests to a `/settings` backend endpoint.

Former `/settings` routes redirect to the matching `/profile` tab for backward
compatibility.

## UI Rules

- Do not display role selection on the profile page.
- Use `account.authMethods.password` to choose between `Set password` and
  `Change password` UI.
- Do not expose password hashes, token hashes, invite tokens, or raw refresh
  tokens.
- Email editing is not supported in v1. Show email as read-only.
- Use initials as fallback when `avatarUrl` is `null`.
- Show `selectedSchool.school` when it exists, but do not display a numeric
  count of schools or memberships on the profile page.
- Use `memberships` for school switcher context; use the existing auth
  `POST /auth/select-school` route to switch active school.
- Hide teacher/student role-profile edit controls when `roleProfile.type` is
  `ADMIN`.

## Error Handling

```txt
400 invalid DTO, invalid file, no mutation fields, unsupported role-profile field, missing current password
401 expired/invalid auth or wrong current password
403 missing/invalid selected school context
404 session not found
429 profile security or avatar mutation rate limit exceeded
```

Use backend messages for developer logging, but keep end-user text friendly and
non-leaky.
