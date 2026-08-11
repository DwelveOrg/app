"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  hasPendingOnboarding,
  readOnboardingState,
} from "@/app/onboarding/_lib/onboarding-storage";
import Skeleton from "@/components/ui/Skeleton";

export default function OnboardingGate({
  userId,
  memberId,
  children,
}: {
  userId: string;
  memberId?: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const state = readOnboardingState(userId, memberId);
    const needsOnboarding =
      hasPendingOnboarding(userId) &&
      state?.status !== "completed" &&
      state?.status !== "skipped";
    if (needsOnboarding) {
      router.replace("/onboarding");
      return;
    }
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [memberId, router, userId]);

  if (!ready) {
    return (
      <div className="space-y-5" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return children;
}
