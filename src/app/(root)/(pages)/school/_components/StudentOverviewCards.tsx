"use client";

import Link from "next/link";
import { ChevronRight, Clock, Compass, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import Surface from "@/components/ui/Surface";

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
        <Surface
          key={card.key}
          as={Link}
          href={card.href}
          interactive
          padding="sm"
          className="group flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <card.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <div className="truncate text-sm text-muted-foreground">{card.label}</div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
        </Surface>
      ))}
    </div>
  );
}
