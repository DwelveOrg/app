import "server-only";

import type { AuthResponse } from "./api";
import { createSession, type SessionProfile } from "./session";

export function authResponseSessionProfile(response: AuthResponse): SessionProfile {
  return {
    userId: response.user.id,
    email: response.user.email,
    fullName: response.user.fullName,
    accessToken: response.tokens.accessToken,
    refreshToken: response.tokens.refreshToken,
    schoolId: response.member?.schoolId ?? response.school?.id,
    memberId: response.member?.id,
    schoolRole: response.member?.role,
    membershipCount: response.memberships?.length ?? (response.member ? 1 : 0),
  };
}

export async function createSessionFromAuthResponse(response: AuthResponse) {
  await createSession(authResponseSessionProfile(response));
}
