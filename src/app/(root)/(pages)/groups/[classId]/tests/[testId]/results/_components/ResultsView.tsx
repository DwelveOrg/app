"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CircleDashed,
  Clock3,
  PenLine,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import TabBar from "@/components/ui/TabBar";
import ScoreHistogram from "@/components/tests/charts/ScoreHistogram";
import QuestionDifficultyRow from "@/components/tests/charts/QuestionDifficultyRow";
import type {
  TestResultRow,
  TestResultsResponse,
  TestStatisticsResponse,
} from "@/app/(root)/_lib/test-results.schemas";
import { staggerContainer, staggerItem, stillVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Tab = "students" | "questions";

/**
 * How the class did, and how each student did.
 *
 * ## The two questions this screen answers
 *
 * A teacher opening it wants one of two things, and they are different tasks:
 * *"how did Ольга do"* and *"how did the class do"*. The old shape of this
 * screen in most products is a single table of scores, which answers the first
 * badly and the second not at all.
 *
 * So the cohort summary is always on top — it is four numbers and a histogram,
 * it never needs a click, and it is what tells a teacher whether the paper was
 * the right difficulty. Underneath, two tabs: **Students** for the roster, and
 * **Questions** for the per-question analysis that says which items to rewrite.
 *
 * ## Every enrolled student is a row
 *
 * Including the ones who never started. A list of attempts silently omits the
 * absentees, and the absentees are the most actionable thing on the page.
 *
 * ## Marking is surfaced, not buried
 *
 * `pendingManual` gets its own filter and its own badge, because a paper with
 * three unmarked essays is not "graded" and a teacher needs to find those
 * without opening twenty-four papers to check.
 */
export default function ResultsView({
  classId,
  testId,
  testTitle,
  results,
  statistics,
}: {
  classId: string;
  testId: string;
  testTitle: string;
  results: TestResultsResponse;
  statistics: TestStatisticsResponse | null;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();

  const [tab, setTab] = useState<Tab>("students");
  const [search, setSearch] = useState("");
  const [needsMarking, setNeedsMarking] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { summary, rows } = results;
  const cohort = statistics?.cohort;

  /**
   * Filtered in the browser rather than by refetching.
   *
   * A class is thirty rows. A round trip per keystroke would be slower than the
   * filter and would make the table flicker; the server-side `search` parameter
   * exists for the day a page is not the whole class.
   */
  const visible = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      if (needsMarking && row.pendingManual === 0) return false;
      if (!needle) return true;
      return `${row.fullName} ${row.email ?? ""}`.toLocaleLowerCase().includes(needle);
    });
  }, [rows, search, needsMarking]);

  return (
    <motion.div
      className="space-y-6 py-6"
      variants={reduced ? stillVariants : staggerContainer}
      initial="hidden"
      animate="shown"
    >
      <motion.header variants={reduced ? stillVariants : staggerItem}>
        <Link
          href={`/groups/${classId}`}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          {t("root.tests.list.title")}
        </Link>
        <h1 className="type-title mt-1 text-foreground">{testTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("root.tests.results.subtitle", {
            submitted: summary.submitted + summary.graded,
            enrolled: summary.enrolled,
          })}
        </p>
      </motion.header>

      {/* --- The cohort, always visible ------------------------------------ */}
      <motion.div variants={reduced ? stillVariants : staggerItem}>
        <Surface padding="lg" className="space-y-5">
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Figure
              label={t("root.tests.results.stats.mean")}
              value={
                cohort?.mean != null
                  ? `${round(cohort.mean)} / ${cohort.maxScore}`
                  : "—"
              }
              hint={
                cohort?.median != null
                  ? t("root.tests.results.stats.median", { value: round(cohort.median) })
                  : undefined
              }
            />
            <Figure
              label={t("root.tests.results.stats.passRate")}
              value={cohort?.passRate != null ? `${Math.round(cohort.passRate * 100)}%` : "—"}
              hint={
                cohort?.passingScore != null
                  ? t("tests.score.passAt", { score: cohort.passingScore })
                  : t("root.tests.results.stats.noPassMark")
              }
            />
            <Figure
              label={t("root.tests.results.stats.range")}
              value={
                cohort?.min != null && cohort?.max != null
                  ? `${cohort.min}–${cohort.max}`
                  : "—"
              }
              hint={
                cohort?.stdDev != null
                  ? t("root.tests.results.stats.spread", { value: round(cohort.stdDev) })
                  : undefined
              }
            />
            <Figure
              label={t("root.tests.results.stats.submitted")}
              value={`${summary.submitted + summary.graded} / ${summary.enrolled}`}
              hint={
                summary.notStarted > 0
                  ? t("root.tests.results.stats.notStarted", { count: summary.notStarted })
                  : undefined
              }
            />
          </dl>

          {cohort ? (
            <div className="border-t border-border pt-5">
              <p className="type-micro mb-3 text-muted-foreground">
                {t("root.tests.results.stats.distribution")}
              </p>
              <ScoreHistogram
                bins={cohort.distribution}
                passingPercent={
                  cohort.passingScore != null && cohort.maxScore > 0
                    ? (cohort.passingScore / cohort.maxScore) * 100
                    : null
                }
              />
            </div>
          ) : null}
        </Surface>
      </motion.div>

      <motion.div variants={reduced ? stillVariants : staggerItem} className="space-y-4">
        <TabBar
          variant="pill"
          layoutId="results-tabs"
          ariaLabel={t("root.tests.results.tabsLabel")}
          value={tab}
          onSelect={(next) => setTab(next as Tab)}
          items={[
            {
              value: "students",
              label: t("root.tests.results.tabs.students"),
              count: summary.enrolled,
            },
            {
              value: "questions",
              label: t("root.tests.results.tabs.questions"),
              count: statistics?.questions.length ?? 0,
            },
          ]}
        />

        {tab === "students" ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-56 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("root.tests.results.searchPlaceholder")}
                  aria-label={t("root.tests.results.searchLabel")}
                  className="pl-9"
                />
              </div>

              {summary.pendingManual > 0 ? (
                <Button
                  type="button"
                  variant={needsMarking ? "default" : "outline"}
                  size="sm"
                  aria-pressed={needsMarking}
                  onClick={() => setNeedsMarking((value) => !value)}
                >
                  <PenLine />
                  {t("root.tests.results.needsMarking", { count: summary.pendingManual })}
                </Button>
              ) : null}
            </div>

            {visible.length === 0 ? (
              <Surface padding="lg">
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("root.tests.results.noMatches")}
                </p>
              </Surface>
            ) : (
              <Surface padding="none" divided>
                {visible.map((row) => (
                  <StudentRow
                    key={row.studentId}
                    row={row}
                    classId={classId}
                    testId={testId}
                  />
                ))}
              </Surface>
            )}
          </>
        ) : (
          <Surface padding="none" divided>
            {statistics && statistics.questions.length > 0 ? (
              statistics.questions.map((stat) => (
                <QuestionDifficultyRow
                  key={stat.id}
                  stat={stat}
                  attemptsCounted={statistics.cohort.attemptsCounted}
                  expanded={expanded === stat.id}
                  onToggle={() => setExpanded(expanded === stat.id ? null : stat.id)}
                />
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("root.tests.results.stats.noAttempts")}
              </p>
            )}
          </Surface>
        )}
      </motion.div>
    </motion.div>
  );
}

function Figure({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="type-micro text-muted-foreground">{label}</dt>
      {/* Proportional figures: a headline number, not a column. */}
      <dd className="type-title mt-1 text-foreground">{value}</dd>
      {hint ? <p className="mt-0.5 text-2xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * One student.
 *
 * The whole row links into their paper when there is one. When there is not —
 * they never started — it is deliberately not a link: a row that navigates to
 * an empty page is worse than a row that says "not started" and stays put.
 */
function StudentRow({
  row,
  classId,
  testId,
}: {
  row: TestResultRow;
  classId: string;
  testId: string;
}) {
  const { t } = useTranslation();

  const body = (
    <>
      <Avatar name={row.fullName} src={row.avatarUrl ?? undefined} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="type-label truncate text-foreground">{row.fullName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-muted-foreground">
          <StateBadge state={row.state} pendingManual={row.pendingManual} />

          {row.timeSpentSeconds ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock3 className="size-3" aria-hidden="true" />
              {t("root.tests.results.minutes", {
                count: Math.round(row.timeSpentSeconds / 60),
              })}
            </span>
          ) : null}

          {row.isLate ? (
            <span className="inline-flex items-center gap-1 text-warning">
              <CalendarClock className="size-3" aria-hidden="true" />
              {t("root.tests.results.late")}
            </span>
          ) : null}

          {/*
            Violations are shown as a count, never as an accusation. The teacher
            opens the paper to see what actually happened; a row that said
            "cheated" would be the software making a judgement it cannot make.
          */}
          {row.violationCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <ShieldAlert className="size-3" aria-hidden="true" />
              {t("root.tests.results.violations", { count: row.violationCount })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {row.score != null && row.maxScore != null ? (
          <>
            <p
              className={cn(
                "numeric type-heading",
                row.passed === false ? "text-destructive" : "text-foreground",
              )}
            >
              {row.score}
              <span className="text-muted-foreground">/{row.maxScore}</span>
            </p>
            {row.percentage != null ? (
              <p className="text-2xs text-muted-foreground tabular-nums">
                {row.percentage}%
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-13 text-muted-foreground">—</p>
        )}
      </div>
    </>
  );

  if (!row.attemptId) {
    return <div className="flex items-center gap-3 px-4 py-3">{body}</div>;
  }

  return (
    <Link
      href={`/groups/${classId}/tests/${testId}/results/${row.attemptId}`}
      className="interactive-flat flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {body}
    </Link>
  );
}

function StateBadge({
  state,
  pendingManual,
}: {
  state: TestResultRow["state"];
  pendingManual: number;
}) {
  const { t } = useTranslation();

  if (pendingManual > 0) {
    return (
      <Badge variant="warning" size="xs">
        <PenLine aria-hidden="true" />
        {t("root.tests.results.pendingManual", { count: pendingManual })}
      </Badge>
    );
  }

  switch (state) {
    case "GRADED":
      return null;
    case "IN_PROGRESS":
      return (
        <Badge variant="neutral" size="xs">
          <CircleDashed aria-hidden="true" />
          {t("root.tests.results.state.IN_PROGRESS")}
        </Badge>
      );
    case "NOT_STARTED":
      return (
        <Badge variant="neutral" size="xs">
          <Users aria-hidden="true" />
          {t("root.tests.results.state.NOT_STARTED")}
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size="xs">
          {t(`root.tests.results.state.${state}`)}
        </Badge>
      );
  }
}

/** One decimal, and no trailing `.0` — a mean of exactly 28 reads as `28`. */
function round(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
