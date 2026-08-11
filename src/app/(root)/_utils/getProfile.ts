import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { getProfileRequest } from "../_lib/profile.api";
import type { ProfileResponse } from "../_lib/profile.schemas";

/**
 * The account area's single bootstrap (`GET /profile`). See
 * `docs/features/profile-page-contract.md`.
 *
 * Fails soft — returns `null` on any error so the route renders an unavailable
 * notice instead of crashing the authenticated shell, and so the frontend-owned
 * panels (theme, language, support) stay usable while the backend is not.
 *
 * There used to be a development fallback here that synthesized this payload
 * from the session cookie while the backend route was still shipping. It is gone
 * with the route it was waiting for: it made every backend failure look like a
 * success in development, and the profile it invented was wrong — it named the
 * selected school after the signed-in user and claimed `authMethods.password`
 * for accounts that may have no password, which is exactly the signal that picks
 * between the change-password and set-password flows.
 */
export async function getProfile(): Promise<ProfileResponse | null> {
  try {
    return await getProfileRequest(authedBackendJson);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("GET /profile failed:", error);
    }
    return null;
  }
}
