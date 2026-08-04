"use client";

import { useTranslation } from "react-i18next";

import PageHeader from "@/app/(root)/_components/PageHeader";
import JoinCodeChip from "./JoinCodeChip";

type DashboardHeaderProps = {
  fullName: string | null;
  /** Shown as a compact copyable chip for admins so the join code stays reachable. */
  studentJoinCode?: string | null;
  isAdmin: boolean;
};

function getFirstName(fullName: string | null): string {
  if (!fullName?.trim()) return "";
  return fullName.trim().split(/\s+/)[0];
}

/**
 * Dashboard title block: a plain, task-focused greeting (no orchestrated load
 * animation, no oversized display treatment — see product register) plus, for
 * admins, the student join code folded in as a compact action so the reference
 * layout stays clean without dropping that affordance. The chip itself lives in
 * {@link JoinCodeChip} so the empty-school setup state can reuse it.
 */
export default function DashboardHeader({
  fullName,
  studentJoinCode,
  isAdmin,
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  const firstName = getFirstName(fullName);
  const title = firstName
    ? t("root.dashboard.welcome.title", { name: firstName })
    : t("root.dashboard.welcome.titleGeneric");

  return (
    <PageHeader
      title={title}
      subtitle={t("root.dashboard.welcome.subtitle")}
      actions={isAdmin && studentJoinCode ? <JoinCodeChip code={studentJoinCode} /> : null}
    />
  );
}
