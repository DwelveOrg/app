"use client";

import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  ListChecks,
  Play,
  RotateCcw,
  Target,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import FormatMark from "@/components/tests/FormatMark";
import { formatIcon } from "@/app/(root)/_constants/tests";
import type { StudentTestRow } from "@/app/exam/_lib/attempts.schemas";

/**
 * One test, as a student sees it.
 *
 * Shared by the Assignments page and the tests section on a class page, so the
 * same paper cannot describe itself two different ways depending on which
 * route the student arrived from — which was the risk the moment a class
 * gained a test list of its own.
 *
 * The card is driven entirely by `state`, which the *server* resolved. A client
 * comparing `availableUntil` to its own clock would show a paper as open to a
 * student whose laptop is running slow.
 */
export default function StudentTestCard({
  test,
  /** Off on a class page, where every row belongs to the same class. */
  showClassName = true,
}: {
  test: StudentTestRow;
  showClassName?: boolean;
}) {
  const { t } = useTranslation();

  const closesAt = test.availableUntil ? new Date(test.availableUntil) : null;
  const opensAt = test.availableFrom ? new Date(test.availableFrom) : null;

  return (
    <Surface as="article" className="flex h-full flex-col gap-3">
      <div className="flex items-start gap-3">
        <FormatMark icon={formatIcon(test.format)} size="sm" />

        <div className="min-w-0 flex-1">
          <h3 className="type-heading truncate text-foreground">{test.title}</h3>
          {showClassName && test.className ? (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{test.className}</p>
          ) : null}
        </div>

        <StateBadge test={test} />
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <Meta
          icon={<ListChecks className="size-3.5" />}
          label={t("exam.cover.questions")}
          value={String(test.questionCount)}
        />
        <Meta
          icon={<Target className="size-3.5" />}
          label={t("exam.cover.points")}
          value={String(test.totalPoints)}
        />
        {test.durationMinutes ? (
          <Meta
            icon={<Clock3 className="size-3.5" />}
            label={t("exam.cover.duration")}
            value={t("exam.cover.minutes", { count: test.durationMinutes })}
          />
        ) : null}
        {/*
          The deadline is the single most useful fact on this card, so it is
          always shown when there is one — a student planning their week is
          reading dates, not question counts.
        */}
        {closesAt ? (
          <Meta
            icon={<CalendarClock className="size-3.5" />}
            label={t("root.exams.card.labels.deadline")}
            value={closesAt.toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        ) : null}
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Action test={test} opensAt={opensAt} />
      </div>
    </Surface>
  );
}

/**
 * The one control, chosen by the state the server resolved.
 *
 * Where there is nothing to press, there is a sentence instead of a disabled
 * button. A greyed-out "Start" on a test that closed last week invites a press
 * and explains nothing.
 */
function Action({ test, opensAt }: { test: StudentTestRow; opensAt: Date | null }) {
  const { t } = useTranslation();

  switch (test.state) {
    case "AVAILABLE": {
      // A retake-eligible test is AVAILABLE even though an earlier attempt is
      // already marked, so the result of that attempt has to stay reachable
      // from here — it is the only place the student can get back to it.
      const retaking = test.attemptsUsed > 0;
      return (
        <>
          <Button asChild size="sm">
            <Link href={`/exam/${test.id}`}>
              {retaking ? <RotateCcw /> : <Play />}
              {retaking ? t("exam.result.tryAgain") : t("exam.cover.start")}
            </Link>
          </Button>
          {retaking && test.lastAttempt?.resultAvailable ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/exam/${test.id}/result/${test.lastAttempt.id}`}>
                <CheckCircle2 />
                {t("root.exams.seeResult")}
              </Link>
            </Button>
          ) : null}
          {test.attemptsAllowed > 1 ? (
            <span className="text-2xs text-muted-foreground">
              {t("exam.cover.attemptsLeft", {
                count: Math.max(0, test.attemptsAllowed - test.attemptsUsed),
              })}
            </span>
          ) : null}
        </>
      );
    }

    case "IN_PROGRESS":
      return (
        <Button asChild size="sm">
          <Link
            href={
              test.activeAttemptId
                ? `/exam/${test.id}/attempt?attempt=${test.activeAttemptId}`
                : `/exam/${test.id}`
            }
          >
            <RotateCcw />
            {t("exam.cover.resume")}
          </Link>
        </Button>
      );

    case "SUBMITTED":
    case "GRADED":
      return test.lastAttempt?.resultAvailable ? (
        <Button asChild size="sm" variant="outline">
          <Link href={`/exam/${test.id}/result/${test.lastAttempt.id}`}>
            <CheckCircle2 />
            {t("root.exams.seeResult")}
          </Link>
        </Button>
      ) : (
        <p className="text-13 text-muted-foreground">{t("root.exams.awaitingResults")}</p>
      );

    case "NOT_YET_OPEN":
      return (
        <p className="text-13 text-muted-foreground">
          {opensAt
            ? t("root.exams.opensAt", { when: opensAt.toLocaleString() })
            : t("exam.cover.blocked.NOT_YET_OPEN")}
        </p>
      );

    default:
      return (
        <p className="text-13 text-muted-foreground">
          {t(`exam.cover.blocked.${test.state}`)}
        </p>
      );
  }
}

function StateBadge({ test }: { test: StudentTestRow }) {
  const { t } = useTranslation();
  const attempt = test.lastAttempt;

  if (attempt?.resultAvailable && attempt.score != null && attempt.maxScore != null) {
    return (
      <Badge variant="neutral" size="sm">
        {attempt.score} / {attempt.maxScore}
      </Badge>
    );
  }

  if (test.state === "SUBMITTED" || test.state === "GRADED") {
    return (
      <Badge variant="neutral" size="sm">
        <CheckCircle2 aria-hidden="true" />
        {t("root.exams.state.done")}
      </Badge>
    );
  }

  if (test.state === "IN_PROGRESS") {
    return (
      <Badge variant="warning" size="sm">
        {t("root.exams.state.inProgress")}
      </Badge>
    );
  }

  return null;
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
