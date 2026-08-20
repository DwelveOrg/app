"use client";

import Link from "next/link";
import { BarChart3, Clock3, ListChecks, Target, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ApiTestSummary,
  FormatBlueprintRegistry,
} from "@/app/(root)/_lib/tests.schemas";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import TestStatusBadge from "@/components/tests/TestStatusBadge";
import FormatMark from "@/components/tests/FormatMark";
import DuplicateTestButton from "./DuplicateTestButton";
import { humanizeToken, translateKey } from "@/app/(root)/_lib/test-labels";
import { formatIcon, studioRoutes } from "@/app/(root)/_constants/tests";
import Surface from "@/components/ui/Surface";
import Badge from "@/components/ui/badge";

type TestCardProps = {
  test: ApiTestSummary;
  formats: FormatBlueprintRegistry;
  onRequestDelete?: (test: ApiTestSummary) => void;
};

export default function TestCard({
  test,
  formats,
  onRequestDelete,
}: TestCardProps) {
  const { t } = useTranslation();

  const formatLabel = translateKey(
    t,
    formats[test.format]?.labelKey,
    humanizeToken(test.format),
  );
  const questionCount = test.counts?.questions ?? test.questionCount ?? null;

  return (
    // `h-full` so cards sharing a grid row end level, and the action bar below
    // takes `mt-auto` so those rows line up too. Without both, a card with a
    // one-line description floated its buttons up and the pair read as ragged.
    <Surface as="article" interactive className="@container flex h-full flex-col gap-3">
      {/*
        The header wraps on the card's width, never on the title's length.

        It was `flex-wrap` at both levels, and flexbox wraps before it shrinks:
        a title long enough to fill the line pushed the status badge onto a row
        of its own, so *that* card grew a line taller than the one beside it and
        every row below — description, meta, actions — fell out of alignment
        with its neighbour. Two cards in a grid row always share a width, so a
        container query switches both at once and they cannot disagree.

        Wide enough: one line, and the title truncates into whatever the badges
        leave it. Too narrow for that (a phone, one column): the badges take
        their own line rather than crushing the title to six characters. The
        full title is on hover, and one click away regardless.
      */}
      <div className="flex items-start gap-3">
        <FormatMark icon={formatIcon(test.format)} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 @md:flex-row @md:items-center @md:gap-2">
            <h3 className="type-heading min-w-0 text-foreground @md:flex-1">
              <Link
                href={studioRoutes.builder(test.id)}
                title={test.title}
                className="block truncate rounded-sm outline-none before:absolute before:inset-0 before:rounded-2xl hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {test.title}
              </Link>
            </h3>

            <div className="flex shrink-0 items-center gap-2">
              <TestStatusBadge status={test.status} />
              <Badge variant="outline">{formatLabel}</Badge>
            </div>
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {test.description || t("root.tests.list.noDescription")}
          </p>
        </div>
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <Meta
          icon={<ListChecks className="size-3.5" />}
          label={t("root.tests.list.meta.questions")}
          value={
            questionCount === null
              ? "—"
              : t("root.tests.list.meta.questionCount", { count: questionCount })
          }
        />
        <Meta
          icon={<Target className="size-3.5" />}
          label={t("root.tests.list.meta.points")}
          value={t("root.tests.list.meta.pointCount", { count: test.totalPoints })}
        />
        {test.durationMinutes ? (
          <Meta
            icon={<Clock3 className="size-3.5" />}
            label={t("root.tests.list.meta.duration")}
            value={t("root.tests.list.meta.minutes", { count: test.durationMinutes })}
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

      <div className="relative mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button asChild size="sm">
          <Link href={studioRoutes.builder(test.id)}>
            {test.status === "DRAFT"
              ? t("root.tests.list.actions.edit")
              : t("root.tests.list.actions.open")}
          </Link>
        </Button>

        {test.status === "DRAFT" ? null : (
          <Button asChild size="sm" variant="outline">
            <Link href={`/groups/${test.classId}/tests/${test.id}/results`}>
              <BarChart3 className="size-3.5" />
              {t("root.tests.list.actions.results")}
            </Link>
          </Button>
        )}

        <DuplicateTestButton testId={test.id} />

        {onRequestDelete ? (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-destructive"
            onClick={() => onRequestDelete(test)}
          >
            <Trash2 className="size-3.5" />
            {test.status === "DRAFT"
              ? t("root.tests.list.actions.delete")
              : t("root.tests.list.actions.archive")}
          </Button>
        ) : null}
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
