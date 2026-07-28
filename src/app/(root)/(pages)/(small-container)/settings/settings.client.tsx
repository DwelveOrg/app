"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/app/(root)/_components/PageHeader";
import { AccountCard } from "./_components/AccountCard";
import { PreferencesSection } from "./_components/PreferencesSection";
import { SecuritySection } from "./_components/SecuritySection";
import { SupportSection } from "./_components/SupportSection";
import type { SettingsAccountContext, SettingsClientProps } from "./_types";

export default function SettingsClient({ user, profile }: Readonly<SettingsClientProps>) {
  const reduce = useReducedMotion();
  const { t } = useTranslation();

  // Profile is the richer source (avatar, school, role); the session cookie
  // keeps the page usable when the bootstrap request fails.
  const account: SettingsAccountContext = {
    name: profile?.account.fullName ?? user?.fullName ?? null,
    email: profile?.account.email ?? user?.email ?? null,
    avatarUrl: profile?.account.avatarUrl ?? null,
    schoolName: profile?.selectedSchool?.school.name ?? null,
    role: profile?.selectedSchool?.member.role ?? user?.schoolRole ?? null,
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-7"
    >
      <PageHeader
        title={t("root.pages.settings")}
        subtitle={t("root.settings.subtitle")}
      />
      <AccountCard account={account} />
      <PreferencesSection />
      <SecuritySection account={account} />
      <SupportSection account={account} />
    </motion.div>
  );
}
