import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { decrypt } from "@/app/(authentication)/_lib/session";
import { SESSION_COOKIE_NAME } from "@/app/(authentication)/_constants/session";
import type { AuthUser } from "@/app/(authentication)/_types/auth";
import { getSchool } from "./getSchool";

export type SessionUser = AuthUser;

/**
 * Request-cached: the layout and the page both call this on every navigation,
 * and only the first pays for the cookie decrypt (the backend hydration below
 * was already deduped through the request-cached getSchool).
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    const session = await decrypt(cookie);

    if (!session?.userId) {
      return null;
    }

    const decoded = {
      id: String(session.userId),
      email: session.email,
      fullName: session.fullName,
      schoolId: session.schoolId,
      memberId: session.memberId,
      schoolRole: session.schoolRole,
      membershipCount: session.membershipCount ?? 0,
    };

    // Role changes take effect in PostgreSQL immediately, while the encrypted
    // browser session can retain the old role until its next token rotation.
    // Hydrate the selected membership from the backend so a promoted or
    // demoted person gets the correct navigation and page gates on their next
    // render, without logging out. getSchool is request-cached, so pages that
    // also need the school detail do not pay for a second request.
    if (!decoded.schoolId) return decoded;

    const detail = await getSchool(decoded.schoolId);
    return detail
      ? {
          ...decoded,
          memberId: detail.membership.id,
          schoolRole: detail.currentUserRole,
        }
      : decoded;
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to read the current user session.");
    }

    return null;
  }
});
