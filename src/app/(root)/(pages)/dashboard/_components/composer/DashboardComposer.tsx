"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarClock,
  Check,
  ClipboardList,
  Compass,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  LineChart,
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
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/utils";
import JoinCodeChip from "../JoinCodeChip";
import Panel from "../Panel";
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => (
        <Surface key={tile.key} className="min-h-28 p-4">
          <p className="type-caption font-medium text-muted-foreground">
            {t(`root.dashboard.kpi.${group}.${tile.key}`)}
          </p>
          <p
            className={cn(
              "mt-3 text-2xl font-bold tracking-tight tabular-nums",
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
  Icon,
  title,
  description,
  href,
  action,
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-start justify-center gap-2 py-2">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-[54ch] text-xs leading-5 text-muted-foreground">{description}</p>
      {href && action ? (
        <Button asChild variant="outline" size="sm" className="mt-2">
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
    <Panel title={t("root.dashboard.attention.title")}>
      {clear ? (
        <EmptyNote
          Icon={Check}
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
                <span className="shrink-0 text-lg font-bold tabular-nums text-foreground">
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
            Icon={LayoutGrid}
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
    <Panel title={t("root.dashboard.nextUp.title")}>
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
          Icon={CalendarClock}
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
      title={t("root.dashboard.trend.titleRole", {
        role: t(`root.dashboard.roles.${ctx.role.toLowerCase()}`),
      })}
    >
      {ctx.trend?.points.length ? (
        <TrendChart points={ctx.trend.points} />
      ) : (
        <EmptyNote
          Icon={LineChart}
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
          Icon={BarChart3}
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
    <Panel title={t("root.dashboard.modules.distribution.title")}>
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
          Icon={BookOpenCheck}
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
    <Panel title={t("root.dashboard.modules.members.title")}>
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
          Icon={Check}
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
    <Panel title={t("root.dashboard.upcoming.title")} bodyClassName="p-2.5 md:p-3">
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
          Icon={BookOpenCheck}
          title={t("root.dashboard.upcoming.emptyTitle")}
          description={t("root.dashboard.upcoming.emptyDescription")}
        />
      )}
    </Panel>
  );
}

function RecentActivity({ ctx }: ModuleProps) {
  const { t, i18n } = useTranslation();
  const items = (ctx.feed?.recent ?? []).slice(0, 6);
  return (
    <Panel title={t("root.dashboard.modules.activity.title")} bodyClassName="p-2.5 md:p-3">
      {items.length ? (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href ?? "/notifications"}
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60"
              >
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {i18n.exists(item.title) ? t(item.title) : item.title}
                  </p>
                  <RelativeTime
                    date={item.at}
                    className="mt-0.5 block text-xs text-muted-foreground"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyNote
          Icon={Bell}
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
    <Panel title={t("root.dashboard.student.myClasses.title")}>
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
          Icon={GraduationCap}
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
  return (
    <Panel title={t("root.dashboard.modules.quickActions.title")}>
      <div className="grid gap-2 sm:grid-cols-3">
        {actions.map(({ key, href, Icon }) => (
          <Button key={key} asChild variant="outline" className="h-auto justify-start py-3">
            <Link href={href}>
              <Icon className="h-4 w-4" />
              {t(`root.dashboard.modules.quickActions.${key}`)}
            </Link>
          </Button>
        ))}
      </div>
    </Panel>
  );
}

function DiscoverClasses({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  return (
    <Panel title={t("root.dashboard.discover.title")}>
      <EmptyNote
        Icon={Compass}
        title={t("root.dashboard.discover.heading", { count: ctx.availableClasses })}
        description={t("root.dashboard.discover.description")}
        href="/groups"
        action={t("root.dashboard.discover.action")}
      />
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* Registry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every module declares which roles it belongs to and, given the live context
 * and derived stage, whether it appears and how wide it wants to be. Widths are
 * intentions, not guarantees: `packRows` reconciles each row to exactly 12
 * columns, so the page can never strand a gap the way fixed spans did.
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
      ctx.availability.hasUpcoming ? { priority: 85, span: 5, minSpan: 4 } : null,
    Component: NextUp,
  },
  {
    id: "trend",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: (_ctx, stage) =>
      stage === "fresh" ? null : { priority: 80, span: 7, minSpan: 6 },
    Component: PerformanceTrend,
  },
  {
    id: "distribution",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: (ctx) =>
      ctx.availability.hasResults ? { priority: 78, span: 5, minSpan: 4 } : null,
    Component: GradeDistribution,
  },
  {
    id: "attention",
    roles: ["ADMIN", "TEACHER"],
    resolve: (_ctx, stage) =>
      stage === "fresh" ? null : { priority: 76, span: 5, minSpan: 4 },
    Component: NeedsAttention,
  },
  {
    id: "roster",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx) =>
      ctx.availability.hasClasses ? { priority: 72, span: 7, minSpan: 6 } : null,
    Component: ClassRoster,
  },
  {
    id: "class-performance",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx, stage) =>
      stage === "active" && ctx.availability.hasClassPerformance
        ? { priority: 70, span: 7, minSpan: 6 }
        : null,
    Component: ClassPerformancePanel,
  },
  {
    id: "members",
    roles: ["ADMIN"],
    resolve: (ctx) =>
      ctx.availability.hasStudents ? { priority: 68, span: 5, minSpan: 4 } : null,
    Component: MembersByRole,
  },
  {
    id: "submissions",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx) =>
      ctx.availability.hasSubmissions ? { priority: 65, span: 7, minSpan: 5 } : null,
    Component: SubmissionStatus,
  },
  {
    id: "classes",
    roles: ["STUDENT"],
    resolve: () => ({ priority: 64, span: 5, minSpan: 4 }),
    Component: StudentClasses,
  },
  {
    id: "upcoming",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: () => ({ priority: 55, span: 6, minSpan: 4 }),
    Component: Upcoming,
  },
  {
    id: "activity",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: () => ({ priority: 54, span: 6, minSpan: 4 }),
    Component: RecentActivity,
  },
  {
    id: "quick",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: () => ({ priority: 20, span: 12 }),
    Component: QuickActions,
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
