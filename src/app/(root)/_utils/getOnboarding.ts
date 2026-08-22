import "server-only";

import { getOnboardingRequest } from "../_lib/onboarding.api";
import type { OnboardingState } from "../_lib/onboarding.schemas";

/**
 * Reads the server-owned onboarding state for the current session.
 *
 * Fails soft. If the call errors we report the flow as already finished rather
 * than `in_progress`: a backend hiccup must never trap an established user in a
 * first-run wizard on their way to the dashboard. The cost of the safe
 * direction is that a genuinely new user occasionally reaches the dashboard
 * first, where the setup checklist still guides them.
 */
export async function getOnboarding(): Promise<OnboardingState> {
  try {
    return await getOnboardingRequest();
  } catch {
    return {
      scope: "account",
      memberId: null,
      role: null,
      step: 0,
      status: "completed",
    };
  }
}
