"use server";

import { actionClient, ActionError } from "@/lib/safe-action";
import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import {
  createTestRequest,
  deleteTestRequest,
  duplicateTestRequest,
  getTestValidationRequest,
  listClassTestsRequest,
  publishTestRequest,
  saveTestDeliveryRequest,
  saveTestStructureRequest,
  unpublishTestRequest,
  updateTestRequest,
  uploadTestMediaRequest,
} from "./tests.api";
import {
  createTestSchema,
  deleteTestSchema,
  duplicateTestSchema,
  type ListTestsInput,
  publishTestSchema,
  publishTestWithDeliverySchema,
  saveTestDeliverySchema,
  saveTestStructureSchema,
  unpublishTestSchema,
  updateTestSchema,
  uploadTestMediaSchema,
} from "./tests.actions.schemas";
import type { TestsListResponse, TestValidationResponse } from "./tests.schemas";

const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";
const SAVE_ERROR = "Could not save the test. Please try again.";
const PUBLISH_ERROR = "Could not publish the test. Please fix the listed issues.";
const DELIVERY_ERROR = "Could not save the delivery rules. Please try again.";

/**
 * The backend's `status: 'DRAFT'` guard inside the save transaction doubles as
 * the concurrency check, so a 409 here means either "someone published it" or
 * "someone else saved first" — both need the same instruction: reload.
 */
const NOT_A_DRAFT =
  "This test is no longer a draft. Reload the page to see the latest version.";

function mapTestError(error: unknown, fallback: string): string {
  if (error instanceof BackendApiError) {
    if (error.status === 409) {
      return error.message || NOT_A_DRAFT;
    }
    return error.message || fallback;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }
  if (error instanceof BackendResponseValidationError) {
    console.error("Tests response validation error:", error);
    return fallback;
  }
  console.error("Tests action error:", error);
  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Reads (called from React Query hooks)                                       */
/* -------------------------------------------------------------------------- */

export async function listClassTestsAction(
  input: ListTestsInput,
): Promise<TestsListResponse> {
  return listClassTestsRequest(input.classId, {
    status: input.status,
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });
}

export async function getTestValidationAction(
  testId: string,
): Promise<TestValidationResponse> {
  return getTestValidationRequest(testId);
}

/* -------------------------------------------------------------------------- */
/* Mutations (next-safe-action boundaries)                                     */
/* -------------------------------------------------------------------------- */

export const createTestAction = actionClient
  .inputSchema(createTestSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { test } = await createTestRequest(parsedInput.classId, {
        title: parsedInput.title.trim(),
        format: parsedInput.format,
      });
      return { id: test.id, title: test.title, format: test.format };
    } catch (error) {
      throw new ActionError(
        mapTestError(error, "Could not create the test. Please try again."),
      );
    }
  });

export const saveTestStructureAction = actionClient
  .inputSchema(saveTestStructureSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { test } = await saveTestStructureRequest(parsedInput.testId, {
        sections: parsedInput.sections,
      });
      return { test };
    } catch (error) {
      throw new ActionError(mapTestError(error, SAVE_ERROR));
    }
  });

export const updateTestAction = actionClient
  .inputSchema(updateTestSchema)
  .action(async ({ parsedInput }) => {
    const { testId, ...changes } = parsedInput;

    // `PATCH` is metadata-only and every field is optional, so send just what
    // the dialog actually filled in.
    const body = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );

    try {
      const { test } = await updateTestRequest(testId, body);
      return { test };
    } catch (error) {
      throw new ActionError(mapTestError(error, SAVE_ERROR));
    }
  });

export const publishTestAction = actionClient
  .inputSchema(publishTestSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { test } = await publishTestRequest(parsedInput.testId);
      return { id: test.id, status: test.status, title: test.title };
    } catch (error) {
      throw new ActionError(mapTestError(error, PUBLISH_ERROR));
    }
  });

/**
 * True when the backend simply does not have the delivery endpoint yet, as
 * opposed to having rejected the payload.
 *
 * A 404 from `PUT /tests/:testId/delivery` is ambiguous on its face — the route
 * is missing *or* the test is. It is disambiguated by the fact that every
 * caller has just successfully read that test, so a missing test would already
 * have failed earlier in the same wizard.
 */
function isDeliveryUnsupported(error: unknown): boolean {
  return error instanceof BackendApiError && (error.status === 404 || error.status === 405);
}

export const saveTestDeliveryAction = actionClient
  .inputSchema(saveTestDeliverySchema)
  .action(async ({ parsedInput }) => {
    try {
      const { test } = await saveTestDeliveryRequest(parsedInput.testId, {
        delivery: parsedInput.delivery,
      });
      return { test, supported: true as const };
    } catch (error) {
      if (isDeliveryUnsupported(error)) {
        return { test: null, supported: false as const };
      }
      throw new ActionError(mapTestError(error, DELIVERY_ERROR));
    }
  });

/**
 * The publish wizard's single terminal action.
 *
 * Ordered so that nothing goes live under rules that failed to save: metadata
 * first (it is what the readiness check validated against), then delivery, then
 * publish. If the delivery endpoint is absent the action stops and reports
 * `deliveryUnsupported`, leaving the test a draft — the wizard then offers the
 * teacher an explicit "publish without them" which comes back with `force`.
 */
export const publishTestWithDeliveryAction = actionClient
  .inputSchema(publishTestWithDeliverySchema)
  .action(async ({ parsedInput }) => {
    const { testId, delivery, settings, force } = parsedInput;

    const body = Object.fromEntries(
      Object.entries(settings).filter(([, value]) => value !== undefined),
    );

    if (Object.keys(body).length > 0) {
      try {
        await updateTestRequest(testId, body);
      } catch (error) {
        throw new ActionError(mapTestError(error, SAVE_ERROR));
      }
    }

    let deliverySaved = false;

    try {
      await saveTestDeliveryRequest(testId, { delivery });
      deliverySaved = true;
    } catch (error) {
      if (!isDeliveryUnsupported(error)) {
        throw new ActionError(mapTestError(error, DELIVERY_ERROR));
      }
      if (!force) {
        // Not an ActionError: this is a decision for the teacher, not a failure
        // to report. The wizard renders it as a choice.
        return { published: false as const, deliveryUnsupported: true as const };
      }
    }

    try {
      const { test } = await publishTestRequest(testId);
      return {
        published: true as const,
        deliverySaved,
        id: test.id,
        title: test.title,
        status: test.status,
      };
    } catch (error) {
      throw new ActionError(mapTestError(error, PUBLISH_ERROR));
    }
  });

export const unpublishTestAction = actionClient
  .inputSchema(unpublishTestSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { success } = await unpublishTestRequest(parsedInput.testId);
      return { id: parsedInput.testId, success };
    } catch (error) {
      throw new ActionError(
        mapTestError(error, "Could not move the test back to draft."),
      );
    }
  });

export const duplicateTestAction = actionClient
  .inputSchema(duplicateTestSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { test } = await duplicateTestRequest(parsedInput.testId);
      return { id: test.id, title: test.title };
    } catch (error) {
      throw new ActionError(
        mapTestError(error, "Could not duplicate the test. Please try again."),
      );
    }
  });

export const deleteTestAction = actionClient
  .inputSchema(deleteTestSchema)
  .action(async ({ parsedInput }) => {
    try {
      await deleteTestRequest(parsedInput.testId);
      return { id: parsedInput.testId };
    } catch (error) {
      throw new ActionError(
        mapTestError(error, "Could not delete the test. Please try again."),
      );
    }
  });

export const uploadTestMediaAction = actionClient
  .inputSchema(uploadTestMediaSchema)
  .action(async ({ parsedInput }) => {
    try {
      const form = new FormData();
      form.append("image", parsedInput.image);
      const { url } = await uploadTestMediaRequest(parsedInput.testId, form);
      return { url };
    } catch (error) {
      throw new ActionError(
        mapTestError(error, "Could not upload the image. Please try again."),
      );
    }
  });
