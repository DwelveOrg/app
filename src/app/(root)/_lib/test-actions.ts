"use server";

import { z } from "zod";

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
  validateTestCandidateRequest,
} from "./tests.api";
import {
  createTestSchema,
  deleteTestSchema,
  duplicateTestSchema,
  type ListTestsInput,
  type TestPublishCandidateInput,
  publishTestSchema,
  publishTestWithDeliverySchema,
  saveTestDeliverySchema,
  saveTestStructureSchema,
  unpublishTestSchema,
  updateTestSchema,
  uploadTestMediaSchema,
} from "./tests.actions.schemas";
import {
  testValidationIssueSchema,
  type TestsListResponse,
  type TestValidationIssue,
  type TestValidationResponse,
} from "./tests.schemas";

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
  input: { testId: string; candidate?: TestPublishCandidateInput },
): Promise<TestValidationResponse> {
  return input.candidate
    ? validateTestCandidateRequest(input.testId, input.candidate)
    : getTestValidationRequest(input.testId);
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

export const saveTestDeliveryAction = actionClient
  .inputSchema(saveTestDeliverySchema)
  .action(async ({ parsedInput }) => {
    try {
      const { test } = await saveTestDeliveryRequest(parsedInput.testId, {
        delivery: parsedInput.delivery,
      });
      return { test };
    } catch (error) {
      throw new ActionError(mapTestError(error, DELIVERY_ERROR));
    }
  });

/**
 * A rejected publish, with the reasons attached.
 *
 * `POST /tests/:testId/publish` answers 409 with `{ message, issues }` when the
 * test does not pass `validateTestForPublish`. Those issues are the whole point
 * of the response — they are what the teacher has to act on — and an
 * `ActionError` can only carry a string, so the message alone used to reach the
 * screen and the list was dropped on the floor. A teacher saw "Test is not
 * ready to publish" and nothing else.
 */
function publishRejectionIssues(error: unknown): TestValidationIssue[] | null {
  if (!(error instanceof BackendApiError) || error.status !== 409) return null;

  const parsed = z
    .object({ issues: z.array(testValidationIssueSchema).min(1) })
    .safeParse(error.body);

  return parsed.success ? parsed.data.issues : null;
}

/**
 * The publish screen's single terminal action.
 *
 * The backend applies the candidate and publishes it in one transaction. A
 * rejected validation therefore leaves the persisted draft untouched.
 */
export const publishTestWithDeliveryAction = actionClient
  .inputSchema(publishTestWithDeliverySchema)
  .action(async ({ parsedInput }) => {
    const { testId, delivery, settings } = parsedInput;

    try {
      const { test } = await publishTestRequest(testId, { delivery, settings });
      return {
        published: true as const,
        id: test.id,
        title: test.title,
        status: test.status,
      };
    } catch (error) {
      const issues = publishRejectionIssues(error);
      if (issues) {
        // Not an ActionError: the server answered a question the screen asked,
        // and the answer belongs in the readiness banner, not in a toast.
        return { published: false as const, issues };
      }
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
