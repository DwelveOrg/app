"use server";

import { actionClient, ActionError } from "@/lib/safe-action";
import { BackendApiError, BackendResponseValidationError } from "@/lib/api/backend";
import {
  addClassTeacherRequest,
  listAssignableStudentsRequest,
  listAssignableTeachersRequest,
  removeClassTeacherRequest,
} from "./classes.api";
import {
  addClassTeacherSchema,
  type AssignableStudentsResponse,
  type AssignableTeachersResponse,
  removeClassTeacherSchema,
} from "./classes.schemas";

/**
 * Direct roster changes on a class, and the class-scoped member pickers that
 * feed them. Student add/remove lives in `enrollment-actions.ts` because it
 * moves an enrollment row; the teacher side is a plain assignment, so it lives
 * here with the two picker reads.
 *
 * The backend is the permission boundary: the student picker is open to admins
 * and teachers assigned to the class, the teacher picker to admins only, and
 * both are scoped to one class so a teacher cannot read another class's
 * candidates.
 */

const GENERIC_ERROR = "Something went wrong. Please try again.";
const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";

/** Backend messages the roster endpoints raise, in words the user can act on. */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  "You do not have permission": "You do not have permission to manage this class.",
  "Teacher is already assigned to this class":
    "This teacher already teaches this class.",
  "Teacher assignment not found": "This teacher is no longer assigned to the class.",
  "Teacher profile not found": "This teacher is no longer part of the school.",
};

function mapRosterError(error: unknown, fallback: string): string {
  if (error instanceof BackendApiError) {
    return ERROR_MESSAGE_MAP[error.message] ?? error.message ?? fallback;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }
  if (error instanceof BackendResponseValidationError) {
    console.error("Class roster response validation error:", error);
    return fallback;
  }
  console.error("Class roster action error:", error);
  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Reads (called from React Query hooks)                                       */
/* -------------------------------------------------------------------------- */

type PickerInput = {
  classId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export async function listAssignableStudentsAction(
  input: PickerInput,
): Promise<AssignableStudentsResponse> {
  return listAssignableStudentsRequest(input.classId, {
    search: input.search?.trim() || undefined,
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });
}

export async function listAssignableTeachersAction(
  input: PickerInput,
): Promise<AssignableTeachersResponse> {
  return listAssignableTeachersRequest(input.classId, {
    search: input.search?.trim() || undefined,
    page: input.page ?? 1,
    limit: input.limit ?? 20,
  });
}

/* -------------------------------------------------------------------------- */
/* Mutations (next-safe-action boundaries)                                     */
/* -------------------------------------------------------------------------- */

export const addClassTeacherAction = actionClient
  .inputSchema(addClassTeacherSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { classTeacher } = await addClassTeacherRequest(parsedInput.classId, {
        teacherId: parsedInput.teacherId,
      });
      return { id: classTeacher.id, teacherId: parsedInput.teacherId };
    } catch (error) {
      throw new ActionError(mapRosterError(error, GENERIC_ERROR));
    }
  });

export const removeClassTeacherAction = actionClient
  .inputSchema(removeClassTeacherSchema)
  .action(async ({ parsedInput }) => {
    try {
      await removeClassTeacherRequest(parsedInput.classId, parsedInput.teacherId);
      return { teacherId: parsedInput.teacherId };
    } catch (error) {
      throw new ActionError(mapRosterError(error, GENERIC_ERROR));
    }
  });
