"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import TabBar from "@/components/ui/TabBar";
import { useStudentOverview } from "@/app/(root)/_hooks/useEnrollment";

type ClassesNavProps = {
  schoolId: string | undefined;
};

const TABS = [
  { href: "/groups", labelKey: "root.enrollment.nav.classes" },
  { href: "/groups/requests", labelKey: "root.enrollment.nav.requests" },
] as const;

/**
 * Navigation for the student class experience: one Classes directory (enrolled
 * and joinable classes together, from `GET /classes`) plus Requests (pending
 * approvals). The Requests tab shows a live pending count sourced from the
 * student overview so it stays in sync with request/cancel mutations.
 */
export default function ClassesNav({ schoolId }: ClassesNavProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { data: overview } = useStudentOverview(schoolId);
  const pendingCount = overview?.counts.pendingRequests ?? 0;

  const active =
    pathname === "/groups" ? "/groups" : pathname.startsWith("/groups/requests") ? "/groups/requests" : "/groups";

  return (
    <TabBar
      layoutId="classes-nav"
      ariaLabel={t("root.enrollment.nav.label")}
      value={active}
      items={TABS.map((tab) => ({
        value: tab.href,
        href: tab.href,
        label: t(tab.labelKey),
        count: tab.href === "/groups/requests" ? pendingCount : undefined,
      }))}
    />
  );
}
