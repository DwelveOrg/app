"use client";

import { useTranslation } from "react-i18next";

import OnboardingActions from "@/app/(root)/_components/OnboardingActions";

export default function NoMembershipState() {
  const { t } = useTranslation();

  return (
    <section className="flex min-h-[52vh] items-center justify-center">
      <div className="w-full max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {t("root.dashboard.empty.eyebrow")}
        </p>
        <h1 className="mt-3 type-title text-foreground">
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
