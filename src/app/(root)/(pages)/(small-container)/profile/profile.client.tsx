"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import PageHeader from "@/app/(root)/_components/PageHeader";
import Empty from "../../_components/ui/Empty";
import { AccountDetailsForm } from "./_components/AccountDetailsForm";
import { MembershipsPanel } from "./_components/MembershipsPanel";
import { ProfileSummaryCard } from "./_components/ProfileSummaryCard";
import { SchoolProfileForm } from "./_components/SchoolProfileForm";
import { SecurityLinkCard } from "./_components/SecurityLinkCard";
import type { ProfileClientProps } from "./_types";

export default function ProfileClient({ user, profile }: Readonly<ProfileClientProps>) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  if (!user || !profile) {
    return (
      <div className="flex min-h-[calc(100dvh-12rem)] w-full items-center justify-center">
        <Empty />
      </div>
    );
  }

  const { account, selectedSchool, memberships } = profile;
  const showSchoolProfile =
    selectedSchool && selectedSchool.roleProfile.type !== "ADMIN";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <PageHeader
        title={t("root.pages.profile")}
        subtitle={t("root.profile.subtitle")}
      />

      <ProfileSummaryCard account={account} selectedSchool={selectedSchool} />

      <AccountDetailsForm account={account} />

      {showSchoolProfile ? (
        <SchoolProfileForm selectedSchool={selectedSchool} />
      ) : null}

      <MembershipsPanel memberships={memberships} selectedSchool={selectedSchool} />

      <SecurityLinkCard />
    </motion.div>
  );
}
