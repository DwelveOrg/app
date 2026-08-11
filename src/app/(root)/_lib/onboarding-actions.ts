"use server";

import { z } from "zod";

import { actionClient, ActionError } from "@/lib/safe-action";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  BackendApiError,
  BackendResponseValidationError,
} from "@/lib/api/backend";
import { updateOnboardingRequest } from "./onboarding.api";
import { onboardingStatusSchema } from "./onboarding.schemas";

const SAVE_ERROR = "Could not save your progress. Please try again.";
const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";

const updateOnboardingSchema = z.object({
  status: onboardingStatusSchema,
  step: z.number().int().min(0).max(20).optional(),
});

function getActionError(error: unknown) {
  if (error instanceof BackendApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }
  if (error instanceof BackendResponseValidationError) {
    console.error("Backend response validation error:", error);
    return SAVE_ERROR;
  }
  console.error("Onboarding action error:", error);
  return SAVE_ERROR;
}

/**
 * Persists onboarding progress. The wizard calls this on every step change so
 * that closing the tab and coming back — on any device — resumes in place.
 */
export const updateOnboardingAction = actionClient
  .inputSchema(updateOnboardingSchema)
  .action(async ({ parsedInput }) => {
    try {
      return await updateOnboardingRequest(parsedInput, authedBackendJson);
    } catch (error) {
      throw new ActionError(getActionError(error));
    }
  });
