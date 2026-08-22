import "server-only";

import type { StudentClassesResponse } from "../_lib/enrollment.schemas";
import { getStudentClassesRequest } from "../_lib/enrollment.api";

export async function getStudentSchoolClasses(
  schoolId: string,
): Promise<StudentClassesResponse | undefined> {
  try {
    return await getStudentClassesRequest(schoolId);
  } catch {
    return undefined;
  }
}
