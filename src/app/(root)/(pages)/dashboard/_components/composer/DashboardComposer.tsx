"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Check,
  HelpCircle,
  Plus,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { DashboardAvailability } from "@/app/(root)/_utils/getDashboard";
import {
  deriveStage,
  packRows,
  spanForCount,
  SPAN_CLASS,
  type DashboardStage,
} from "@/app/(root)/_lib/dashboard-layout";
import type {
  ClassPerformance,
  DashboardFeed,
  Distributions,
  ScoreTrend,
  StaffDashboardSummary,
  StudentDashboardSummary,
  Submissions,
} from "@/app/(root)/_lib/dashboard.schemas";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Surface from "@/components/ui/Surface";
import AiImportCta from "@/app/(root)/_components/AiImportCta";
import SupportCta from "@/app/(root)/_components/SupportCta";
import { cn } from "@/lib/utils";
import { EMPTY_ART, type EmptyArtKind } from "../EmptyArt";
import JoinCodeChip from "../JoinCodeChip";
import Panel from "../Panel";
import GradeColumns from "./GradeColumns";
import Sparkline from "./Sparkline";
import TrendChart from "./TrendChart";

export type DashboardComposerContext = {
  role: SchoolRole;
  fullName: string | null;
  schoolName: string | null;
  studentJoinCode: string | null;
  availability: DashboardAvailability;
  summary: StaffDashboardSummary | StudentDashboardSummary | null;
  trend: ScoreTrend | null;
  distributions: Distributions | null;
  submissions: Submissions | null;
  classPerformance: ClassPerformance | null;
  feed: DashboardFeed | null;
  studentClasses: Array<{ id: string; name: string }>;
  availableClasses: number;
  pendingRequests: number;
};

type ModuleProps = { ctx: DashboardComposerContext; stage: DashboardStage };
type Placement = { priority: number; span: number; minSpan?: number; maxSpan?: number };
type ModuleEntry = {
  id: string;
  roles: SchoolRole[];
  resolve: (ctx: DashboardComposerContext, stage: DashboardStage) => Placement | null;
  Component: (props: ModuleProps) => ReactNode;
};

function firstName(fullName: string | null) {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}

function isStudentSummary(
  summary: DashboardComposerContext["summary"],
): summary is StudentDashboardSummary {
  return summary != null && "enrolledCourses" in summary;
}

function staffSummary(ctx: DashboardComposerContext) {
  return isStudentSummary(ctx.summary) ? null : ctx.summary;
}

/**
 * Month-over-month movement of the average, in percentage points. `null` until
 * a second month exists — a delta against nothing is not a delta.
 */
function trendDelta(trend: ScoreTrend | null): number | null {
  const points = trend?.points;
  if (!points || points.length < 2) return null;
  return Math.round(points[points.length - 1].avg - points[points.length - 2].avg);
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header({ ctx, stage }: ModuleProps) {
  const { t } = useTranslation();
  const name = firstName(ctx.fullName);
  const roleKey = ctx.role.toLowerCase();
  const staff = ctx.role === "ADMIN" || ctx.role === "TEACHER";

  const roleLine = ctx.schoolName
    ? t("root.dashboard.roleEyebrow", {
        role: t(`root.dashboard.roles.${roleKey}`),
        school: ctx.schoolName,
      })
    : t(`root.dashboard.roles.${roleKey}`);
  const stageLine = t(`root.dashboard.stageSubtitle.${stage}.${roleKey}`, {
    defaultValue: t(`root.dashboard.roleSubtitle.${roleKey}`),
  });

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="type-title text-foreground">
          {name
            ? t("root.dashboard.welcome.title", { name })
            : t("root.dashboard.welcome.titleGeneric")}
        </h1>
        {/* One line carries the who and the where-things-stand; the old violet
            eyebrow above the title shouted the quietest fact on the page. */}
        <p className="mt-1.5 text-15 text-muted-foreground">
          {roleLine} · {stageLine}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ctx.role === "ADMIN" && ctx.pendingRequests > 0 ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/school">
              <UserPlus className="h-4 w-4" />
              {t("root.dashboard.attention.requests")}
              <span className="numeric font-semibold">{ctx.pendingRequests}</span>
            </Link>
          </Button>
        ) : null}
        {ctx.role === "ADMIN" && ctx.studentJoinCode && stage === "active" ? (
          <JoinCodeChip code={ctx.studentJoinCode} />
        ) : null}
        {staff && stage !== "fresh" ? (
          <Button asChild size="sm">
            <Link href="/tests">
              <Plus className="h-4 w-4" />
              {t("root.dashboard.actions.createTest")}
            </Link>
          </Button>
        ) : null}
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat tiles                                                                 */
/* -------------------------------------------------------------------------- */

type Tile = {
  key: string;
  value: string;
  available: boolean;
  /** Tiles that stand for work link to where the work is done. */
  href?: string;
  delta?: number | null;
  spark?: number[];
  /**
   * Which form the tile takes. Four identical number-boxes made a grading
   * backlog, a headcount, and a rate all read as the same object; each figure
   * now wears the shape of what it measures (v5.1, maintainer request).
   */
  variant?: "action" | "population" | "trend" | "ring" | "tally" | "now";
  /** population: one segment per class, proportional to its student count. */
  segments?: { id: string; label: string; count: number }[];
  /** ring: the rate as 0–1. */
  rate?: number;
  /** tally / action: the figure as a number, for drawing and emphasis. */
  count?: number;
};

/** population strip: the headcount drawn as its classes, chart hues cycling. */
function PopulationStrip({ segments }: { segments: { id: string; label: string; count: number }[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (!total) return null;
  return (
    <div className="mt-2 flex h-1.5 w-full gap-0.5" aria-hidden>
      {segments.map((s, i) => (
        <span
          key={s.id}
          title={`${s.label} · ${s.count}`}
          className="h-full rounded-[var(--radius-pill)]"
          style={{
            width: `${(s.count / total) * 100}%`,
            background: `var(--chart-${(i % 5) + 1})`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

/** ring: a rate drawn as how much of the circle is filled. */
function CompletionRing({ rate }: { rate: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, rate));
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" aria-hidden className="shrink-0 -rotate-90">
      <circle cx={20} cy={20} r={r} fill="none" stroke="var(--muted)" strokeWidth={5} />
      <circle
        cx={20}
        cy={20}
        r={r}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={`${c * filled} ${c}`}
      />
    </svg>
  );
}

/** tally: each completed test is a dot — a record of work, not just a figure. */
function TallyDots({ count }: { count: number }) {
  const shown = Math.min(count, 21);
  if (!shown) return null;
  return (
    <div className="mt-2 flex max-w-[9.5rem] flex-wrap gap-1" aria-hidden>
      {Array.from({ length: shown }, (_, i) => (
        <span key={i} className="size-1.5 rounded-full bg-success/60" />
      ))}
      {count > shown ? (
        <span className="type-caption -my-0.5 leading-none text-muted-foreground">+{count - shown}</span>
      ) : null}
    </div>
  );
}

/**
 * Four figures, not six.
 *
 * The strip used to hold every count the API returned — students, classes,
 * teachers, assessments, average, completion — six equal tiles in which a
 * grading backlog carried the same weight as a headcount that changes twice a
 * year. Four is the number a person actually scans: the work (grading, due),
 * the people, and the two measures of how it is going. Inventory the page
 * dropped (class and assessment counts) still lives one click away on the
 * pages that own it, and the classes table below carries its own row count.
 *
 * v5.1: the four no longer share one anonymous body. The work tile is the one
 * pressable object and goes accent-hot while anything waits; the headcount is
 * drawn as its classes (population strip); the average leads with its trend
 * line; completion is a filled ring; a student's finished tests are a tally of
 * dots and their in-progress work carries a live dot. Same data, but each
 * figure now has the shape of what it measures instead of four equal boxes.
 */
function StatTiles({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const trendValues = ctx.trend?.points.map((point) => point.avg) ?? [];
  const delta = ctx.availability.hasResults ? trendDelta(ctx.trend) : null;
  const spark = trendValues.length >= 3 ? trendValues : undefined;
  // One measure per tile: when the monthly series exists, the average tile's
  // value, delta, and sparkline all read from it — the value is the latest
  // month, which is what "vs last month" is a delta *of*. Mixing the all-time
  // average with a monthly delta put two different numbers under one label.
  const latestMonthAvg = trendValues.length
    ? Math.round(trendValues[trendValues.length - 1])
    : null;

  let tiles: Tile[] = [];

  if (isStudentSummary(ctx.summary)) {
    const summary = ctx.summary;
    tiles = [
      {
        key: "due",
        value: String(summary.dueThisWeek),
        available: true,
        href: "/assignments/exams",
        variant: "action",
        count: summary.dueThisWeek,
      },
      {
        key: "inProgress",
        value: String(summary.inProgressAssessments ?? 0),
        available: true,
        variant: "now",
        count: summary.inProgressAssessments ?? 0,
      },
      {
        key: "completed",
        value: String(summary.completedAssessments ?? 0),
        available: true,
        variant: "tally",
        count: summary.completedAssessments ?? 0,
      },
      {
        key: "average",
        value: ctx.availability.hasResults
          ? `${latestMonthAvg ?? Math.round(summary.myAverage)}%`
          : "—",
        available: ctx.availability.hasResults,
        delta,
        spark,
        variant: "trend",
      },
    ];
  } else {
    const summary = staffSummary(ctx);
    const classSegments = (ctx.classPerformance?.classes ?? [])
      .filter((row) => row.studentCount > 0)
      .map((row) => ({ id: row.classId, label: row.className, count: row.studentCount }));
    tiles = [
      ctx.role === "TEACHER"
        ? {
            key: "pendingGrading",
            value: String(summary?.pendingGrading ?? 0),
            available: true,
            href: "/tests",
            variant: "action",
            count: summary?.pendingGrading ?? 0,
          }
        : {
            key: "students",
            value: String(summary?.students ?? 0),
            available: true,
            variant: "population",
            segments: classSegments,
          },
      ctx.role === "TEACHER"
        ? {
            key: "students",
            value: String(summary?.students ?? 0),
            available: true,
            variant: "population",
            segments: classSegments,
          }
        : { key: "teachers", value: String(summary?.teachers ?? 0), available: true },
      {
        key: "average",
        value: ctx.availability.hasResults
          ? `${latestMonthAvg ?? Math.round(summary?.avgScore ?? 0)}%`
          : "—",
        available: ctx.availability.hasResults,
        delta,
        spark,
        variant: "trend",
      },
      {
        key: "completion",
        value:
          summary?.completionRate != null ? `${Math.round(summary.completionRate)}%` : "—",
        available: summary?.completionRate != null,
        variant: "ring",
        rate: summary?.completionRate != null ? summary.completionRate / 100 : undefined,
      },
    ];
  }

  const group = ctx.role.toLowerCase();
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {tiles.map((tile) => {
        // The one pressable tile: work waiting. Accent-tinted while there is
        // any, back to a resting card when the desk is clear.
        const hot = tile.variant === "action" && (tile.count ?? 0) > 0;
        const label = t(`root.dashboard.kpi.${group}.${tile.key}`);

        const body = (
          <>
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "type-caption truncate font-medium",
                  hot ? "text-accent-foreground/75" : "text-muted-foreground",
                )}
              >
                {label}
              </p>
              {tile.variant === "action" ? (
                hot ? (
                  <ArrowUpRight className="size-4 shrink-0 text-accent-foreground" aria-hidden />
                ) : (
                  <Check className="size-4 shrink-0 text-success" aria-hidden />
                )
              ) : null}
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              {/* Proportional figures on purpose: tabular digits give every
                  numeral a `0`'s width, which reads loose at display size.
                  Tabular stays in the tables, where columns must align. */}
              <p
                className={cn(
                  "text-2xl leading-tight font-bold tracking-tight",
                  hot
                    ? "text-accent-foreground"
                    : tile.available
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {tile.value}
                {tile.variant === "now" && (tile.count ?? 0) > 0 ? (
                  <span
                    aria-hidden
                    className="mb-0.5 ml-2 inline-block size-2 rounded-full bg-info ring-4 ring-info/15"
                  />
                ) : null}
              </p>
              {tile.variant === "trend" && tile.spark ? (
                <Sparkline values={tile.spark} width={104} height={30} />
              ) : null}
              {tile.variant === "ring" && tile.rate != null ? (
                <CompletionRing rate={tile.rate} />
              ) : null}
            </div>
            {tile.variant === "population" && tile.segments?.length ? (
              <PopulationStrip segments={tile.segments} />
            ) : null}
            {tile.variant === "tally" ? <TallyDots count={tile.count ?? 0} /> : null}
            {tile.delta != null && tile.delta !== 0 ? (
              <p className="mt-1 flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    tile.delta > 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {tile.delta > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {t("root.dashboard.kpi.deltaPoints", {
                    value: tile.delta > 0 ? `+${tile.delta}` : String(tile.delta),
                  })}
                </span>
                <span className="truncate text-muted-foreground">
                  {t("root.dashboard.kpi.deltaVsLastMonth")}
                </span>
              </p>
            ) : null}
          </>
        );

        return tile.href ? (
          <Surface
            key={tile.key}
            as={Link}
            href={tile.href}
            interactive
            className={cn(
              "block px-4 py-3.5",
              hot && "border-accent-foreground/25 bg-accent hover:bg-accent",
            )}
          >
            {body}
          </Surface>
        ) : (
          <Surface key={tile.key} className="px-4 py-3.5">
            {body}
          </Surface>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                              */
/* -------------------------------------------------------------------------- */

function EmptyNote({
  art,
  title,
  description,
  href,
  action,
}: {
  /** Which illustration previews the data this panel will hold. */
  art: EmptyArtKind;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  const Art = EMPTY_ART[art];
  return (
    // `flex-1` + centring: the panel body already stretches to the row height,
    // so the empty state sits in the middle of whatever space it inherits
    // instead of pinning to the top and leaving a gap below.
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-3 text-center text-muted-foreground">
      <Art />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-[42ch] text-xs leading-5 text-balance text-muted-foreground">
        {description}
      </p>
      {href && action ? (
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href={href}>{action}</Link>
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Setup checklist — the module that leads an unfinished workspace            */
/* -------------------------------------------------------------------------- */

type ChecklistItem = {
  key: string;
  done: boolean;
  href: string;
};

function SetupChecklist({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const summary = staffSummary(ctx);
  const availability = ctx.availability;

  const items: ChecklistItem[] =
    ctx.role === "ADMIN"
      ? [
          { key: "class", done: availability.hasClasses, href: "/groups" },
          { key: "teachers", done: (summary?.teachers ?? 0) > 0, href: "/school" },
          { key: "students", done: availability.hasStudents, href: "/school" },
          {
            key: "assessment",
            done: (summary?.assessments ?? summary?.exams ?? 0) > 0,
            href: "/tests",
          },
          { key: "results", done: availability.hasResults, href: "/tests" },
        ]
      : ctx.role === "TEACHER"
        ? [
            { key: "classes", done: availability.hasClasses, href: "/groups" },
            { key: "students", done: availability.hasStudents, href: "/groups" },
            {
              key: "assessment",
              done: (summary?.assessments ?? summary?.exams ?? 0) > 0,
              href: "/tests",
            },
            { key: "results", done: availability.hasResults, href: "/tests" },
          ]
        : [
            { key: "join", done: availability.hasClasses, href: "/groups" },
            { key: "upcoming", done: availability.hasUpcoming, href: "/assignments/exams" },
            { key: "results", done: availability.hasResults, href: "/assignments/exams" },
          ];

  const completed = items.filter((item) => item.done).length;
  const roleKey = ctx.role.toLowerCase();
  const next = items.find((item) => !item.done);

  return (
    <Panel
      title={t("root.dashboard.checklist.title")}
      aside={t("root.dashboard.checklist.progress", {
        completed,
        total: items.length,
      })}
    >
      <div
        className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-label={t("root.dashboard.checklist.title")}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${(completed / items.length) * 100}%` }}
        />
      </div>

      <ol className="space-y-1">
        {items.map((item) => {
          const isNext = item.key === next?.key;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60",
                  isNext && "bg-accent/60",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    item.done
                      ? "border-success bg-success text-success-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {item.done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      item.done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {t(`root.dashboard.checklist.${roleKey}.${item.key}.title`)}
                  </span>
                  {isNext ? (
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {t(`root.dashboard.checklist.${roleKey}.${item.key}.description`)}
                    </span>
                  ) : null}
                </span>
                {!item.done ? (
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Invite / join-code panel — real estate that earns its place while empty    */
/* -------------------------------------------------------------------------- */

function InvitePanel({ ctx }: ModuleProps) {
  const { t } = useTranslation();

  return (
    <Panel title={t("root.dashboard.invite.title")}>
      <p className="text-sm leading-6 text-muted-foreground">
        {t("root.dashboard.invite.description")}
      </p>

      {ctx.studentJoinCode ? (
        <JoinCodeChip code={ctx.studentJoinCode} className="mt-4 w-full" />
      ) : null}

      <div className="mt-4 grid gap-2">
        <Button asChild variant="outline" className="justify-start">
          <Link href="/school">
            <UserPlus className="h-4 w-4" />
            {t("root.dashboard.invite.inviteTeacher")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start">
          <Link href="/school">
            <Users className="h-4 w-4" />
            {t("root.dashboard.invite.manageMembers")}
          </Link>
        </Button>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Classes table — one row per class answers "how are my classes doing"       */
/* -------------------------------------------------------------------------- */

/**
 * The one classes module.
 *
 * This page used to answer the same question three times: a roster table with
 * averages, a bar chart of the same averages, and a second chart of the week's
 * submissions — three panels, one subject. A class is a row; everything known
 * about it sits on that row: size, average (with the magnitude drawn in), how
 * much of the assigned work exists as a final result, and what this week's
 * submissions look like. The row links to the class, where the real detail is.
 */
function ClassesTable({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const classes = [...(ctx.classPerformance?.classes ?? [])]
    .sort((left, right) => left.className.localeCompare(right.className))
    .slice(0, 8);
  const weekByClass = new Map(
    (ctx.submissions?.byClass ?? []).map((row) => [row.classId, row]),
  );
  const hasWeek = classes.some((row) => {
    const week = weekByClass.get(row.classId);
    return week && week.onTime + week.late + week.missing > 0;
  });

  const weekLabels = {
    onTime: t("root.dashboard.modules.submissions.onTime"),
    late: t("root.dashboard.modules.submissions.late"),
    missing: t("root.dashboard.modules.submissions.missing"),
  };

  return (
    <Panel
      title={t("root.dashboard.roster.title")}
      aside={
        <Link
          href="/groups"
          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("root.dashboard.roster.viewAll")}
        </Link>
      }
      bodyClassName="p-0 md:p-0"
    >
      {classes.length ? (
        <div className="flex flex-1 flex-col">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground md:px-6">
                    {t("root.dashboard.roster.class")}
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    {t("root.dashboard.roster.students")}
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    {t("root.dashboard.roster.average")}
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                    {t("root.dashboard.roster.completion")}
                  </th>
                  {hasWeek ? (
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground md:px-6">
                      {t("root.dashboard.roster.thisWeek")}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {classes.map((row) => {
                  const week = weekByClass.get(row.classId);
                  const weekTotal = week ? week.onTime + week.late + week.missing : 0;
                  const average =
                    row.averageScore != null ? Math.round(row.averageScore) : null;
                  return (
                    <tr key={row.classId} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 md:px-6">
                        <Link
                          href={`/groups/${row.classId}`}
                          className="truncate font-medium text-foreground hover:text-primary"
                        >
                          {row.className}
                        </Link>
                      </td>
                      <td className="numeric px-3 py-3 text-right text-muted-foreground">
                        {row.studentCount}
                      </td>
                      <td className="px-3 py-3">
                        {average != null ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* The magnitude, drawn: track and fill from the
                                same ramp, so the bar reads at a glance without
                                replacing the number beside it. */}
                            <div
                              aria-hidden
                              className="h-1.5 w-14 overflow-hidden rounded-full bg-[var(--chart-1-tint)]"
                            >
                              <div
                                className="h-full rounded-full bg-[var(--chart-1)]"
                                style={{ width: `${average}%` }}
                              />
                            </div>
                            <span className="numeric w-10 shrink-0 text-right font-semibold text-foreground">
                              {average}%
                            </span>
                          </div>
                        ) : (
                          <span className="numeric block text-right text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="numeric px-3 py-3 text-right text-muted-foreground">
                        {row.completionRate != null
                          ? `${Math.round(row.completionRate)}%`
                          : "—"}
                      </td>
                      {hasWeek ? (
                        <td className="px-5 py-3 md:px-6">
                          {week && weekTotal > 0 ? (
                            <>
                              <div
                                aria-hidden
                                title={`${weekLabels.onTime} ${week.onTime} · ${weekLabels.late} ${week.late} · ${weekLabels.missing} ${week.missing}`}
                                className="ml-auto flex h-1.5 w-24 gap-[2px]"
                              >
                                {week.onTime > 0 ? (
                                  <span
                                    className="min-w-[3px] rounded-full bg-success"
                                    style={{ flexGrow: week.onTime }}
                                  />
                                ) : null}
                                {week.late > 0 ? (
                                  <span
                                    className="min-w-[3px] rounded-full bg-warning"
                                    style={{ flexGrow: week.late }}
                                  />
                                ) : null}
                                {week.missing > 0 ? (
                                  <span
                                    className="min-w-[3px] rounded-full bg-destructive"
                                    style={{ flexGrow: week.missing }}
                                  />
                                ) : null}
                              </div>
                              <span className="sr-only">
                                {`${weekLabels.onTime} ${week.onTime}, ${weekLabels.late} ${week.late}, ${weekLabels.missing} ${week.missing}`}
                              </span>
                            </>
                          ) : (
                            <span className="block text-right text-muted-foreground">—</span>
                          )}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {hasWeek ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-5 py-2.5 text-2xs text-muted-foreground md:px-6">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-full bg-success" />
                {weekLabels.onTime}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-full bg-warning" />
                {weekLabels.late}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="h-2 w-2 rounded-full bg-destructive" />
                {weekLabels.missing}
              </span>
              <span className="ml-auto">{t("root.dashboard.modules.submissions.range")}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-5 md:p-6">
          <EmptyNote
            art="list"
            title={t("root.dashboard.roster.emptyTitle")}
            description={t("root.dashboard.roster.emptyDescription")}
            href="/groups"
            action={t("root.dashboard.roster.emptyAction")}
          />
        </div>
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Student next-up                                                            */
/* -------------------------------------------------------------------------- */

function NextUp({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const next = (ctx.feed?.upcoming ?? [])[0] ?? null;

  return (
    <Panel title={t("root.dashboard.nextUp.title")} align="center">
      {next ? (
        <div className="flex h-full flex-col">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
            <CalendarClock className="h-5 w-5" />
          </span>
          <p className="mt-4 text-lg font-semibold leading-snug text-foreground">
            {next.title}
          </p>
          <RelativeTime
            date={next.dueAt}
            className="mt-1 block text-sm text-muted-foreground"
          />
          {next.href ? (
            <Button asChild size="sm" className="mt-4 self-start">
              <Link href={next.href}>
                {t("root.dashboard.nextUp.open")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <EmptyNote
          art="calendar"
          title={t("root.dashboard.nextUp.emptyTitle")}
          description={t("root.dashboard.nextUp.emptyDescription")}
        />
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Charts                                                                     */
/* -------------------------------------------------------------------------- */

function PerformanceTrend({ ctx }: ModuleProps) {
  const { t } = useTranslation();

  return (
    <Panel
      title={
        ctx.role === "STUDENT"
          ? t("root.dashboard.trend.titleStudent")
          : t("root.dashboard.trend.titleStaff")
      }
      aside={ctx.trend?.points.length ? t("root.dashboard.trend.caption") : undefined}
    >
      {ctx.trend?.points.length ? (
        <TrendChart points={ctx.trend.points} />
      ) : (
        <EmptyNote
          art="trend"
          title={t("root.dashboard.modules.trend.emptyTitle")}
          description={t("root.dashboard.modules.trend.emptyDesc")}
        />
      )}
    </Panel>
  );
}

function GradeDistribution({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const grades = ctx.distributions?.grades ?? [];
  const total = grades.reduce((sum, grade) => sum + grade.count, 0);
  return (
    <Panel
      title={t("root.dashboard.modules.distribution.title")}
      aside={
        total ? `${total} ${t("root.dashboard.modules.distribution.center")}` : undefined
      }
      align={total ? "start" : "center"}
    >
      {total ? (
        <GradeColumns grades={grades} />
      ) : (
        <EmptyNote
          art="calendar"
          title={t("root.dashboard.modules.distribution.emptyTitle")}
          description={t("root.dashboard.modules.distribution.emptyDescription")}
        />
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Feeds                                                                      */
/* -------------------------------------------------------------------------- */

function Upcoming({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const items = (ctx.feed?.upcoming ?? []).slice(0, 6);
  return (
    <Panel
      title={t("root.dashboard.upcoming.title")}
      bodyClassName="p-2.5 md:p-3"
      align={items.length > 2 ? "start" : "center"}
    >
      {items.length ? (
        <ul className="space-y-1">
          {items.map((item) => {
            const content = (
              <>
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <RelativeTime
                    date={item.dueAt}
                    className="mt-0.5 block text-xs text-muted-foreground"
                  />
                </div>
                {item.href ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : null}
              </>
            );
            return (
              <li key={`${item.kind}-${item.id}`}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl px-3 py-2.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyNote
          art="calendar"
          title={t("root.dashboard.upcoming.emptyTitle")}
          description={t("root.dashboard.upcoming.emptyDescription")}
        />
      )}
    </Panel>
  );
}

function RecentActivity({ ctx }: ModuleProps) {
  const { t, i18n } = useTranslation();
  const items = (ctx.feed?.recent ?? []).slice(0, 4);
  return (
    <Panel
      title={t("root.dashboard.modules.activity.title")}
      bodyClassName="p-2 md:p-2.5"
      align={items.length > 2 ? "start" : "center"}
      aside={
        items.length ? (
          <Link
            href="/notifications"
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("root.dashboard.modules.activity.seeAll")}
          </Link>
        ) : null
      }
    >
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href ?? "/notifications"}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-muted/60"
              >
                <Bell className="size-3.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-13 text-foreground">
                  {i18n.exists(item.title) ? t(item.title) : item.title}
                </span>
                <RelativeTime
                  date={item.at}
                  className="shrink-0 text-2xs text-muted-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote
          art="bell"
          title={t("root.dashboard.modules.activity.emptyTitle")}
          description={t("root.dashboard.modules.activity.emptyDescription")}
        />
      )}
    </Panel>
  );
}

function StudentClasses({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  return (
    <Panel
      title={t("root.dashboard.student.myClasses.title")}
      align={ctx.studentClasses.length > 3 ? "start" : "center"}
    >
      {ctx.studentClasses.length ? (
        <ul className="divide-y divide-border">
          {ctx.studentClasses.slice(0, 6).map((classItem) => (
            <li key={classItem.id}>
              <Link
                href={`/groups/${classItem.id}`}
                className="flex items-center gap-3 py-3 hover:text-primary"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-bold text-primary">
                  {classItem.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {classItem.name}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote
          art="list"
          title={t("root.dashboard.gettingStarted.student.title")}
          description={t("root.dashboard.gettingStarted.student.description")}
          href="/groups"
          action={t("root.dashboard.gettingStarted.student.action")}
        />
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Import a test from a PDF                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The dashboard's entry into the PDF importer.
 *
 * Unlike the other shortcuts this one cannot be a bare link: an import
 * belongs to a class, and the dashboard is the one surface with no class in
 * context. So the panel asks for the class here rather than dropping the
 * teacher on a screen that immediately asks them to go back and pick one.
 *
 * It renders nothing when there are no classes yet — an importer with nowhere
 * to import *to* is an invitation to a dead end, and the setup checklist is
 * already telling them to create a class.
 */
function ImportTestPanel({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const classes = ctx.classPerformance?.classes ?? [];
  const [classId, setClassId] = useState(() => classes[0]?.classId ?? "");

  if (!classes.length) return null;

  const selected = classes.some((row) => row.classId === classId)
    ? classId
    : classes[0].classId;

  return (
    <AiImportCta
      classId={selected}
      className="h-full"
      secondaryAction={
        classes.length > 1 ? (
          <Select value={selected} onValueChange={setClassId}>
            <SelectTrigger
              className="w-full @md:w-auto @md:min-w-[10rem]"
              aria-label={t("root.dashboard.importTest.classLabel")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classes.map((row) => (
                <SelectItem key={row.classId} value={row.classId}>
                  {row.className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null
      }
    />
  );
}

function DiscoverClasses({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  return (
    <Panel title={t("root.dashboard.discover.title")}>
      <EmptyNote
        art="list"
        title={t("root.dashboard.discover.heading", { count: ctx.availableClasses })}
        description={t("root.dashboard.discover.description")}
        href="/groups"
        action={t("root.dashboard.discover.action")}
      />
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Getting help                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Reaching a person: support, reporting something broken, and replaying the
 * onboarding tour. Every role gets it, and it sits at the foot on purpose —
 * help is what you look for after the thing you came to do. The tour replay
 * lives here with the rest of the help rather than in the header, where it
 * spent every visit next to the page's one real action.
 */
function GettingHelp() {
  const { t } = useTranslation();
  return (
    <div>
      <SupportCta />
      <div className="mt-1.5 flex justify-end">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/onboarding?replay=1">
            <HelpCircle className="h-4 w-4" />
            {t("root.dashboard.replayOnboarding")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every module declares which roles it belongs to and, given the live context
 * and derived stage, whether it appears and how wide it wants to be.
 *
 * Widths are computed from how much content the module will actually render,
 * not from a fixed table. A feed holding six entries asks for more room than
 * the same feed holding none, so a sparse panel steps aside rather than sitting
 * next to a dense one with a hollow underneath. `packRows` then reconciles each
 * row to exactly 12 columns.
 */
const REGISTRY: ModuleEntry[] = [
  {
    id: "setup",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: (_ctx, stage) =>
      stage === "active" ? null : { priority: 100, span: 8, minSpan: 6 },
    Component: SetupChecklist,
  },
  {
    id: "invite",
    roles: ["ADMIN"],
    resolve: (ctx, stage) =>
      stage !== "active" && ctx.studentJoinCode
        ? { priority: 99, span: 4, minSpan: 3, maxSpan: 6 }
        : null,
    Component: InvitePanel,
  },
  {
    id: "discover",
    roles: ["STUDENT"],
    resolve: (ctx, stage) =>
      stage !== "active" && ctx.availableClasses > 0
        ? { priority: 99, span: 4, minSpan: 3, maxSpan: 6 }
        : null,
    Component: DiscoverClasses,
  },
  {
    id: "kpis",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: () => ({ priority: 90, span: 12 }),
    Component: StatTiles,
  },
  {
    id: "next-up",
    roles: ["STUDENT"],
    resolve: (ctx) =>
      ctx.availability.hasUpcoming ? { priority: 85, span: 4, minSpan: 4, maxSpan: 5 } : null,
    Component: NextUp,
  },
  {
    id: "trend",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: (ctx, stage) =>
      stage === "fresh"
        ? null
        : {
            priority: 80,
            // A chart with no points is a placeholder; it should not hold seven
            // columns while the panel beside it overflows.
            span: spanForCount(ctx.trend?.points.length ?? 0, { empty: 5, low: 6, high: 7 }),
            minSpan: 4,
            maxSpan: 8,
          },
    Component: PerformanceTrend,
  },
  {
    id: "distribution",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: (ctx) =>
      ctx.availability.hasResults ? { priority: 78, span: 4, minSpan: 4, maxSpan: 6 } : null,
    Component: GradeDistribution,
  },
  {
    id: "classes-table",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx) => {
      const rows = ctx.classPerformance?.classes.length ?? 0;
      return ctx.availability.hasClasses
        ? {
            priority: 72,
            // A table is the one module that genuinely needs width once it has
            // rows to show; with one class it does not.
            span: spanForCount(rows, { empty: 5, low: 7, high: 8 }, 2),
            minSpan: 6,
          }
        : null;
    },
    Component: ClassesTable,
  },
  {
    id: "classes",
    roles: ["STUDENT"],
    resolve: (ctx) => ({
      priority: 64,
      span: spanForCount(ctx.studentClasses.length, { empty: 4, low: 4, high: 6 }, 2),
      minSpan: 3,
      maxSpan: 7,
    }),
    Component: StudentClasses,
  },
  {
    id: "upcoming",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: (ctx) => ({
      priority: 55,
      span: spanForCount(ctx.feed?.upcoming.length ?? 0, { empty: 4, low: 5, high: 6 }),
      minSpan: 3,
      maxSpan: 7,
    }),
    Component: Upcoming,
  },
  {
    id: "activity",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: (ctx) => ({
      priority: 54,
      span: spanForCount(ctx.feed?.recent.length ?? 0, { empty: 4, low: 5, high: 6 }),
      minSpan: 3,
      maxSpan: 8,
    }),
    Component: RecentActivity,
  },
  {
    id: "import-test",
    roles: ["ADMIN", "TEACHER"],
    // Above the feeds, below the figures. Down beside the support panel it was
    // the last thing on the page before the footer, which is the wrong place
    // for the one shortcut that saves a teacher an evening of typing; at the
    // very top it would shout over the numbers they came to read.
    resolve: (ctx) =>
      (ctx.classPerformance?.classes ?? []).length
        ? { priority: 60, span: 4, minSpan: 3, maxSpan: 6 }
        : null,
    Component: ImportTestPanel,
  },
  {
    id: "support",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    // Last on the page on purpose: help is what you look for after the thing
    // you came to do, so it sits at the foot rather than competing with the
    // figures at the top.
    resolve: () => ({ priority: 10, span: 12 }),
    Component: GettingHelp,
  },
];

export default function DashboardComposer({
  context,
}: {
  context: DashboardComposerContext;
}) {
  const stage = deriveStage(context.role, context.availability);

  const selected = REGISTRY.filter((entry) => entry.roles.includes(context.role))
    .map((entry) => {
      const placement = entry.resolve(context, stage);
      return placement ? { ...entry, ...placement } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => right.priority - left.priority);

  const items = packRows(selected);

  return (
    <div className="space-y-6">
      <Header ctx={context} stage={stage} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {items.map(({ id, span, Component }) => (
          <div key={id} className={cn("min-w-0", SPAN_CLASS[span])}>
            <Component ctx={context} stage={stage} />
          </div>
        ))}
      </div>
    </div>
  );
}
