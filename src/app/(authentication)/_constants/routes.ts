export const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/settings",
  "/notifications",
  "/groups",
  "/school",
  "/schools",
  "/assignments",
  /**
   * The test studio. A separate top-level segment rather than a page inside
   * `/groups`, because it is a different *environment*: no sidebar, no app
   * chrome, one document in front of the author. See `docs/features/test-studio.md`.
   */
  "/studio",
] as const;

export const publicRoutes = ["/login", "/signup", "/password-reset", "/reset-password"] as const;
