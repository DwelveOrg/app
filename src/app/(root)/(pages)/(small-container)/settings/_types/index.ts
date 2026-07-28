import type { ProfileResponse } from "@/app/(root)/_lib/profile.schemas";
import type { SessionUser } from "@/app/(root)/_utils/getUser";

export type FeedbackModalKind = "bug" | "feature";

export type SettingsClientProps = {
  user: SessionUser | null;
  profile: ProfileResponse | null;
};

/**
 * Identity resolved once in `settings.client` from the profile bootstrap, with
 * the session cookie as fallback. Passed to the rows that display it (account
 * card) or attach it to an outgoing support message.
 */
export type SettingsAccountContext = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  schoolName: string | null;
  /** Raw backend role (`ADMIN` | `TEACHER` | `STUDENT`), not a display label. */
  role: string | null;
};
