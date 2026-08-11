# Password Auth Settings

This is the frontend source of truth for password behavior across email login,
email signup, Google auth, and profile password management.

All backend routes are under:

```txt
/api/v1
```

## Product Rules

- Google signup/login never requires a Dwelve password.
- If an existing account uses the same verified email, Google auth can sign the
  user in without asking for the existing password.
- Manual email login always requires a password.
- Manual email signup always requires a password.
- A Google-only user can add a password later from the Profile security tab.
- A user who already has a password must enter the current password before
  changing it.
- The frontend must never show, log, store, or infer `passwordHash`.

## Backend Signals

Bootstrap the Profile account area with:

```txt
GET /api/v1/profile
```

Use:

```jsonc
{
  "account": {
    "authMethods": {
      "password": false,
      "google": true
    }
  }
}
```

Meaning:

- `authMethods.password === false`: show the set-password flow.
- `authMethods.password === true`: show the change-password flow.
- `authMethods.google === true`: show Google as connected.

Do not infer password state from signup method, email domain, local storage, or
route history.

## Manual Auth

Login calls:

```txt
POST /api/v1/auth/login
```

```json
{
  "email": "jane@example.com",
  "password": "password123",
  "schoolId": "optional-school-id"
}
```

Signup calls:

```txt
POST /api/v1/auth/signup
```

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

Frontend rules:

- Require password before submit.
- Keep password length from 8 to 72 characters.
- Never ask for `ADMIN`, `TEACHER`, or `STUDENT` during signup.

## Google Auth

The Google button calls:

```txt
POST /api/v1/auth/google
```

```json
{
  "idToken": "google-id-token",
  "schoolId": "optional-school-id"
}
```

or:

```json
{
  "credential": "google-id-token",
  "schoolId": "optional-school-id"
}
```

After success, reuse the same post-auth routing as manual auth:

1. Store the encrypted server-side session with returned tokens.
2. Enter the app if a selected school is returned.
3. Show the school picker when memberships exist but no school is selected.
4. Route to onboarding when the user has no memberships.

Do not create Google-only dashboard branches.

## Profile Security Password Panel

If `authMethods.password === false`, render:

- Title: `Set password`
- Fields: `newPassword`, `confirmPassword`
- No `currentPassword` field
- Submit: `Set password`

Submit:

```txt
POST /api/v1/profile/change-password
Authorization: Bearer accessToken
```

```json
{
  "newPassword": "new-password"
}
```

If `authMethods.password === true`, render:

- Title: `Change password`
- Fields: `currentPassword`, `newPassword`, `confirmPassword`
- Submit: `Change password`

Submit:

```txt
POST /api/v1/profile/change-password
Authorization: Bearer accessToken
```

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

On success:

```jsonc
{
  "success": true,
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

Then:

1. Replace the encrypted session tokens with the returned tokens.
2. Refetch `GET /profile`.
3. Clear password inputs.
4. Show a success message.

Older refresh sessions are revoked by the backend after a successful password
setup or change.

## Validation

- `newPassword` is required.
- `newPassword` must be at least 8 characters.
- `newPassword` must be at most 72 characters.
- `confirmPassword` must match `newPassword`.
- `currentPassword` is required only when `authMethods.password === true`.
- Disable submit while pending.
- Do not put password values in logs, analytics, URL params, local storage, or
  session storage.

## Error Handling

Suggested user-facing messages:

```txt
400 missing current password -> Enter your current password to continue.
400 invalid password format -> Check the password requirements.
401 wrong current password -> Current password is incorrect.
401 expired session -> Please sign in again.
429 too many attempts -> Too many attempts. Please wait and try again.
500 unexpected error -> We could not update your password. Please try again.
```

Keep raw backend messages in server logs only.

## QA Checklist

- Manual signup requires a password.
- Manual login requires a password.
- Google signup/login never asks for a password.
- Existing email/password users can sign in with Google when the backend accepts
  the verified matching email.
- Google-only users see `Set password`.
- Google-only users can set a first password with only `newPassword`.
- Password users see `Change password`.
- Password users cannot change password without `currentPassword`.
- Wrong current password shows a friendly error.
- Successful password setup/change replaces tokens and refetches profile.
