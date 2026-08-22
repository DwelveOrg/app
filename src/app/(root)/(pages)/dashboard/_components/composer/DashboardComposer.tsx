"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarClock,
  Check,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  School,
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
  GradeBucket,
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
import ChartTypeToggle, { useChartType } from "./ChartTypeToggle";
import ClassPerformanceChart from "./ClassPerformanceChart";
import SegmentDonut from "./SegmentDonut";
import SubmissionsChart from "./SubmissionsChart";
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

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header({ ctx, stage }: ModuleProps) {
  const { t } = useTranslation();
  const name = firstName(ctx.fullName);
  const roleKey = ctx.role.toLowerCase();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="type-micro text-primary">
          {ctx.schoolName
            ? t("root.dashboard.roleEyebrow", {
                role: t(`root.dashboard.roles.${roleKey}`),
                school: ctx.schoolName,
              })
            : t(`root.dashboard.roles.${roleKey}`)}
        </p>
        <h1 className="mt-2 type-title text-foreground">
          {name
            ? t("root.dashboard.welcome.title", { name })
            : t("root.dashboard.welcome.titleGeneric")}
        </h1>
        <p className="mt-1.5 text-15 text-muted-foreground">
          {t(`root.dashboard.stageSubtitle.${stage}.${roleKey}`, {
            defaultValue: t(`root.dashboard.roleSubtitle.${roleKey}`),
          })}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/onboarding?replay=1">
            <HelpCircle className="h-4 w-4" />
            {t("root.dashboard.replayOnboarding")}
          </Link>
        </Button>
        {ctx.role === "ADMIN" && ctx.studentJoinCode && stage === "active" ? (
          <JoinCodeChip code={ctx.studentJoinCode} />
        ) : null}
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* KPI strip                                                                  */
/* -------------------------------------------------------------------------- */

type Kpi = { key: string; value: string; available: boolean };

function KpiStrip({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  let tiles: Kpi[] = [];

  if (isStudentSummary(ctx.summary)) {
    const summary = ctx.summary;
    tiles = [
      { key: "classes", value: String(summary.enrolledCourses), available: true },
      { key: "available", value: String(ctx.availableClasses), available: true },
      { key: "due", value: String(summary.dueThisWeek), available: true },
      { key: "completed", value: String(summary.completedAssessments ?? 0), available: true },
      { key: "inProgress", value: String(summary.inProgressAssessments ?? 0), available: true },
      {
        key: "average",
        value: ctx.availability.hasResults ? `${Math.round(summary.myAverage)}%` : "—",
        available: ctx.availability.hasResults,
      },
    ];
  } else {
    const summary = staffSummary(ctx);
    const teacher = ctx.role === "TEACHER";
    tiles = [
      { key: "students", value: String(summary?.students ?? 0), available: true },
      { key: "classes", value: String(summary?.classes ?? 0), available: true },
      teacher
        ? {
            key: "pendingGrading",
            value: String(summary?.pendingGrading ?? 0),
            available: true,
          }
        : { key: "teachers", value: String(summary?.teachers ?? 0), available: true },
      {
        key: "assessments",
        value: String(summary?.assessments ?? summary?.exams ?? 0),
        available: true,
      },
      {
        key: "average",
        value: ctx.availability.hasResults ? `${Math.round(summary?.avgScore ?? 0)}%` : "—",
        available: ctx.availability.hasResults,
      },
      {
        key: "completion",
        value:
          summary?.completionRate != null ? `${Math.round(summary.completionRate)}%` : "—",
        available: summary?.completionRate != null,
      },
    ];
  }

  const group = ctx.role.toLowerCase();
  return (
    // Six figures, sized to the figures.
    //
    // The tile used to carry `min-h-28` and a `mt-3` gap: a 16px label over a
    // 30px number inside 32px of padding is 78px of content held in 112px of
    // box, so a third of every tile — and a third of the strip across the whole
    // width of the page — was reserved for nothing. Nothing filled it, because
    // there is nothing else a KPI tile holds. Letting the tile size to its own
    // content gives the page back ~40px without removing a single number.
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => (
        <Surface key={tile.key} className="px-4 py-3.5">
          <p className="type-caption truncate font-medium text-muted-foreground">
            {t(`root.dashboard.kpi.${group}.${tile.key}`)}
          </p>
          <p
            className={cn(
              "numeric mt-1 text-2xl leading-tight font-bold tracking-tight",
              tile.available ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {tile.value}
          </p>
        </Surface>
      ))}
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
/* Needs attention — derived only from figures the API returned               */
/* -------------------------------------------------------------------------- */

function NeedsAttention({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const summary = staffSummary(ctx);
  const pendingGrading = summary?.pendingGrading ?? 0;
  const missing = (ctx.submissions?.byClass ?? []).reduce(
    (total, row) => total + row.missing,
    0,
  );
  const late = (ctx.submissions?.byClass ?? []).reduce((total, row) => total + row.late, 0);

  const rows = [
    {
      key: "grading",
      value: pendingGrading,
      href: "/tests",
      Icon: ClipboardList,
      tone: pendingGrading > 0 ? "warn" : "ok",
    },
    {
      key: "missing",
      value: missing,
      href: "/tests",
      Icon: AlertTriangle,
      tone: missing > 0 ? "warn" : "ok",
    },
    {
      key: "late",
      value: late,
      href: "/tests",
      Icon: CalendarClock,
      tone: "ok",
    },
    ...(ctx.pendingRequests > 0
      ? [
          {
            key: "requests",
            value: ctx.pendingRequests,
            href: "/school",
            Icon: UserPlus,
            tone: "warn" as const,
          },
        ]
      : []),
  ];

  const clear = rows.every((row) => row.value === 0);

  return (
    <Panel title={t("root.dashboard.attention.title")} align={clear ? "center" : "start"}>
      {clear ? (
        <EmptyNote
          art="check"
          title={t("root.dashboard.attention.clearTitle")}
          description={t("root.dashboard.attention.clearDescription")}
        />
      ) : (
        <ul className="space-y-1">
          {rows.map(({ key, value, href, Icon, tone }) => (
            <li key={key}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    tone === "warn" && value > 0
                      ? "bg-warning/15 text-warning"
                      : "bg-accent text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {t(`root.dashboard.attention.${key}`)}
                </span>
                <span className="numeric shrink-0 text-lg font-bold text-foreground">
                  {value}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Class roster table — dense real detail for wide rows                       */
/* -------------------------------------------------------------------------- */

function ClassRoster({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const classes = (ctx.classPerformance?.classes ?? []).slice(0, 6);

  return (
    <Panel title={t("root.dashboard.roster.title")} bodyClassName="p-0 md:p-0">
      {classes.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-5 py-3 font-medium text-muted-foreground md:px-6">
                  {t("root.dashboard.roster.class")}
                </th>
                <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                  {t("root.dashboard.roster.students")}
                </th>
                <th className="px-3 py-3 text-right font-medium text-muted-foreground">
                  {t("root.dashboard.roster.completion")}
                </th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground md:px-6">
                  {t("root.dashboard.roster.average")}
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.map((row) => (
                <tr key={row.classId} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 md:px-6">
                    <Link
                      href={`/groups/${row.classId}`}
                      className="truncate font-medium text-foreground hover:text-primary"
                    >
                      {row.className}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {row.studentCount}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {row.completionRate != null ? `${Math.round(row.completionRate)}%` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right md:px-6">
                    {row.averageScore != null ? (
                      <span className="font-semibold tabular-nums text-foreground">
                        {Math.round(row.averageScore)}%
                      </span>
                    ) : (
                      <span className="tabular-nums text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const { type, setType } = useChartType();
  const hasPoints = Boolean(ctx.trend?.points.length);

  return (
    <Panel
      title={t("root.dashboard.trend.titleRole", {
        role: t(`root.dashboard.roles.${ctx.role.toLowerCase()}`),
      })}
      // Only offered when there is something to draw: a form switch over an
      // empty state is three ways to look at nothing.
      aside={hasPoints ? <ChartTypeToggle value={type} onChange={setType} /> : undefined}
    >
      {ctx.trend?.points.length ? (
        <TrendChart points={ctx.trend.points} type={type} />
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

function ClassPerformancePanel({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const classes = ctx.classPerformance?.classes ?? [];
  const hasScores = classes.some((item) => item.averageScore != null);
  return (
    <Panel title={t("root.dashboard.modules.classPerformance.title")}>
      {hasScores ? (
        <ClassPerformanceChart classes={classes} />
      ) : (
        <EmptyNote
          art="trend"
          title={t("root.dashboard.modules.classPerformance.emptyTitle")}
          description={t("root.dashboard.modules.classPerformance.emptyDescription")}
        />
      )}
    </Panel>
  );
}

const GRADE_COLOR: Record<GradeBucket, string> = {
  A: "var(--chart-1)",
  B: "var(--chart-2)",
  C: "var(--chart-3)",
  "D/F": "var(--chart-4)",
};

function GradeDistribution({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const grades = ctx.distributions?.grades ?? [];
  const total = grades.reduce((sum, grade) => sum + grade.count, 0);
  return (
    <Panel title={t("root.dashboard.modules.distribution.title")} align="center">
      {total ? (
        <SegmentDonut
          segments={grades.map((grade) => ({
            label: grade.bucket,
            value: grade.count,
            color: GRADE_COLOR[grade.bucket],
          }))}
          centerValue={total}
          centerLabel={t("root.dashboard.modules.distribution.center")}
        />
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

function MembersByRole({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const members = ctx.distributions?.membersByRole;
  const segments = [
    {
      label: t("root.dashboard.modules.members.students"),
      value: members?.students ?? 0,
      color: "var(--chart-1)",
    },
    {
      label: t("root.dashboard.modules.members.teachers"),
      value: members?.teachers ?? 0,
      color: "var(--chart-2)",
    },
    {
      label: t("root.dashboard.modules.members.admins"),
      value: members?.admins ?? 0,
      color: "var(--chart-3)",
    },
  ];
  return (
    <Panel title={t("root.dashboard.modules.members.title")} align="center">
      <SegmentDonut
        segments={segments}
        centerValue={segments.reduce((sum, item) => sum + item.value, 0)}
        centerLabel={t("root.dashboard.modules.members.center")}
      />
    </Panel>
  );
}

function SubmissionStatus({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  return (
    <Panel
      title={t("root.dashboard.modules.submissions.title")}
      aside={t("root.dashboard.modules.submissions.range")}
    >
      {ctx.submissions?.byClass.length ? (
        <SubmissionsChart rows={ctx.submissions.byClass} />
      ) : (
        <EmptyNote
          art="check"
          title={t("root.dashboard.modules.submissions.emptyTitle")}
          description={t("root.dashboard.modules.submissions.emptyDescription")}
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

function QuickActions({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const actions =
    ctx.role === "ADMIN"
      ? [
          { key: "school", href: "/school", Icon: School },
          { key: "classes", href: "/groups", Icon: Users },
          { key: "tests", href: "/tests", Icon: BookOpenCheck },
        ]
      : ctx.role === "TEACHER"
        ? [
            { key: "classes", href: "/groups", Icon: GraduationCap },
            { key: "tests", href: "/tests", Icon: BookOpenCheck },
            { key: "notifications", href: "/notifications", Icon: Bell },
          ]
        : [
            { key: "classes", href: "/groups", Icon: GraduationCap },
            { key: "assignments", href: "/assignments/exams", Icon: BookOpenCheck },
            { key: "notifications", href: "/notifications", Icon: Bell },
          ];
  /*
    Three links, on one line where there is room for one line.

    This was a heading stacked over a full-width row of buttons — a 12-column
    panel spending two stacked bands on three shortcuts, each of which is a word
    and an icon. The heading is short and the actions are few, so at any width
    that fits them they belong beside each other; the stack is the narrow-screen
    fallback, not the default. Same three destinations, roughly half the height.
  */
  return (
    <Panel bodyClassName="p-4 md:p-4">
      <div className="@container">
        <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-center @2xl:gap-6">
          <h2 className="type-heading shrink-0 text-foreground">
            {t("root.dashboard.modules.quickActions.title")}
          </h2>
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            {actions.map(({ key, href, Icon }) => (
              <Button key={key} asChild variant="outline" className="justify-start">
                <Link href={href}>
                  <Icon className="h-4 w-4" />
                  {t(`root.dashboard.modules.quickActions.${key}`)}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Import a test from a PDF                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The dashboard's entry into the PDF importer.
 *
 * Unlike the other quick actions this one cannot be a bare link: an import
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
 * Reaching a person: support, and reporting something broken.
 *
 * Every role gets it. The floating report button is still there and still the
 * fastest route from a broken screen, but it is one unlabelled circle — a user
 * who has never hovered it does not know the product accepts reports at all,
 * and "where do I ask for help" is not a question anyone should have to hunt
 * for. This is the answer stated once, on the page everyone lands on.
 */
function GettingHelp() {
  return <SupportCta />;
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
    Component: KpiStrip,
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
    id: "attention",
    roles: ["ADMIN", "TEACHER"],
    resolve: (_ctx, stage) =>
      stage === "fresh" ? null : { priority: 76, span: 4, minSpan: 3, maxSpan: 6 },
    Component: NeedsAttention,
  },
  {
    id: "roster",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx) => {
      const rows = ctx.classPerformance?.classes.length ?? 0;
      return ctx.availability.hasClasses
        ? {
            priority: 72,
            // A table is the one module that genuinely needs width once it has
            // rows to show; with one class it does not.
            span: spanForCount(rows, { empty: 5, low: 6, high: 8 }, 2),
            minSpan: 5,
          }
        : null;
    },
    Component: ClassRoster,
  },
  {
    id: "class-performance",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx, stage) =>
      stage === "active" && ctx.availability.hasClassPerformance
        ? { priority: 70, span: 7, minSpan: 5, maxSpan: 8 }
        : null,
    Component: ClassPerformancePanel,
  },
  {
    id: "members",
    roles: ["ADMIN"],
    resolve: (ctx) =>
      ctx.availability.hasStudents ? { priority: 68, span: 4, minSpan: 3, maxSpan: 6 } : null,
    Component: MembersByRole,
  },
  {
    id: "submissions",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx) => {
      const rows = ctx.submissions?.byClass.length ?? 0;
      return ctx.availability.hasSubmissions
        ? { priority: 65, span: spanForCount(rows, { empty: 5, low: 6, high: 7 }, 2), minSpan: 5 }
        : null;
    },
    Component: SubmissionStatus,
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
    // Above the feeds, below the figures. Down beside the quick actions it was
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
    id: "quick",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: () => ({ priority: 20, span: 12 }),
    Component: QuickActions,
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
