import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import type { ClassActivityResponse } from "../_lib/class-activity.schemas";
import { listClassActivityRequest } from "../_lib/classes.api";

export async function getClassActivity(
  classId: string,
  limit = 12,
): Promise<ClassActivityResponse | undefined> {
  try {
    return await listClassActivityRequest(classId, { limit }, authedBackendJson);
  } catch (error) {
    console.error("Failed to load class activity:", error);
    return undefined;
  }
}
