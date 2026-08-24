"use server";

import {
  getSchoolMembersRequest,
  listSchoolBlocklistRequest,
  listTeacherInvitesRequest,
} from "@/app/(authentication)/_lib/api";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import { getStudentsRequest } from "./students.api";

/**
 * Intent-driven reads for the School page's management dialogs.
 *
 * The school id is UI input, not an authority claim. Every request still
 * carries the encrypted session's bearer token, and the backend re-checks the
 * active membership, selected school, and ADMIN role before returning data.
 */
export async function getSchoolMembersAction(schoolId: string) {
  return await getSchoolMembersRequest(schoolId, authedBackendJson);
}

export async function getSchoolStudentsAction() {
  return await getStudentsRequest(authedBackendJson);
}

export async function getTeacherInvitesAction(schoolId: string) {
  return await listTeacherInvitesRequest(schoolId, authedBackendJson);
}

export async function getSchoolBlocklistAction(schoolId: string) {
  return await listSchoolBlocklistRequest(schoolId, authedBackendJson);
}
