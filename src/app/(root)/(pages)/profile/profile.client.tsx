"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import PageHeader from "@/app/(root)/_components/PageHeader";
import Surface from "@/components/ui/Surface";
import TabBar from "@/components/ui/TabBar";
import { AccountTab } from "./_components/AccountTab";
import { PreferencesTab } from "./_components/PreferencesTab";
import { SecurityTab } from "./_components/SecurityTab";
import { SupportTab } from "./_components/SupportTab";
import type { AccountTab as AccountTabKey, ProfileClientProps } from "./_types";

/**
 * The account area: one destination for what used to be `/profile` and
 * `/settings`.
 *
 * Both halves already read the same `GET /profile` bootstrap, so keeping them
 * apart cost a second request and a nav item without buying a single capability.
 * The four panels are tabs rather than one long scroll — identity, security,
 * preferences and support are things you arrive wanting *one* of.
 *
 * The tab is local state, seeded from `?tab=` so the retired Settings URLs land
 * on the panel their content moved to.
 *
 * Width: this used to sit in a `(small-container)` route group that capped it at
 * 600px inside a shell already capped at 1180, which left roughly 290px of dead
 * canvas on either side of a desktop window and made the account area read as
 * unfinished next to Dashboard and Groups. The cap is now one measure short of
 * the shell's, so the page keeps a deliberate inset without stranding half the
 * screen — and each panel splits into two columns from `lg` up rather than
 * stretching a single stacked column across it.
 */
export default function ProfileClient({
  profile,
  initialTab,
}: Readonly<ProfileClientProps>) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState<AccountTabKey>(initialTab);

  // Never offer the passwordless setup form on a guess: an account that already
  // has a password would be shown the wrong flow.
  const hasPassword = profile?.account.authMethods?.password ?? true;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[1040px] space-y-6"
    >
      <PageHeader title={t("root.pages.profile")} subtitle={t("root.profile.subtitle")} />

      <TabBar
        layoutId="account-tabs"
        ariaLabel={t("root.profile.tabs.label")}
        value={activeTab}
        onSelect={(next) => setActiveTab(next as AccountTabKey)}
        items={[
          { value: "account", label: t("root.profile.tabs.account") },
          { value: "security", label: t("root.profile.tabs.security") },
          { value: "preferences", label: t("root.profile.tabs.preferences") },
          { value: "support", label: t("root.profile.tabs.support") },
        ]}
      />

      {/* Theme, language and the support composer are frontend-owned, so a failed
          bootstrap must not take them away with it. Only the two panels that read
          account data report the failure — and Security still renders, because
          revoking a session, logging out everywhere and deleting the account each
          make their own request and can succeed while `GET /profile` is down. */}
      {activeTab === "account" ? (
        profile ? (
          <AccountTab profile={profile} />
        ) : (
          <UnavailableNotice message={t("root.profile.unavailable")} />
        )
      ) : activeTab === "security" ? (
        <div className="space-y-6">
          {profile ? null : <UnavailableNotice message={t("root.profile.unavailable")} />}
          <SecurityTab hasPassword={hasPassword} />
        </div>
      ) : activeTab === "preferences" ? (
        <PreferencesTab />
      ) : (
        <SupportTab />
      )}
    </motion.div>
  );
}

function UnavailableNotice({ message }: Readonly<{ message: string }>) {
  return (
    <Surface variant="dashed" elevation={0} role="status">
      <p className="text-center text-sm text-muted-foreground">{message}</p>
    </Surface>
  );
}
