"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { actionClient, ActionError } from "@/lib/safe-action";
import {
  acceptTeacherInviteSchema,
  createSchoolSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  joinSchoolSchema,
  loginSchema,
  regularSignupSchema,
  resetPasswordSchema,
  type AcceptTeacherInviteInput,
  type CreateSchoolFormField,
  type ForgotPasswordFormField,
  type JoinSchoolFormField,
  type LoginFormField,
  type RegularSignupFormField,
  type ResetPasswordInput,
} from "@/app/(authentication)/_types/_schemas";
import {
  acceptTeacherInviteRequest,
  BackendApiError,
  BackendResponseValidationError,
  createSchoolRequest,
  forgotPasswordRequest,
  googleAuthRequest,
  joinSchoolRequest,
  loginRequest,
  logoutAllRequest,
  logoutRequest,
  resetPasswordRequest,
  signupRequest,
  type AcceptTeacherInviteResponse,
  type AuthResponse,
  type CreateSchoolResponse,
} from "./api";
import { authedBackendJson } from "./backend";
import { createSession, deleteSession, getSession } from "./session";

const INVALID_LOGIN_ERROR = "Invalid email or password.";
const INVALID_SIGNUP_ERROR = "Please check the form and try again.";
const INVALID_SCHOOL_ERROR = "Please check the school details and try again.";
const INVALID_JOIN_ERROR = "Invalid join code. Please check and try again.";
const INVALID_INVITE_ERROR = "This invite link is invalid or has expired.";
const FORGOT_PASSWORD_ERROR = "Unable to send the reset link. Please try again.";
const INVALID_RESET_TOKEN_ERROR = "This reset link is invalid or has expired.";
const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";
const RATE_LIMITED_ERROR = "Too many attempts. Please wait a moment and try again.";

export type AuthMutationResult = {
  redirectTo: string;
  userId?: string;
  onboardingRequired?: boolean;
};

export type ForgotPasswordResult = {
  /** Always true — the response never reveals whether the account exists. */
  ok: true;
  /** Dev-only reset link, present only when the backend debug flag is enabled. */
  resetUrl?: string;
};

/**
 * Maps an unknown thrown error to a safe, user-facing message. Only
 * {@link BackendApiError} messages (which the backend intends to be shown) and a
 * couple of known network cases are surfaced; anything else is logged and
 * collapsed to `fallback` so internal error details never reach the client.
 */
function getActionError(error: unknown, fallback: string) {
  if (error instanceof BackendApiError) {
    // The backend now rate-limits sensitive auth/onboarding routes with Redis and
    // returns 429. Surface a calm, intentional message instead of the raw
    // "Too many attempts" so the limit reads as a deliberate safeguard.
    if (error.status === 429) {
      return RATE_LIMITED_ERROR;
    }

    return error.message;
  }

  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }

  if (error instanceof BackendResponseValidationError) {
    console.error("Backend response validation error:", error);
    return fallback;
  }

  console.error("Auth action error:", error);
  return fallback;
}

async function createSessionFromAuthResponse(response: AuthResponse) {
  await createSession({
    userId: response.user.id,
    email: response.user.email,
    fullName: response.user.fullName,
    accessToken: response.tokens.accessToken,
    refreshToken: response.tokens.refreshToken,
    schoolId: response.member?.schoolId ?? response.school?.id,
    memberId: response.member?.id,
    schoolRole: response.member?.role,
    membershipCount: response.memberships?.length ?? (response.member ? 1 : 0),
  });
}

async function createSessionFromSchoolResponse(response: CreateSchoolResponse) {
  const session = await getSession();
  const membership = response.membership ?? response.member;

  if (!session?.userId || !session.email || !session.fullName || !membership) {
    throw new BackendApiError("Your session expired. Please log in again.");
  }

  await createSession({
    userId: session.userId,
    email: session.email,
    fullName: session.fullName,
    accessToken: response.tokens.accessToken,
    refreshToken: response.tokens.refreshToken,
    schoolId: membership.schoolId,
    memberId: membership.id,
    schoolRole: membership.role,
    membershipCount: Math.max(session.membershipCount ?? 0, 1),
  });
}

/**
 * The browser's identity, forwarded on session-creating calls so the backend
 * records the device, not this server. The user agent labels the session in
 * the profile's "Active sessions"; X-Forwarded-For carries the client address
 * when one was forwarded to us (behind a proxy in production).
 */
async function clientContextHeaders(): Promise<HeadersInit | undefined> {
  const incoming = await headers();
  const forwarded: Record<string, string> = {};

  const userAgent = incoming.get("user-agent");
  if (userAgent) forwarded["User-Agent"] = userAgent;

  const forwardedFor = incoming.get("x-forwarded-for");
  if (forwardedFor) forwarded["X-Forwarded-For"] = forwardedFor;

  return Object.keys(forwarded).length > 0 ? forwarded : undefined;
}

async function loginWithInput(input: LoginFormField): Promise<AuthMutationResult> {
  try {
    const response = await loginRequest(input, await clientContextHeaders());

    await createSessionFromAuthResponse(response);

    return {
      redirectTo: response.isNewUser ? "/onboarding" : "/dashboard",
      userId: response.user.id,
      onboardingRequired: response.isNewUser,
    };
  } catch (error) {
    throw new ActionError(getActionError(error, INVALID_LOGIN_ERROR));
  }
}

async function signupWithInput(input: RegularSignupFormField): Promise<AuthMutationResult> {
  try {
    const response = await signupRequest(input, await clientContextHeaders());

    await createSessionFromAuthResponse(response);

    return {
      redirectTo: "/onboarding",
      userId: response.user.id,
      onboardingRequired: true,
    };
  } catch (error) {
    throw new ActionError(getActionError(error, INVALID_SIGNUP_ERROR));
  }
}

async function createSchoolWithInput(input: CreateSchoolFormField) {
  try {
    const form = new FormData();
    form.append("name", input.name.trim());
    for (const key of ["description", "country", "city"] as const) {
      const value = input[key]?.trim();
      if (value) {
        form.append(key, value);
      }
    }
    if (input.logo) {
      form.append("logo", input.logo);
    }

    const response = await createSchoolRequest(form, authedBackendJson);

    await createSessionFromSchoolResponse(response);

    return { schoolId: response.school.id };
  } catch (error) {
    throw new ActionError(getActionError(error, INVALID_SCHOOL_ERROR));
  }
}

async function joinSchoolWithInput(input: JoinSchoolFormField) {
  try {
    const response = await joinSchoolRequest(input, authedBackendJson);

    const session = await getSession();

    if (!session?.userId || !session.email || !session.fullName) {
      throw new BackendApiError("Your session expired. Please log in again.");
    }

    await createSession({
      userId: session.userId,
      email: session.email,
      fullName: session.fullName,
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
      schoolId: response.membership.schoolId,
      memberId: response.membership.id,
      schoolRole: response.membership.role,
      membershipCount: Math.max(session.membershipCount ?? 0, 1),
    });

    return { schoolId: response.school.id };
  } catch (error) {
    throw new ActionError(getActionError(error, INVALID_JOIN_ERROR));
  }
}

async function acceptTeacherInviteWithInput(
  input: AcceptTeacherInviteInput,
): Promise<AuthMutationResult> {
  try {
    const response: AcceptTeacherInviteResponse = await acceptTeacherInviteRequest(
      input.token,
      authedBackendJson,
    );

    const session = await getSession();

    if (!session?.userId || !session.email || !session.fullName) {
      throw new BackendApiError("Your session expired. Please log in again.");
    }

    // Accepting an invite grants a new TEACHER membership and fresh tokens that
    // carry the school context; rewrite the session so the dashboard opens it.
    await createSession({
      userId: session.userId,
      email: session.email,
      fullName: session.fullName,
      accessToken: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
      schoolId: response.membership.schoolId,
      memberId: response.membership.id,
      schoolRole: response.membership.role,
      membershipCount: Math.max(session.membershipCount ?? 0, 1),
    });

    return {
      redirectTo: "/onboarding",
      userId: session.userId,
      onboardingRequired: true,
    };
  } catch (error) {
    throw new ActionError(getActionError(error, INVALID_INVITE_ERROR));
  }
}

async function googleAuthWithToken(idToken: string): Promise<AuthMutationResult> {
  try {
    const response = await googleAuthRequest(idToken, await clientContextHeaders());

    await createSessionFromAuthResponse(response);
    return {
      redirectTo: response.isNewUser ? "/onboarding" : "/dashboard",
      userId: response.user.id,
      onboardingRequired: response.isNewUser,
    };
  } catch (error) {
    throw new ActionError(getActionError(error, "Google sign-in failed. Please try again."));
  }
}

async function forgotPasswordWithInput(
  input: ForgotPasswordFormField,
): Promise<ForgotPasswordResult> {
  try {
    const response = await forgotPasswordRequest(input);

    // Never disclose whether an account exists; the UI shows the same message
    // regardless. `resetUrl` is only ever present in local dev debug mode.
    return { ok: true, resetUrl: response.resetUrl };
  } catch (error) {
    // Rate limiting and network failures are safe to surface (they don't reveal
    // account existence); everything else collapses to a generic message.
    throw new ActionError(getActionError(error, FORGOT_PASSWORD_ERROR));
  }
}

async function resetPasswordWithInput(
  input: ResetPasswordInput,
): Promise<AuthMutationResult> {
  try {
    await resetPasswordRequest(input);

    // The password changed: drop any local session and return the user to login.
    await deleteSession();

    return { redirectTo: "/login" };
  } catch (error) {
    throw new ActionError(getActionError(error, INVALID_RESET_TOKEN_ERROR));
  }
}

export const googleAuthAction = actionClient
  .inputSchema(googleAuthSchema)
  .action(async ({ parsedInput }) => googleAuthWithToken(parsedInput.idToken));

export const forgotPasswordAction = actionClient
  .inputSchema(forgotPasswordSchema)
  .action(async ({ parsedInput }) => forgotPasswordWithInput(parsedInput));

export const resetPasswordAction = actionClient
  .inputSchema(resetPasswordSchema)
  .action(async ({ parsedInput }) => resetPasswordWithInput(parsedInput));

export const loginAction = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput }) => loginWithInput(parsedInput));

export const signupAction = actionClient
  .inputSchema(regularSignupSchema)
  .action(async ({ parsedInput }) => signupWithInput(parsedInput));

export const createSchoolAction = actionClient
  .inputSchema(createSchoolSchema)
  .action(async ({ parsedInput }) => createSchoolWithInput(parsedInput));

export const joinSchoolAction = actionClient
  .inputSchema(joinSchoolSchema)
  .action(async ({ parsedInput }) => joinSchoolWithInput(parsedInput));

export const acceptTeacherInviteAction = actionClient
  .inputSchema(acceptTeacherInviteSchema)
  .action(async ({ parsedInput }) => acceptTeacherInviteWithInput(parsedInput));

export async function logout() {
  const session = await getSession();

  if (session?.refreshToken) {
    await logoutRequest(session.refreshToken).catch(() => undefined);
  }

  await deleteSession();
  redirect("/login?logout=1");
}

/**
 * Signs the user out of every device by deleting all of their Redis refresh
 * sessions, then clears the local session and returns to login. The backend
 * call is best-effort: even if it fails we still drop this device's session.
 */
export async function logoutAll() {
  const session = await getSession();

  if (session?.accessToken) {
    await logoutAllRequest(authedBackendJson).catch(() => undefined);
  }

  await deleteSession();
  redirect("/login?logout=all");
}
