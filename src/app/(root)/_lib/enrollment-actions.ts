"use server";

import { actionClient, ActionError } from "@/lib/safe-action";
import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import {
  addClassStudentRequest,
  approveEnrollmentRequest,
  cancelJoinRequestRequest,
  createJoinRequestRequest,
  getStudentClassesRequest,
  getStudentOverviewRequest,
  leaveClassRequest,
  listClassJoinRequestsRequest,
  listMyEnrollmentsRequest,
  rejectEnrollmentRequest,
  removeClassStudentRequest,
} from "./enrollment.api";
import {
  approveEnrollmentSchema,
  assignStudentSchema,
  cancelJoinRequestSchema,
  leaveClassSchema,
  type ListEnrollmentsResponse,
  rejectEnrollmentSchema,
  removeStudentSchema,
  requestJoinClassSchema,
  type StudentClassesResponse,
  type StudentOverviewResponse,
} from "./enrollment.schemas";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";

/**
 * Maps known backend enrollment messages to clear, user-facing UI text
 * (see the Error Mapping table in
 * `docs/features/DWELVE_CLASS_ENROLLMENT_FRONTEND.md`). Unknown backend
 * messages pass through (NestJS already returns clean, safe strings); anything
 * that is not a backend error is masked to a generic message so we never leak
 * internal details or raw stack traces.
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  "Student is already enrolled": "You are already enrolled in this class.",
  "Join request is already pending": "Your request is already awaiting approval.",
  "Class capacity reached": "This class is currently full.",
  "Class request is not allowed": "This class requires teacher assignment.",
  "School membership is required":
    "You must join this school before requesting a class.",
  "You do not have permission": "You do not have permission to manage this class.",
};

function mapEnrollmentError(error: unknown, fallback: string): string {
  if (error instanceof BackendApiError) {
    return ERROR_MESSAGE_MAP[error.message] ?? error.message ?? fallback;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }
  if (error instanceof BackendResponseValidationError) {
    console.error("Enrollment response validation error:", error);
    return fallback;
  }
  console.error("Enrollment action error:", error);
  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Reads (called from React Query hooks)                                       */
/* -------------------------------------------------------------------------- */

export async function getStudentClassesAction(
  schoolId: string,
): Promise<StudentClassesResponse> {
  return getStudentClassesRequest(schoolId);
}

export async function getStudentOverviewAction(
  schoolId: string,
): Promise<StudentOverviewResponse> {
  return getStudentOverviewRequest(schoolId);
}

type MyRequestsInput = { page?: number; limit?: number };

export async function listMyClassRequestsAction(
  input: MyRequestsInput = {},
): Promise<ListEnrollmentsResponse> {
  return listMyEnrollmentsRequest({
    status: "PENDING",
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });
}

type ClassRequestsInput = {
  classId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function listClassJoinRequestsAction(
  input: ClassRequestsInput,
): Promise<ListEnrollmentsResponse> {
  return listClassJoinRequestsRequest(input.classId, {
    status: "PENDING",
    search: input.search?.trim() || undefined,
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });
}

/* -------------------------------------------------------------------------- */
/* Mutations (next-safe-action boundaries)                                     */
/* -------------------------------------------------------------------------- */

export const requestJoinClassAction = actionClient
  .inputSchema(requestJoinClassSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { enrollment } = await createJoinRequestRequest(parsedInput.classId, {
        message: parsedInput.message,
      });
      return { id: enrollment.id, classId: enrollment.classId, status: enrollment.status };
    } catch (error) {
      throw new ActionError(mapEnrollmentError(error, GENERIC_ERROR));
    }
  });

export const cancelJoinRequestAction = actionClient
  .inputSchema(cancelJoinRequestSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { enrollment } = await cancelJoinRequestRequest(parsedInput.classId);
      return { id: enrollment.id, classId: enrollment.classId, status: enrollment.status };
    } catch (error) {
      throw new ActionError(mapEnrollmentError(error, GENERIC_ERROR));
    }
  });

const LEAVE_CLASS_ERROR = "Could not leave the class. Please try again.";

/**
 * The backend's 404 when there is no membership left to remove. It is not a
 * failure from the user's point of view — they asked to be out of the class and
 * they are out of it — so it resolves as `alreadyLeft` instead of throwing, and
 * the caller refreshes rather than offering a retry that can only 404 again.
 */
const MEMBERSHIP_GONE_MESSAGE = "Class membership not found";

function isMembershipGone(error: unknown) {
  return (
    error instanceof BackendApiError &&
    error.status === 404 &&
    error.message === MEMBERSHIP_GONE_MESSAGE
  );
}

/**
 * The caller leaves this class themself. There is no member id in the input, so
 * this can never be aimed at another person; admins are rejected by the backend
 * and never see the control.
 */
export const leaveClassAction = actionClient
  .inputSchema(leaveClassSchema)
  .action(async ({ parsedInput }) => {
    try {
      await leaveClassRequest(parsedInput.classId);
      return { classId: parsedInput.classId, alreadyLeft: false };
    } catch (error) {
      if (isMembershipGone(error)) {
        return { classId: parsedInput.classId, alreadyLeft: true };
      }
      throw new ActionError(mapEnrollmentError(error, LEAVE_CLASS_ERROR));
    }
  });

export const approveEnrollmentAction = actionClient
  .inputSchema(approveEnrollmentSchema)
  .action(async ({ parsedInput }) => {
    try {
      await approveEnrollmentRequest(parsedInput.enrollmentId);
      return { enrollmentId: parsedInput.enrollmentId };
    } catch (error) {
      throw new ActionError(mapEnrollmentError(error, GENERIC_ERROR));
    }
  });

export const rejectEnrollmentAction = actionClient
  .inputSchema(rejectEnrollmentSchema)
  .action(async ({ parsedInput }) => {
    try {
      await rejectEnrollmentRequest(parsedInput.enrollmentId, {
        reason: parsedInput.reason,
      });
      return { enrollmentId: parsedInput.enrollmentId };
    } catch (error) {
      throw new ActionError(mapEnrollmentError(error, GENERIC_ERROR));
    }
  });

export const assignStudentAction = actionClient
  .inputSchema(assignStudentSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { enrollment } = await addClassStudentRequest(parsedInput.classId, {
        studentId: parsedInput.studentId,
      });
      return { id: enrollment.id, status: enrollment.status };
    } catch (error) {
      throw new ActionError(mapEnrollmentError(error, GENERIC_ERROR));
    }
  });

export const removeStudentAction = actionClient
  .inputSchema(removeStudentSchema)
  .action(async ({ parsedInput }) => {
    try {
      await removeClassStudentRequest(parsedInput.classId, parsedInput.studentId);
      return { studentId: parsedInput.studentId };
    } catch (error) {
      throw new ActionError(mapEnrollmentError(error, GENERIC_ERROR));
    }
  });
