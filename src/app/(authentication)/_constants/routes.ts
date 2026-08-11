export const protectedRoutes = [
  "/dashboard",
  "/onboarding",
  /**
   * The account area — identity, security, preferences and support in one
   * destination. Formerly split across `/profile` and `/settings`.
   */
  "/profile",
  /**
   * Retired: `/settings` and its subroutes now 307 to the matching `/profile`
   * tab (see `next.config.ts`).
   *
   * Config redirects run *before* the proxy, so in practice nothing unauthenticated
   * reaches this entry — `/settings` resolves as `/settings` → `/profile` → `/login`,
   * with the auth check happening at `/profile`. It stays listed only so the guard
   * survives if those redirects are ever dropped; it is not what protects the route
   * today.
   */
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
  /**
   * The exam room — the same argument from the student's side, with a stricter
   * requirement attached: while an attempt is live there must be nothing else
   * on screen to click. A sidebar link during a proctored exam is an invitation
   * to leave the screen, and some deliveries end the attempt for that.
   * See `docs/features/test-taking.md`.
   */
  "/exam",
  /**
   * Class-agnostic redirects into a test's results, for links that know only
   * the test id — a submission notification, or a URL pasted into a message.
   * See `(pages)/tests/[testId]/results`.
   */
  "/tests",
] as const;

export const publicRoutes = ["/login", "/signup", "/password-reset", "/reset-password"] as const;
