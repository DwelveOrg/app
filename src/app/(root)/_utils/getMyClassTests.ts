import "server-only";

import { listMyTestsRequest } from "@/app/exam/_lib/attempts.api";
import type { StudentTestRow } from "@/app/exam/_lib/attempts.schemas";

/**
 * The signed-in student's tests for one class.
 *
 * `GET /me/tests` returns every class the student is in and carries `classId`
 * on each row, so the class filter happens here rather than as a query
 * parameter the backend does not accept. A student is in a handful of classes
 * with a term's worth of papers between them, so one page covers it; the class
 * page is a summary and links out to Assignments for the whole list.
 *
 * Fails soft to an empty list. The tests section is one part of a class page —
 * a backend hiccup there should cost the student that section, not the roster,
 * the teacher's name, and the way out of the class.
 */
export async function getMyClassTests(
  classId: string,
  limit = 100,
): Promise<StudentTestRow[]> {
  try {
    const { tests } = await listMyTestsRequest({ page: 1, limit });
    return tests.filter((test) => test.classId === classId);
  } catch (error) {
    console.error("Failed to load the student's tests for a class:", error);
    return [];
  }
}
