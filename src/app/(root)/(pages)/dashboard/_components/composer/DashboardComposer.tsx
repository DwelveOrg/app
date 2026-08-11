"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  Check,
  Compass,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  LineChart,
  School,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { DashboardAvailability } from "@/app/(root)/_utils/getDashboard";
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

type ModuleProps = { ctx: DashboardComposerContext };
type Placement = { priority: number; span: number };
type ModuleEntry = {
  id: string;
  roles: SchoolRole[];
  resolve: (ctx: DashboardComposerContext) => Placement | null;
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

function Header({ ctx }: ModuleProps) {
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
          {t(`root.dashboard.roleSubtitle.${roleKey}`)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/onboarding?replay=1">
            <HelpCircle className="h-4 w-4" />
            {t("root.dashboard.replayOnboarding")}
          </Link>
        </Button>
        {ctx.role === "ADMIN" && ctx.studentJoinCode ? (
          <JoinCodeChip code={ctx.studentJoinCode} />
        ) : null}
      </div>
    </header>
  );
}

type Kpi = { key: string; value: string; available: boolean; hint?: string };

function KpiStrip({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  let tiles: Kpi[] = [];

  if (isStudentSummary(ctx.summary)) {
    const summary = ctx.summary;
    tiles = [
      { key: "classes", value: String(summary.enrolledCourses), available: true },
      { key: "available", value: String(ctx.availableClasses), available: true },
      { key: "due", value: String(summary.dueThisWeek), available: true },
      {
        key: "completed",
        value: String(summary.completedAssessments ?? 0),
        available: true,
      },
      {
        key: "inProgress",
        value: String(summary.inProgressAssessments ?? 0),
        available: true,
      },
      {
        key: "average",
        value: ctx.availability.hasResults ? `${Math.round(summary.myAverage)}%` : "—",
        available: ctx.availability.hasResults,
      },
    ];
  } else {
    const summary = ctx.summary as StaffDashboardSummary | null;
    const teacher = ctx.role === "TEACHER";
    tiles = [
      { key: "students", value: String(summary?.students ?? 0), available: true },
      { key: "classes", value: String(summary?.classes ?? 0), available: true },
      ...(teacher
        ? [
            {
              key: "pendingGrading",
              value: String(summary?.pendingGrading ?? 0),
              available: true,
            },
          ]
        : [
            {
              key: "teachers",
              value: String(summary?.teachers ?? 0),
              available: true,
            },
          ]),
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
          summary?.completionRate != null
            ? `${Math.round(summary.completionRate)}%`
            : "—",
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

function GettingStarted({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const configs = {
    ADMIN: {
      Icon: School,
      title: t("root.dashboard.gettingStarted.admin.title"),
      description: t("root.dashboard.gettingStarted.admin.description"),
      href: "/school",
      action: t("root.dashboard.gettingStarted.admin.action"),
    },
    TEACHER: {
      Icon: LayoutGrid,
      title: t("root.dashboard.gettingStarted.teacher.title"),
      description: t("root.dashboard.gettingStarted.teacher.description"),
      href: "/groups",
      action: t("root.dashboard.gettingStarted.teacher.action"),
    },
    STUDENT: {
      Icon: Compass,
      title: t("root.dashboard.gettingStarted.student.title"),
      description: t("root.dashboard.gettingStarted.student.description"),
      href: "/groups",
      action: t("root.dashboard.gettingStarted.student.action"),
    },
  } as const;
  const config = configs[ctx.role];

  return (
    <Panel title={t("root.dashboard.gettingStarted.title")}>
      <EmptyNote {...config} />
    </Panel>
  );
}

function PerformanceTrend({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  return (
    <Panel title={t("root.dashboard.trend.titleRole", { role: t(`root.dashboard.roles.${ctx.role.toLowerCase()}`) })}>
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
    { label: t("root.dashboard.modules.members.students"), value: members?.students ?? 0, color: "var(--chart-1)" },
    { label: t("root.dashboard.modules.members.teachers"), value: members?.teachers ?? 0, color: "var(--chart-2)" },
    { label: t("root.dashboard.modules.members.admins"), value: members?.admins ?? 0, color: "var(--chart-3)" },
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
    <Panel title={t("root.dashboard.modules.submissions.title")} aside={t("root.dashboard.modules.submissions.range")}>
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
                  <RelativeTime date={item.dueAt} className="mt-0.5 block text-xs text-muted-foreground" />
                </div>
                {item.href ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : null}
              </>
            );
            return (
              <li key={`${item.kind}-${item.id}`}>
                {item.href ? (
                  <Link href={item.href} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60">
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
              <Link href={item.href ?? "/notifications"} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {i18n.exists(item.title) ? t(item.title) : item.title}
                  </p>
                  <RelativeTime date={item.at} className="mt-0.5 block text-xs text-muted-foreground" />
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
              <Link href={`/groups/${classItem.id}`} className="flex items-center gap-3 py-3 hover:text-primary">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-bold text-primary">
                  {classItem.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{classItem.name}</span>
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
          { key: "tests", href: "/groups", Icon: BookOpenCheck },
        ]
      : ctx.role === "TEACHER"
        ? [
            { key: "classes", href: "/groups", Icon: GraduationCap },
            { key: "tests", href: "/groups", Icon: BookOpenCheck },
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

const REGISTRY: ModuleEntry[] = [
  {
    id: "getting-started",
    roles: ["ADMIN", "TEACHER", "STUDENT"],
    resolve: (ctx) =>
      !ctx.availability.hasClasses ||
      (ctx.role === "ADMIN" && !ctx.availability.hasStudents)
        ? { priority: 100, span: 12 }
        : null,
    Component: GettingStarted,
  },
  { id: "kpis", roles: ["ADMIN", "TEACHER", "STUDENT"], resolve: () => ({ priority: 90, span: 12 }), Component: KpiStrip },
  { id: "trend", roles: ["ADMIN", "TEACHER", "STUDENT"], resolve: () => ({ priority: 80, span: 7 }), Component: PerformanceTrend },
  { id: "distribution", roles: ["ADMIN", "TEACHER", "STUDENT"], resolve: () => ({ priority: 78, span: 5 }), Component: GradeDistribution },
  { id: "class-performance", roles: ["ADMIN", "TEACHER", "STUDENT"], resolve: (ctx) => (ctx.availability.hasClasses ? { priority: 70, span: 7 } : null), Component: ClassPerformancePanel },
  { id: "members", roles: ["ADMIN"], resolve: (ctx) => (ctx.availability.hasStudents ? { priority: 68, span: 5 } : null), Component: MembersByRole },
  { id: "submissions", roles: ["ADMIN", "TEACHER"], resolve: (ctx) => (ctx.availability.hasClasses ? { priority: 65, span: 7 } : null), Component: SubmissionStatus },
  { id: "classes", roles: ["STUDENT"], resolve: () => ({ priority: 65, span: 5 }), Component: StudentClasses },
  { id: "upcoming", roles: ["ADMIN", "TEACHER", "STUDENT"], resolve: () => ({ priority: 55, span: 6 }), Component: Upcoming },
  { id: "activity", roles: ["ADMIN", "TEACHER", "STUDENT"], resolve: () => ({ priority: 54, span: 6 }), Component: RecentActivity },
  { id: "quick", roles: ["ADMIN", "TEACHER", "STUDENT"], resolve: () => ({ priority: 20, span: 12 }), Component: QuickActions },
];

export default function DashboardComposer({
  context,
}: {
  context: DashboardComposerContext;
}) {
  const items = REGISTRY.filter((entry) => entry.roles.includes(context.role))
    .map((entry) => {
      const placement = entry.resolve(context);
      return placement ? { ...entry, ...placement } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => right.priority - left.priority);

  return (
    <div className="space-y-6">
      <Header ctx={context} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
        {items.map(({ id, span, Component }) => (
          <div key={id} className="min-w-0" style={{ gridColumn: `span ${span}` }}>
            <Component ctx={context} />
          </div>
        ))}
      </div>
    </div>
  );
}
