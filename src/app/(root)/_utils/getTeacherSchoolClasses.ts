import "server-only";

import type { TeacherClassesResponse } from "../_lib/teacher-requests.schemas";
import { getTeacherClassesRequest } from "../_lib/teacher-requests.api";

export async function getTeacherSchoolClasses(
  schoolId: string,
): Promise<TeacherClassesResponse | undefined> {
  try {
    return await getTeacherClassesRequest(schoolId);
  } catch {
    return undefined;
  }
}
