import type { ProfileResponse } from "@/app/(root)/_lib/profile.schemas";

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
  profile: ProfileResponse | null;
  /** Resolved from `?tab=` so the old Settings URLs land on the right panel. */
  initialTab: AccountTab;
};
