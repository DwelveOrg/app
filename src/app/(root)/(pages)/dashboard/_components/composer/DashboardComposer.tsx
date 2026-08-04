"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  LayoutGrid,
  LineChart,
  Share2,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import CopyButton from "@/components/ui/CopyButton";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { cn } from "@/lib/utils";
import type { DashboardAvailability } from "@/app/(root)/_utils/getDashboard";
import type {
  DashboardFeed,
  Distributions,
  GradeBucket,
  ScoreTrend,
  StaffDashboardSummary,
} from "@/app/(root)/_lib/dashboard.schemas";
import Panel from "../Panel";
import JoinCodeChip from "../JoinCodeChip";
import TrendChart from "./TrendChart";
import SegmentDonut from "./SegmentDonut";
import Surface from "@/components/ui/Surface";

export type StaffRole = "ADMIN" | "TEACHER";

/**
 * Everything a staff dashboard module might need, assembled server-side from
 * `getDashboard` + the session/school. Serializable so it crosses the RSC
 * boundary into this client composer.
 */
export type DashboardComposerContext = {
  role: StaffRole;
  fullName: string | null;
  schoolName: string | null;
  studentJoinCode: string | null;
  availability: DashboardAvailability;
  summary: StaffDashboardSummary | null;
  trend: ScoreTrend | null;
  distributions: Distributions | null;
  feed: DashboardFeed | null;
};

type ModuleProps = { ctx: DashboardComposerContext };
type Placement = { priority: number; span: number };
type ModuleEntry = {
  id: string;
  roles: StaffRole[];
  /** Placement (priority + column span) when the module should show, else null. */
  resolve: (ctx: DashboardComposerContext) => Placement | null;
  Component: (props: ModuleProps) => ReactNode;
};

function firstName(fullName: string | null): string {
  if (!fullName?.trim()) return "";
  return fullName.trim().split(/\s+/)[0];
}

/* ------------------------------------------------------------------ shell */

function Header({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const emptyAdmin = ctx.role === "ADMIN" && !ctx.availability.hasStudents;
  const name = firstName(ctx.fullName);

  const eyebrow = emptyAdmin ? t("root.dashboard.setup.eyebrow") : null;
  const title = emptyAdmin
    ? ctx.schoolName
      ? t("root.dashboard.setup.title", { school: ctx.schoolName })
      : t("root.dashboard.setup.titleGeneric")
    : name
      ? t("root.dashboard.welcome.title", { name })
      : t("root.dashboard.welcome.titleGeneric");
  const subtitle = emptyAdmin
    ? t("root.dashboard.setup.subtitle")
    : t("root.dashboard.welcome.subtitle");

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={cn("type-title text-foreground", eyebrow && "mt-2")}>{title}</h1>
        <p className="mt-1.5 text-15 text-muted-foreground">{subtitle}</p>
      </div>

      {ctx.role === "ADMIN" && ctx.studentJoinCode ? (
        <JoinCodeChip code={ctx.studentJoinCode} />
      ) : null}
    </header>
  );
}

function EmptyNote({
  Icon,
  title,
  desc,
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 py-2">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-[46ch] text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- modules */

function KpiStrip({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const s = ctx.summary;
  const a = ctx.availability;
  const group = ctx.role === "ADMIN" ? "admin" : "teacher";
  const base = `root.dashboard.modules.kpi.${group}`;
  const canAct = ctx.role === "ADMIN";

  const tiles = [
    {
      key: "students",
      present: a.hasStudents,
      value: a.hasStudents ? String(s?.students ?? 0) : "—",
      cue: canAct && !a.hasStudents ? t("root.dashboard.modules.kpi.cue.invite") : "",
    },
    {
      key: "classes",
      present: a.hasClasses,
      value: a.hasClasses ? String(s?.classes ?? 0) : "—",
      cue: canAct && !a.hasClasses ? t("root.dashboard.modules.kpi.cue.addClass") : "",
    },
    {
      key: "exams",
      present: (s?.exams ?? 0) > 0,
      value: (s?.exams ?? 0) > 0 ? String(s?.exams) : "—",
      cue: "",
    },
    {
      key: "avgScore",
      present: a.hasResults,
      value: a.hasResults ? `${Math.round(s?.avgScore ?? 0)}%` : "—",
      cue: canAct && !a.hasResults ? t("root.dashboard.modules.kpi.cue.noResults") : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Surface key={tile.key}>
          <p className="text-sm font-medium text-muted-foreground">
            {t(`${base}.${tile.key}`)}
          </p>
          <p
            className={cn(
              "mt-3 text-3xl font-bold tracking-tight tabular-nums",
              tile.present ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {tile.value}
          </p>
          {tile.cue ? (
            <p className="mt-2 text-13 font-medium text-primary">{tile.cue}</p>
          ) : null}
        </Surface>
      ))}
    </div>
  );
}

function SetupChecklist({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const s = ctx.summary;

  const steps = [
    { key: "createSchool", done: true, kind: "static" as const },
    { key: "addClass", done: (s?.classes ?? 0) > 0, kind: "link" as const, href: "/school" },
    {
      key: "inviteTeachers",
      done: (s?.teachers ?? 0) > 0,
      kind: "link" as const,
      href: "/school",
    },
    { key: "shareCode", done: false, kind: "copy" as const },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <Panel
      title={t("root.dashboard.setup.checklistTitle")}
      aside={t("root.dashboard.setup.progress", { done: doneCount, total: steps.length })}
      bodyClassName="p-3 md:p-4"
    >
      <ol className="space-y-2">
        {steps.map((step, index) => {
          const b = `root.dashboard.setup.steps.${step.key}`;
          return (
            <li
              key={step.key}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border px-4 py-3",
                step.done && "opacity-70",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-13 font-bold",
                  step.done
                    ? "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-success"
                    : "bg-accent text-primary",
                )}
              >
                {step.done ? <Check className="h-4 w-4" /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {t(`${b}.title`)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ctx.schoolName && step.key === "createSchool"
                    ? ctx.schoolName
                    : t(`${b}.desc`)}
                </p>
              </div>

              {step.done ? (
                <span className="shrink-0 text-xs font-medium text-success">
                  {t("root.dashboard.setup.doneLabel")}
                </span>
              ) : step.kind === "link" ? (
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={step.href}>{t(`${b}.action`)}</Link>
                </Button>
              ) : (
                <CopyButton
                  value={ctx.studentJoinCode ?? ""}
                  icon={Share2}
                  showLabel
                  variant="outline"
                  className="shrink-0"
                  disabled={!ctx.studentJoinCode}
                  label={t(`${b}.action`)}
                  copiedLabel={t("root.dashboard.school.joinCodeCopied")}
                  onCopied={() => toast.success(t("root.dashboard.school.joinCodeCopied"))}
                  onError={() => toast.error(t("root.dashboard.school.joinCodeCopyError"))}
                />
              )}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function PerformanceTrend({ ctx }: ModuleProps) {
  const { t } = useTranslation();

  if (ctx.availability.hasResults && ctx.trend && ctx.trend.points.length > 0) {
    return (
      <Panel
        title={t("root.dashboard.trend.titleStaff")}
        aside={t("root.dashboard.trend.caption")}
      >
        <TrendChart points={ctx.trend.points} />
      </Panel>
    );
  }

  return (
    <Panel title={t("root.dashboard.trend.titleStaff")}>
      <EmptyNote
        Icon={LineChart}
        title={t("root.dashboard.modules.trend.emptyTitle")}
        desc={t("root.dashboard.modules.trend.emptyDesc")}
      />
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
  const segments = grades.map((grade) => ({
    label: grade.bucket,
    value: grade.count,
    color: GRADE_COLOR[grade.bucket],
  }));

  return (
    <Panel title={t("root.dashboard.modules.distribution.title")}>
      <SegmentDonut
        segments={segments}
        centerValue={total}
        centerLabel={t("root.dashboard.modules.distribution.center")}
      />
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
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <Panel title={t("root.dashboard.modules.members.title")}>
      <SegmentDonut
        segments={segments}
        centerValue={total}
        centerLabel={t("root.dashboard.modules.members.center")}
      />
    </Panel>
  );
}

function Upcoming({ ctx }: ModuleProps) {
  const { t } = useTranslation();
  const items = (ctx.feed?.upcoming ?? []).slice(0, 5);

  return (
    <Panel title={t("root.dashboard.upcoming.title")} bodyClassName="p-2.5 md:p-3">
      <ul className="space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {item.title}
              </p>
              <RelativeTime
                date={item.dueAt}
                className="mt-0.5 block text-xs text-muted-foreground"
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function QuickActions() {
  const { t } = useTranslation();
  const actions = [
    { key: "addClass", href: "/school", Icon: LayoutGrid },
    { key: "inviteTeacher", href: "/school", Icon: UserPlus },
    { key: "viewClasses", href: "/groups", Icon: ArrowRight },
  ];

  return (
    <Panel title={t("root.dashboard.modules.quickActions.title")}>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ key, href, Icon }) => (
          <Button key={key} asChild variant="outline" size="sm">
            <Link href={href}>
              <Icon className="h-3.5 w-3.5" />
              {t(`root.dashboard.modules.quickActions.${key}`)}
            </Link>
          </Button>
        ))}
      </div>
    </Panel>
  );
}

function TeacherNoClasses() {
  const { t } = useTranslation();
  return (
    <Panel>
      <EmptyNote
        Icon={LayoutGrid}
        title={t("root.dashboard.modules.teacherNoClasses.title")}
        desc={t("root.dashboard.modules.teacherNoClasses.desc")}
      />
    </Panel>
  );
}

/* --------------------------------------------------------------- registry */

const REGISTRY: ModuleEntry[] = [
  {
    id: "setup",
    roles: ["ADMIN"],
    resolve: (ctx) => (!ctx.availability.hasStudents ? { priority: 100, span: 6 } : null),
    Component: SetupChecklist,
  },
  {
    id: "teacherNoClasses",
    roles: ["TEACHER"],
    resolve: (ctx) => (!ctx.availability.hasClasses ? { priority: 98, span: 6 } : null),
    Component: TeacherNoClasses,
  },
  {
    id: "kpi",
    roles: ["ADMIN", "TEACHER"],
    resolve: () => ({ priority: 85, span: 6 }),
    Component: KpiStrip,
  },
  {
    id: "trend",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx) =>
      ctx.availability.hasResults
        ? { priority: 70, span: 4 }
        : ctx.availability.hasClasses
          ? { priority: 32, span: 4 }
          : null,
    Component: PerformanceTrend,
  },
  {
    id: "distribution",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx) => (ctx.availability.hasResults ? { priority: 62, span: 2 } : null),
    Component: GradeDistribution,
  },
  {
    id: "members",
    roles: ["ADMIN"],
    resolve: (ctx) => (ctx.availability.hasStudents ? { priority: 56, span: 3 } : null),
    Component: MembersByRole,
  },
  {
    id: "upcoming",
    roles: ["ADMIN", "TEACHER"],
    resolve: (ctx) => (ctx.availability.hasUpcoming ? { priority: 54, span: 3 } : null),
    Component: Upcoming,
  },
  {
    id: "quick",
    roles: ["ADMIN"],
    resolve: (ctx) => (ctx.availability.hasStudents ? { priority: 22, span: 6 } : null),
    Component: QuickActions,
  },
];

/**
 * Composes the admin/teacher dashboard from the module registry and the live
 * data-availability profile. Modules resolve to a priority + span or hide
 * themselves; the survivors sort by priority (setup/empty states lead when data
 * is missing, real graphs lead as it arrives) and lay out in a 6-column grid.
 * Students keep their own StudentDashboard; this composer is staff-only.
 */
export default function DashboardComposer({
  context,
}: {
  context: DashboardComposerContext;
}) {
  const items = REGISTRY.filter((entry) => entry.roles.includes(context.role))
    .map((entry) => {
      const placement = entry.resolve(context);
      return placement ? { id: entry.id, ...placement, Component: entry.Component } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-6">
      <Header ctx={context} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6 lg:gap-6">
        {items.map(({ id, span, Component }) => (
          <div key={id} className="min-w-0" style={{ gridColumn: `span ${span}` }}>
            <Component ctx={context} />
          </div>
        ))}
      </div>
    </div>
  );
}
