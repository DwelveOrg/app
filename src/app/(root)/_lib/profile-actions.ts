"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { actionClient, ActionError } from "@/lib/safe-action";
import { authedBackendJson } from "@/app/(authentication)/_lib/backend";
import {
  BackendApiError,
  BackendResponseValidationError,
} from "@/app/(authentication)/_lib/api";
import {
  createSession,
  deleteSession,
  getSession,
} from "@/app/(authentication)/_lib/session";
import {
  changePasswordRequest,
  deleteAccountRequest,
  getProfileSessionsRequest,
  revokeProfileSessionRequest,
  updateAvatarRequest,
  updateProfileRequest,
  updateSchoolProfileRequest,
} from "./profile.api";
import {
  changePasswordSchema,
  revokeSessionSchema,
  setPasswordSchema,
  updateFullNameSchema,
  updateSchoolProfileSchema,
} from "./profile.schemas.forms";
import type {
  ProfileResponse,
  ProfileSession,
} from "./profile.schemas";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const INVALID_NAME_ERROR = "Please enter a valid name.";
const INVALID_PROFILE_ERROR = "Please check the profile details and try again.";
const INVALID_AVATAR_ERROR = "Could not update your avatar. Please try again.";
const INVALID_PASSWORD_ERROR = "Could not change your password. Please try again.";
const REVOKE_SESSION_ERROR = "Could not revoke that session. Please try again.";
const DELETE_ACCOUNT_ERROR = "Could not delete your account. Please try again.";
const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";

function getActionError(error: unknown, fallback: string) {
  if (error instanceof BackendApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }
  if (error instanceof BackendResponseValidationError) {
    console.error("Profile response validation error:", error);
    return fallback;
  }
  console.error("Profile action error:", error);
  return fallback;
}

/**
 * Session identity (fullName, schoolId, etc.) is duplicated inside the encrypted
 * cookie. After any mutation whose response includes a fresh account/membership
 * shape, refresh the cookie so the top bar, greetings and role gates re-render
 * with the new values without waiting for the next login.
 */
async function syncSessionFromProfile(profile: ProfileResponse) {
  const session = await getSession();
  if (!session?.userId) return;

  const selected = profile.selectedSchool;
  await createSession({
    userId: session.userId,
    email: profile.account.email ?? session.email,
    fullName: profile.account.fullName ?? session.fullName,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    schoolId: selected?.school.id ?? session.schoolId,
    memberId: selected?.member.id ?? session.memberId,
    schoolRole: selected?.member.role ?? session.schoolRole,
    membershipCount: profile.memberships.length || session.membershipCount || 0,
  });
}

export const updateFullNameAction = actionClient
  .inputSchema(updateFullNameSchema)
  .action(async ({ parsedInput }) => {
    try {
      const profile = await updateProfileRequest(
        { fullName: parsedInput.fullName.trim() },
        authedBackendJson,
      );
      await syncSessionFromProfile(profile);
      revalidatePath("/profile");
      return { account: profile.account };
    } catch (error) {
      throw new ActionError(getActionError(error, INVALID_NAME_ERROR));
    }
  });

export const updateSchoolProfileAction = actionClient
  .inputSchema(updateSchoolProfileSchema)
  .action(async ({ parsedInput }) => {
    // Empty string means "clear the value" for the backend; omit undefined keys.
    const body: { phone?: string | null; bio?: string | null } = {};
    if (parsedInput.phone !== undefined) {
      body.phone = parsedInput.phone.trim() ? parsedInput.phone.trim() : null;
    }
    if (parsedInput.bio !== undefined) {
      body.bio = parsedInput.bio.trim() ? parsedInput.bio.trim() : null;
    }

    if (Object.keys(body).length === 0) {
      throw new ActionError(INVALID_PROFILE_ERROR);
    }

    try {
      const profile = await updateSchoolProfileRequest(body, authedBackendJson);
      await syncSessionFromProfile(profile);
      revalidatePath("/profile");
      return { selectedSchool: profile.selectedSchool };
    } catch (error) {
      throw new ActionError(getActionError(error, INVALID_PROFILE_ERROR));
    }
  });

/**
 * A password setup/change rotates refresh tokens — write the new pair straight
 * into the session so subsequent requests use it instead of the revoked one.
 * Identity fields are preserved from the current cookie.
 */
async function writeRotatedTokens(tokens: { accessToken: string; refreshToken: string }) {
  const session = await getSession();
  if (!session?.userId) return;

  await createSession({
    userId: session.userId,
    email: session.email,
    fullName: session.fullName,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    schoolId: session.schoolId,
    memberId: session.memberId,
    schoolRole: session.schoolRole,
    membershipCount: session.membershipCount ?? 0,
  });
}

export const changePasswordAction = actionClient
  .inputSchema(changePasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      const response = await changePasswordRequest(
        {
          currentPassword: parsedInput.currentPassword,
          newPassword: parsedInput.newPassword,
        },
        authedBackendJson,
      );

      await writeRotatedTokens(response.tokens);
      revalidatePath("/profile");

      return { success: response.success };
    } catch (error) {
      throw new ActionError(getActionError(error, INVALID_PASSWORD_ERROR));
    }
  });

/**
 * First-time password setup for accounts without a password (e.g. Google-only
 * users). Sends only `newPassword`; the backend accepts this when
 * `authMethods.password === false`. Revalidates `/profile` so the panel flips
 * from "Set password" to "Change password" once a password exists.
 */
export const setPasswordAction = actionClient
  .inputSchema(setPasswordSchema)
  .action(async ({ parsedInput }) => {
    try {
      const response = await changePasswordRequest(
        { newPassword: parsedInput.newPassword },
        authedBackendJson,
      );

      await writeRotatedTokens(response.tokens);
      revalidatePath("/profile");

      return { success: response.success };
    } catch (error) {
      throw new ActionError(getActionError(error, INVALID_PASSWORD_ERROR));
    }
  });

export const revokeSessionAction = actionClient
  .inputSchema(revokeSessionSchema)
  .action(async ({ parsedInput }) => {
    let revokedCurrent = false;

    try {
      const response = await revokeProfileSessionRequest(
        parsedInput.sessionId,
        authedBackendJson,
      );
      revokedCurrent = Boolean(response.revokedCurrent);
    } catch (error) {
      throw new ActionError(getActionError(error, REVOKE_SESSION_ERROR));
    }

    if (revokedCurrent) {
      // The current device's refresh session was killed — drop the local cookie
      // and send the user to login. The redirect must run outside the try/catch
      // so Next.js can handle its internal NEXT_REDIRECT throw.
      await deleteSession();
    } else {
      revalidatePath("/profile");
    }

    if (revokedCurrent) {
      redirect("/login?logout=1");
    }

    return { revokedCurrent };
  });

/**
 * Plain server action (not next-safe-action) because it accepts a multipart
 * `FormData` payload. The client posts a `File` under `avatar` or a
 * `removeAvatar=true` flag — never both.
 */
export async function updateAvatarAction(
  formData: FormData,
): Promise<{ error?: string; avatarUrl?: string | null }> {
  const avatar = formData.get("avatar");
  const removeAvatar = formData.get("removeAvatar");

  const hasFile = avatar instanceof File && avatar.size > 0;
  const wantsRemove = typeof removeAvatar === "string" && removeAvatar === "true";

  if (!hasFile && !wantsRemove) {
    return { error: INVALID_AVATAR_ERROR };
  }
  if (hasFile && wantsRemove) {
    return { error: INVALID_AVATAR_ERROR };
  }

  const forwarded = new FormData();
  if (hasFile) {
    forwarded.set("avatar", avatar);
  } else {
    forwarded.set("removeAvatar", "true");
  }

  try {
    const profile = await updateAvatarRequest(forwarded, authedBackendJson);
    await syncSessionFromProfile(profile);
    revalidatePath("/profile");
    return { avatarUrl: profile.account.avatarUrl ?? null };
  } catch (error) {
    return { error: getActionError(error, INVALID_AVATAR_ERROR) };
  }
}

/**
 * Permanently deletes the current account, clears this device's encrypted
 * session cookie, then routes to login. The backend also revokes every refresh
 * session so other signed-in devices lose access immediately.
 */
export async function deleteAccountAction(): Promise<{ error?: string }> {
  try {
    await deleteAccountRequest(authedBackendJson);
  } catch (error) {
    return { error: getActionError(error, DELETE_ACCOUNT_ERROR) };
  }

  await deleteSession();
  redirect("/login?deleted=1");
}

/**
 * Server action that returns the profile sessions list. Client uses this
 * instead of hitting the backend directly. Fails soft — returns an empty list
 * so the panel renders a graceful empty state.
 */
export async function listProfileSessionsAction(): Promise<{
  sessions: ProfileSession[];
  error?: string;
}> {
  try {
    const response = await getProfileSessionsRequest(authedBackendJson);
    return { sessions: response.sessions };
  } catch (error) {
    // Non-user-triggered fetch; never surface raw backend paths/messages here.
    if (!(error instanceof BackendApiError) && !(error instanceof TypeError)) {
      console.error("Profile sessions action error:", error);
    }
    return { sessions: [], error: GENERIC_ERROR };
  }
}
