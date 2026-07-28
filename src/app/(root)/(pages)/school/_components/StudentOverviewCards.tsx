"use client";

import Link from "next/link";
import { ChevronRight, Clock, Compass, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";

type StudentOverviewCardsProps = {
  availableClasses: number;
  activeClasses: number;
  pendingRequests: number;
};

/**
 * Student-facing summary of the school overview counts
 * (`GET /schools/:schoolId/student-overview`). Each card links to the matching
 * class-enrollment surface. School membership and class enrollment are kept
 * visibly distinct: "My classes" reflects the active roster, not membership.
 */
export default function StudentOverviewCards({
  availableClasses,
  activeClasses,
  pendingRequests,
}: StudentOverviewCardsProps) {
  const { t } = useTranslation();

  const cards: {
    key: string;
    href: string;
    icon: LucideIcon;
    value: number;
    label: string;
  }[] = [
    {
      key: "available",
      href: "/groups",
      icon: Compass,
      value: availableClasses,
      label: t("root.enrollment.overview.available"),
    },
    {
      key: "active",
      href: "/groups",
      icon: GraduationCap,
      value: activeClasses,
      label: t("root.enrollment.overview.active"),
    },
    {
      key: "pending",
      href: "/groups/requests",
      icon: Clock,
      value: pendingRequests,
      label: t("root.enrollment.overview.pending"),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[color-mix(in_srgb,var(--primary)_45%,transparent)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <card.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-bold text-[var(--foreground)]">{card.value}</div>
            <div className="truncate text-sm text-[var(--muted-foreground)]">{card.label}</div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
