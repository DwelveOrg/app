import type { AuthUser } from "@/app/(authentication)/_types/auth";
import type { ProfileResponse } from "@/app/(root)/_lib/profile.schemas";

export type ProfileUser = AuthUser;

/**
 * The four panels of the consolidated account area. Profile and Settings used to
 * be two destinations with two `GET /profile` bootstraps between them; they are
 * one route now, and this is what the tab row switches between.
 *
 * `account` and `security` need the bootstrap. `preferences` and `support` do
 * not — theme, language and the support composer are frontend-owned, which is
 * why they stay reachable when `GET /profile` fails.
 */
export const accountTabs = ["account", "security", "preferences", "support"] as const;

export type AccountTab = (typeof accountTabs)[number];

export function isAccountTab(value: unknown): value is AccountTab {
  return typeof value === "string" && (accountTabs as readonly string[]).includes(value);
}

export type ProfileClientProps = {
  user: ProfileUser | null;
  profile: ProfileResponse | null;
  /** Resolved from `?tab=` so the old Settings URLs land on the right panel. */
  initialTab: AccountTab;
};

export type FeedbackModalKind = "bug" | "feature";

/**
 * Identity resolved once from the profile bootstrap, with the session cookie as
 * fallback. Passed to the support composer, which attaches it to an outgoing
 * message so the team can identify the account without a round-trip.
 */
export type AccountContext = {
  name: string | null;
  email: string | null;
  schoolName: string | null;
  /** Raw backend role (`ADMIN` | `TEACHER` | `STUDENT`), not a display label. */
  role: string | null;
};
