export type OnboardingStatus = "in_progress" | "completed" | "skipped";

export type OnboardingState = {
  version: 1;
  status: OnboardingStatus;
  step: number;
};

const PREFIX = "dwelve:onboarding:v1";

function storage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function onboardingKey(userId: string, memberId?: string | null) {
  return `${PREFIX}:${userId}:${memberId ?? "account"}`;
}

export function pendingOnboardingKey(userId: string) {
  return `${PREFIX}:pending:${userId}`;
}

export function readOnboardingState(userId: string, memberId?: string | null) {
  const value = storage()?.getItem(onboardingKey(userId, memberId));
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<OnboardingState>;
    if (
      parsed.version !== 1 ||
      !["in_progress", "completed", "skipped"].includes(parsed.status ?? "") ||
      typeof parsed.step !== "number"
    ) {
      return null;
    }
    return parsed as OnboardingState;
  } catch {
    return null;
  }
}

export function writeOnboardingState(
  userId: string,
  memberId: string | null | undefined,
  state: Omit<OnboardingState, "version">,
) {
  try {
    storage()?.setItem(
      onboardingKey(userId, memberId),
      JSON.stringify({ version: 1, ...state } satisfies OnboardingState),
    );
  } catch {
    // The flow still works when storage is blocked; it simply cannot persist.
  }
}

export function markOnboardingPending(userId?: string) {
  if (!userId) return;
  try {
    storage()?.setItem(pendingOnboardingKey(userId), "1");
  } catch {}
}

export function hasPendingOnboarding(userId: string) {
  try {
    return storage()?.getItem(pendingOnboardingKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function clearPendingOnboarding(userId: string) {
  try {
    storage()?.removeItem(pendingOnboardingKey(userId));
  } catch {}
}

export function migrateAccountOnboarding(userId: string, memberId: string) {
  const memberState = readOnboardingState(userId, memberId);
  if (memberState) return memberState;
  const accountState = readOnboardingState(userId, null);
  const next: OnboardingState = {
    version: 1,
    status: "in_progress",
    step: accountState?.status === "in_progress" ? 0 : 0,
  };
  writeOnboardingState(userId, memberId, next);
  return next;
}
