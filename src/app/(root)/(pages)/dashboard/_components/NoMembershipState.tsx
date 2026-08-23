"use client";

import { useTranslation } from "react-i18next";

import OnboardingActions from "@/app/(root)/_components/OnboardingActions";

export default function NoMembershipState() {
  const { t } = useTranslation();

  return (
    // This *is* the page — there is nothing else on it — so it centres in the
    // room it actually has rather than in an arbitrary 52vh, which parked the
    // three cards in the upper third and left the rest reading as a hole.
    <section className="flex min-h-[calc(100dvh-9rem)] items-center justify-center">
      <div className="w-full max-w-2xl text-center">
        {/* No eyebrow: "Account ready" restated the description's first
            sentence in small caps above the title. The heading speaks. */}
        <h1 className="type-title text-foreground">
          {t("root.dashboard.empty.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {t("root.dashboard.empty.description")}
        </p>

        <OnboardingActions className="mt-8" />
      </div>
    </section>
  );
}
