import "server-only";

import { cache } from "react";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  getSchoolRequest,
  type SchoolDetailResponse,
} from "@/app/(authentication)/_lib/api";

/**
 * Fetches the current school (per doc §"Dashboard After Creation":
 * `GET /api/v1/schools/:schoolId`). Fails soft — returns null on any error so the
 * dashboard can fall back to its placeholder instead of throwing.
 */
export const getSchool = cache(async function getSchool(
  schoolId: string,
): Promise<SchoolDetailResponse | null> {
  try {
    return await getSchoolRequest(schoolId, authedBackendJson);
  } catch {
    return null;
  }
});
