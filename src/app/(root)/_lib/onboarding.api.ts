import "server-only";

import type { z } from "zod";

import type { BackendRequestInit } from "@/lib/api/backend";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  onboardingStateSchema,
  type OnboardingStatus,
} from "./onboarding.schemas";

/**
 * Named endpoint functions for `/profile/onboarding`, following the same
 * pattern as the other API modules: everything goes through
 * `authedBackendJson` and validates with a Zod schema.
 */

type BackendRequester = <TSchema extends z.ZodTypeAny>(
  path: string,
  init: BackendRequestInit<TSchema>,
) => Promise<z.infer<TSchema>>;

/** `GET /profile/onboarding` - current onboarding scope, step, and status. */
export function getOnboardingRequest(
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/profile/onboarding", {
    responseSchema: onboardingStateSchema,
    cache: "no-store",
  });
}

/** `PATCH /profile/onboarding` - records progress, completion, or a skip. */
export function updateOnboardingRequest(
  body: { status: OnboardingStatus; step?: number },
  requestJson: BackendRequester = authedBackendJson,
) {
  return requestJson("/profile/onboarding", {
    method: "PATCH",
    body,
    responseSchema: onboardingStateSchema,
  });
}
