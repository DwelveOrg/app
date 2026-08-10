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
  /** The blueprint registry, so the format badge reads as its own label. */
  formats: FormatBlueprintRegistry;
  onRequestDelete: (test: ApiTestSummary) => void;
};

/**
 * One test in the class list: what it is, how big it is, and where it stands.
 * The whole card is a link into the studio; the row of controls sits outside
 * that link so a duplicate or delete never navigates by accident.
 */
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
    <Surface as="article" interactive className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-3">
        <FormatMark icon={formatIcon(test.format)} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="type-heading min-w-0 text-foreground">
              {/*
                The link stretches over the whole card so the card body is the click target that
                `Surface interactive` promises, while the controls in the footer sit above it in
                the stacking order and stay independently clickable.
              */}
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

        <Badge variant="outline">
          {formatLabel}
        </Badge>
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

      {/* `relative` lifts the controls above the title link's stretched hit area. */}
      <div className="relative flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button asChild size="sm">
          <Link href={studioRoutes.builder(test.id)}>
            {test.status === "DRAFT"
              ? t("root.tests.list.actions.edit")
              : t("root.tests.list.actions.open")}
          </Link>
        </Button>

        {/*
          Results are the point of publishing, so the way to them is on the card
          rather than inside the studio. Drafts have none — a link to an empty
          register is a promise the page cannot keep — and archived tests keep
          theirs, because a finished term's marks are exactly what gets looked
          up later.
        */}
        {test.status === "DRAFT" ? null : (
          <Button asChild size="sm" variant="outline">
            <Link href={`/groups/${test.classId}/tests/${test.id}/results`}>
              <BarChart3 className="size-3.5" />
              {t("root.tests.list.actions.results")}
            </Link>
          </Button>
        )}

        <DuplicateTestButton testId={test.id} />

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
