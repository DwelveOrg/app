import "server-only";

import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  listSchoolBlocklistRequest,
  listTeacherInvitesRequest,
  type SchoolBlocklistResponse,
  type TeacherInviteListResponse,
} from "@/app/(authentication)/_lib/api";

/**
 * The two admin-only lists behind the school's Access controls: who is barred,
 * and which teacher invites are still outstanding.
 *
 * Both return `null` rather than throwing, matching `getSchoolMembers`: a
 * school page whose roster loaded should still render when one side panel's
 * request failed, and the panel says so itself.
 */
export async function getSchoolBlocklist(
  schoolId: string,
): Promise<SchoolBlocklistResponse | null> {
  try {
    return await listSchoolBlocklistRequest(schoolId, authedBackendJson);
  } catch {
    return null;
  }
}

export async function getTeacherInvites(
  schoolId: string,
): Promise<TeacherInviteListResponse | null> {
  try {
    return await listTeacherInvitesRequest(schoolId, authedBackendJson);
  } catch {
    return null;
  }
}
