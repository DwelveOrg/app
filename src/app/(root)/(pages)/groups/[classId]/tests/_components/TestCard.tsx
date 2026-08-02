"use client";

import Link from "next/link";
import { Clock3, ListChecks, Target, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ApiTestSummary,
  FormatBlueprintRegistry,
} from "@/app/(root)/_lib/tests.schemas";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import TestStatusBadge from "./TestStatusBadge";
import DuplicateTestButton from "./DuplicateTestButton";
import { humanizeToken, translateKey } from "../_lib/labels";

type TestCardProps = {
  test: ApiTestSummary;
  classId: string;
  /** The blueprint registry, so the format badge reads as its own label. */
  formats: FormatBlueprintRegistry;
  onRequestDelete: (test: ApiTestSummary) => void;
};

/**
 * One test in the class list: what it is, how big it is, and where it stands.
 * The whole card is a link into the builder; the row of controls sits outside
 * that link so a duplicate or delete never navigates by accident.
 */
export default function TestCard({
  test,
  classId,
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
    <article className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))]">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 text-base font-semibold text-[var(--foreground)]">
              <Link
                href={`/groups/${classId}/tests/${test.id}`}
                className="block truncate rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
              >
                {test.title}
              </Link>
            </h3>
            <TestStatusBadge status={test.status} />
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
            {test.description || t("root.tests.list.noDescription")}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
          {formatLabel}
        </span>
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)]">
        <Meta
          icon={<ListChecks className="h-3.5 w-3.5" />}
          label={t("root.tests.list.meta.questions")}
          value={
            questionCount === null
              ? "—"
              : t("root.tests.list.meta.questionCount", { count: questionCount })
          }
        />
        <Meta
          icon={<Target className="h-3.5 w-3.5" />}
          label={t("root.tests.list.meta.points")}
          value={t("root.tests.list.meta.pointCount", { count: test.totalPoints })}
        />
        {test.durationMinutes ? (
          <Meta
            icon={<Clock3 className="h-3.5 w-3.5" />}
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

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
        <Button asChild size="sm">
          <Link href={`/groups/${classId}/tests/${test.id}`}>
            {test.status === "DRAFT"
              ? t("root.tests.list.actions.edit")
              : t("root.tests.list.actions.open")}
          </Link>
        </Button>

        <DuplicateTestButton testId={test.id} classId={classId} />

        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
          onClick={() => onRequestDelete(test)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {test.status === "DRAFT"
            ? t("root.tests.list.actions.delete")
            : t("root.tests.list.actions.archive")}
        </Button>
      </div>
    </article>
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
      <dd className="font-medium text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
