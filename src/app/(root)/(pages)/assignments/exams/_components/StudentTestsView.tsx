"use client";

import { useMemo, useState } from "react";
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
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import TabBar from "@/components/ui/TabBar";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import FormatMark from "@/components/tests/FormatMark";
import { formatIcon } from "@/app/(root)/_constants/tests";
import type { StudentTestRow } from "@/app/exam/_lib/attempts.schemas";
import { staggerContainer, staggerItem, stillVariants } from "@/lib/motion";

type Tab = "open" | "done";

/**
 * A student's tests.
 *
 * ## What this replaced
 *
 * Three hard-coded fixtures — "Midterm", "Code Sprint", "History Final" — with
 * invented dates and invented marks, on a route any signed-in user could reach
 * by URL. A student who typed the address was shown fabricated results as if
 * they were their own. The fixtures are deleted, not hidden.
 *
 * ## Two tabs, not five
 *
 * The seven backend states collapse into the only distinction a student acts
 * on: **something to do**, and **something already done**. "Not yet open" and
 * "in progress" belong together because both mean *this one is still ahead of
 * you*; the row itself says which. A tab per state would be five tabs, four of
 * them usually empty.
 *
 * The row's button is the whole state machine made visible: Start, Continue,
 * See result, or nothing at all with a reason beside it.
 */
export default function StudentTestsView({ tests }: { tests: StudentTestRow[] }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<Tab>("open");

  const { open, done } = useMemo(() => {
    const open: StudentTestRow[] = [];
    const done: StudentTestRow[] = [];

    for (const test of tests) {
      if (test.state === "SUBMITTED" || test.state === "GRADED") done.push(test);
      else open.push(test);
    }

    return { open, done };
  }, [tests]);

  const visible = tab === "open" ? open : done;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <TabBar
        variant="pill"
        layoutId="student-tests-tabs"
        ariaLabel={t("root.exams.tabsLabel")}
        value={tab}
        onSelect={(next) => setTab(next as Tab)}
        items={[
          { value: "open", label: t("root.exams.tabs.active"), count: open.length },
          { value: "done", label: t("root.exams.tabs.completed"), count: done.length },
        ]}
      />

      {visible.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Empty
            title={t(`root.exams.empty.${tab}.title`)}
            description={t(`root.exams.empty.${tab}.description`)}
          />
        </div>
      ) : (
        <motion.ul
          key={tab}
          variants={reduced ? stillVariants : staggerContainer}
          initial="hidden"
          animate="shown"
          className="grid gap-4 lg:grid-cols-2"
        >
          {visible.map((test) => (
            <motion.li key={test.id} variants={reduced ? stillVariants : staggerItem}>
              <TestRow test={test} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

function TestRow({ test }: { test: StudentTestRow }) {
  const { t } = useTranslation();

  const closesAt = test.availableUntil ? new Date(test.availableUntil) : null;
  const opensAt = test.availableFrom ? new Date(test.availableFrom) : null;

  return (
    <Surface as="article" className="flex h-full flex-col gap-3">
      <div className="flex items-start gap-3">
        <FormatMark icon={formatIcon(test.format)} size="sm" />

        <div className="min-w-0 flex-1">
          <h3 className="type-heading truncate text-foreground">{test.title}</h3>
          {test.className ? (
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
    case "AVAILABLE":
      return (
        <>
          <Button asChild size="sm">
            <Link href={`/exam/${test.id}`}>
              <Play />
              {t("exam.cover.start")}
            </Link>
          </Button>
          {test.attemptsAllowed > 1 ? (
            <span className="text-2xs text-muted-foreground">
              {t("exam.cover.attemptsLeft", {
                count: Math.max(0, test.attemptsAllowed - test.attemptsUsed),
              })}
            </span>
          ) : null}
        </>
      );

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
      <Badge variant="success" size="sm">
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
