"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
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

  return (
    <nav
      aria-label={t("root.enrollment.nav.label")}
      className="flex flex-wrap items-center gap-1 border-b border-[var(--border)]"
    >
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/groups" ? pathname === "/groups" : pathname.startsWith(tab.href);
        const showBadge = tab.href === "/groups/requests" && pendingCount > 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex h-9 items-center gap-1.5 px-3 text-sm font-medium transition-colors",
              isActive
                ? "text-[var(--primary)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {t(tab.labelKey)}
            {showBadge ? (
              <span
                className={cn(
                  "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                )}
              >
                {pendingCount}
              </span>
            ) : null}
            {isActive ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--primary)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
