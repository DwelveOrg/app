import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { getTestFormatsRequest } from "../_lib/tests.api";
import type { TestFormatsResponse } from "../_lib/tests.schemas";

/**
 * Fetches the format blueprints and the question-type catalogue
 * (`GET /tests/formats`).
 *
 * This is the single source of truth for what a format allows and what the
 * tabbed picker offers. It is loaded server-side and passed down as props so
 * the frontend never keeps a second copy to drift from. Fails soft: an empty
 * catalogue renders an explanatory state instead of crashing the builder.
 */
export async function getTestFormats(): Promise<TestFormatsResponse | null> {
  try {
    return await getTestFormatsRequest(authedBackendJson);
  } catch (error) {
    console.error("Failed to load the test format catalogue:", error);
    return null;
  }
}
