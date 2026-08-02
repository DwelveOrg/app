"use server";

import { actionClient, ActionError } from "@/lib/safe-action";
import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import {
  approveTeacherJoinRequest,
  cancelTeacherJoinRequest,
  createTeacherJoinRequest,
  getTeacherClassesRequest,
  listTeacherJoinRequests,
  rejectTeacherJoinRequest,
} from "./teacher-requests.api";
import {
  approveTeacherRequestSchema,
  cancelTeacherRequestSchema,
  type ListTeacherRequestsResponse,
  rejectTeacherRequestSchema,
  requestToTeachSchema,
  type TeacherClassesResponse,
} from "./teacher-requests.schemas";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";

/**
 * Maps known backend teacher-request messages to clear, user-facing UI text.
 * Unknown backend messages pass through (NestJS already returns clean strings);
 * anything that is not a backend error is masked to a generic message so we
 * never leak internal details or raw stack traces.
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  "Teacher is already assigned to this class":
    "You are already assigned to teach this class.",
  "Teacher join request is already pending":
    "Your request is already awaiting approval.",
  "Pending teacher join request not found":
    "There is no pending request to cancel.",
  "Teacher request is not pending": "This request has already been reviewed.",
  "Teacher request is no longer pending": "This request has already been reviewed.",
  "You do not have permission": "You do not have permission to manage this class.",
};

function mapTeacherRequestError(error: unknown, fallback: string): string {
  if (error instanceof BackendApiError) {
    return ERROR_MESSAGE_MAP[error.message] ?? error.message ?? fallback;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }
  if (error instanceof BackendResponseValidationError) {
    console.error("Teacher-request response validation error:", error);
    return fallback;
  }
  console.error("Teacher-request action error:", error);
  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Reads (called from React Query hooks)                                       */
/* -------------------------------------------------------------------------- */

export async function getTeacherClassesAction(
  schoolId: string,
): Promise<TeacherClassesResponse> {
  return getTeacherClassesRequest(schoolId);
}

type TeacherRequestsInput = {
  classId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function listTeacherRequestsAction(
  input: TeacherRequestsInput,
): Promise<ListTeacherRequestsResponse> {
  return listTeacherJoinRequests(input.classId, {
    status: "PENDING",
    search: input.search?.trim() || undefined,
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });
}

/* -------------------------------------------------------------------------- */
/* Mutations (next-safe-action boundaries)                                     */
/* -------------------------------------------------------------------------- */

export const requestToTeachAction = actionClient
  .inputSchema(requestToTeachSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { request } = await createTeacherJoinRequest(parsedInput.classId, {
        message: parsedInput.message,
      });
      return { id: request.id, classId: request.classId, status: request.status };
    } catch (error) {
      throw new ActionError(mapTeacherRequestError(error, GENERIC_ERROR));
    }
  });

export const cancelTeacherRequestAction = actionClient
  .inputSchema(cancelTeacherRequestSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { request } = await cancelTeacherJoinRequest(parsedInput.classId);
      return { id: request.id, classId: request.classId, status: request.status };
    } catch (error) {
      throw new ActionError(mapTeacherRequestError(error, GENERIC_ERROR));
    }
  });

export const approveTeacherRequestAction = actionClient
  .inputSchema(approveTeacherRequestSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { request } = await approveTeacherJoinRequest(parsedInput.requestId);
      return { requestId: request.id, status: request.status };
    } catch (error) {
      throw new ActionError(mapTeacherRequestError(error, GENERIC_ERROR));
    }
  });

export const rejectTeacherRequestAction = actionClient
  .inputSchema(rejectTeacherRequestSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { request } = await rejectTeacherJoinRequest(parsedInput.requestId, {
        reason: parsedInput.reason,
      });
      return { requestId: request.id, status: request.status };
    } catch (error) {
      throw new ActionError(mapTeacherRequestError(error, GENERIC_ERROR));
    }
  });
