"use client";

import Link from "next/link";
import {
  BarChart3,
  Clock3,
  GraduationCap,
  ListChecks,
  Share2,
  Target,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ApiLibraryTestSummary,
  FormatBlueprintRegistry,
} from "@/app/(root)/_lib/tests.schemas";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import TestStatusBadge from "@/components/tests/TestStatusBadge";
import FormatMark from "@/components/tests/FormatMark";
import { humanizeToken, translateKey } from "@/app/(root)/_lib/test-labels";
import { formatIcon, studioRoutes } from "@/app/(root)/_constants/tests";
import Surface from "@/components/ui/Surface";
import Badge from "@/components/ui/badge";

type LibraryTestCardProps = {
  test: ApiLibraryTestSummary;
  formats: FormatBlueprintRegistry;
  /** False for a retained test whose class is inactive or no longer assigned. */
  canOpenClass: boolean;
  onRequestAssign: (test: ApiLibraryTestSummary) => void;
};

/**
 * One test in the library. Structurally the class list's card, with the two
 * differences this surface exists for: the class is named, because the list
 * spans classes; and "Assign to class" replaces delete, because removing a test
 * belongs where the class that owns it is managed.
 */
export default function LibraryTestCard({
  test,
  formats,
  canOpenClass,
  onRequestAssign,
}: LibraryTestCardProps) {
  const { t } = useTranslation();

  const formatLabel = translateKey(
    t,
    formats[test.format]?.labelKey,
    humanizeToken(test.format),
  );
  const questionCount = test.counts?.questions ?? test.questionCount ?? null;

  return (
    <Surface as="article" interactive className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-3">
        <FormatMark icon={formatIcon(test.format)} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="type-heading min-w-0 text-foreground">
              {/* Stretched over the card, with the footer controls lifted above it. */}
              <Link
                href={studioRoutes.builder(test.id)}
                className="block truncate rounded-sm outline-none before:absolute before:inset-0 before:rounded-2xl hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {test.title}
              </Link>
            </h3>
            <TestStatusBadge status={test.status} />
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {test.description || t("root.tests.list.noDescription")}
          </p>
        </div>

        <Badge variant="outline">{formatLabel}</Badge>
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {/*
          The class leads the meta row rather than sitting with the counts: on a
          cross-class list it is what tells two similarly named papers apart, so
          it is identity, not a statistic.
        */}
        <Meta
          icon={<GraduationCap className="size-3.5" />}
          label={t("root.tests.library.meta.class")}
          value={test.class.name}
        />
        <Meta
          icon={<ListChecks className="size-3.5" />}
          label={t("root.tests.list.meta.questions")}
          value={
            questionCount === null
              ? "—"
              : t("root.tests.list.meta.questionCount", {
                  count: questionCount,
                })
          }
        />
        <Meta
          icon={<Target className="size-3.5" />}
          label={t("root.tests.list.meta.points")}
          value={t("root.tests.list.meta.pointCount", {
            count: test.totalPoints,
          })}
        />
        {test.durationMinutes ? (
          <Meta
            icon={<Clock3 className="size-3.5" />}
            label={t("root.tests.list.meta.duration")}
            value={t("root.tests.list.meta.minutes", {
              count: test.durationMinutes,
            })}
          />
        ) : null}
        {test.updatedAt ? (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">{t("root.tests.list.meta.updated")}</dt>
            <dd>
              {t("root.tests.list.meta.updatedAt")}{" "}
              <RelativeTime date={test.updatedAt} />
            </dd>
          </div>
        ) : null}
      </dl>

      {/* `relative` lifts the controls above the title link's stretched hit area. */}
      <div className="relative flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button asChild size="sm">
          <Link href={studioRoutes.builder(test.id)}>
            {test.status === "DRAFT"
              ? t("root.tests.list.actions.edit")
              : t("root.tests.list.actions.open")}
          </Link>
        </Button>

        {test.status === "DRAFT" ? null : (
          <Button asChild size="sm" variant="outline">
            <Link href={`/groups/${test.class.id}/tests/${test.id}/results`}>
              <BarChart3 className="size-3.5" />
              {t("root.tests.list.actions.results")}
            </Link>
          </Button>
        )}

        {canOpenClass ? (
          <Button asChild size="sm" variant="outline">
            <Link href={studioRoutes.classTests(test.class.id)}>
              <GraduationCap className="size-3.5" />
              {t("root.tests.library.actions.openClass")}
            </Link>
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => onRequestAssign(test)}
        >
          <Share2 className="size-3.5" />
          {t("root.tests.library.actions.assign")}
        </Button>
      </div>
    </Surface>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="inline-flex items-center gap-1">
        <span aria-hidden="true">{icon}</span>
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
