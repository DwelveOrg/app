"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  Copy,
  GraduationCap,
  LayoutGrid,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import {
  useRequestJoinClassMutation,
  useStudentClasses,
} from "@/app/(root)/_hooks/useEnrollment";
import { createClassAction } from "@/app/(root)/_lib/class-actions";
import { inviteTeacherAction } from "@/app/(root)/_lib/school-actions";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { Button } from "@/components/ui/Button";
import CopyButton from "@/components/ui/CopyButton";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export type RoleStepProps = {
  stepKey: string;
  role: SchoolRole;
  schoolId: string | null;
  schoolName: string | null;
  studentJoinCode: string | null;
  classes: Array<{ id: string; name: string }>;
  availableClasses: number;
};

/* -------------------------------------------------------------------------- */
/* Shared presentation                                                        */
/* -------------------------------------------------------------------------- */

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-elev-1", className)}>
      {children}
    </div>
  );
}

/** A settled state: the work this step asks for is already done. */
function SettledNote({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="border-success/30 bg-success/5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-success/15 text-success">
        <Check className="size-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {items.length ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold"
            >
              <Check className="size-3.5 text-success" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function DestinationGrid({ keys }: { keys: string[] }) {
  const { t } = useTranslation();
  const HREFS: Record<string, string> = {
    school: "/school",
    classes: "/groups",
    tests: "/tests",
    results: "/tests",
    assignments: "/assignments/exams",
    notifications: "/notifications",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {keys.map((key) => (
        <Link
          key={key}
          href={HREFS[key] ?? "/dashboard"}
          className="group rounded-2xl border border-border bg-card p-5 shadow-elev-1 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elev-2"
        >
          <p className="text-sm font-semibold text-foreground">
            {t(`onboarding.destinations.${key}.title`)}
          </p>
          <p className="mt-1.5 type-caption leading-5 text-muted-foreground">
            {t(`onboarding.destinations.${key}.description`)}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            {t("onboarding.destinations.open")}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

function FeatureList({ keys }: { keys: string[] }) {
  const { t } = useTranslation();
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {keys.map((key) => (
        <li key={key} className="flex gap-3 rounded-2xl border border-border bg-card p-5">
          <Check className="mt-0.5 size-4 shrink-0 text-success" />
          <span className="text-sm leading-6 text-foreground">
            {t(`onboarding.features.${key}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ReadySummary({
  schoolName,
  role,
  classCount,
}: {
  schoolName: string | null;
  role: SchoolRole;
  classCount: number;
}) {
  const { t } = useTranslation();
  const school = schoolName ?? t("onboarding.yourSchool");
  const stats = [
    { key: "role", value: t(`root.dashboard.roles.${role.toLowerCase()}`) },
    { key: "school", value: school },
    { key: "classes", value: String(classCount) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.key}>
          <p className="type-caption font-medium text-muted-foreground">
            {t(`onboarding.ready.${stat.key}`)}
          </p>
          <p className="mt-2 truncate text-lg font-semibold text-foreground">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

function AdminClassStep({ classes }: { classes: RoleStepProps["classes"] }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [className, setClassName] = useState("");
  const [busy, setBusy] = useState(false);

  if (classes.length) {
    return (
      <SettledNote
        title={t("onboarding.roles.admin.class.existing")}
        items={classes.map((item) => item.name)}
      />
    );
  }

  return (
    <form
      className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          const result = await createClassAction({ name: className });
          await readSafeActionData(result, t("onboarding.roles.admin.class.error"));
          toast.success(t("onboarding.roles.admin.class.success"));
          setClassName("");
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : t("onboarding.roles.admin.class.error"),
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-4">
        <Field label={t("onboarding.roles.admin.class.field")} required>
          <Input
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            maxLength={120}
            required
          />
        </Field>
        <Button type="submit" disabled={busy}>
          <LayoutGrid className="size-4" />
          {busy ? t("onboarding.actions.working") : t("onboarding.roles.admin.class.action")}
        </Button>
      </div>
      <aside className="rounded-2xl border border-border bg-muted/60 p-6">
        <p className="text-sm font-semibold text-foreground">
          {t("onboarding.roles.admin.class.asideTitle")}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("onboarding.roles.admin.class.asideBody")}
        </p>
      </aside>
    </form>
  );
}

function AdminPeopleStep({ studentJoinCode }: { studentJoinCode: string | null }) {
  const { t } = useTranslation();
  const [teacherEmail, setTeacherEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
          <GraduationCap className="size-5" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          {t("onboarding.roles.admin.people.students")}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {t("onboarding.roles.admin.people.studentsDescription")}
        </p>
        {studentJoinCode ? (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-muted/60 px-4 py-3">
            <code className="min-w-0 flex-1 truncate font-mono text-lg font-semibold tracking-wide text-foreground">
              {studentJoinCode}
            </code>
            <CopyButton
              value={studentJoinCode}
              icon={Copy}
              label={t("onboarding.roles.admin.people.copyCode")}
              copiedLabel={t("onboarding.roles.admin.people.copied")}
            />
          </div>
        ) : null}
      </Card>

      <Card>
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
          <UserPlus className="size-5" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">
          {t("onboarding.roles.admin.people.teachers")}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {t("onboarding.roles.admin.people.teachersDescription")}
        </p>
        <form
          className="mt-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              const result = await inviteTeacherAction({ email: teacherEmail });
              const data = await readSafeActionData(
                result,
                t("onboarding.roles.admin.people.inviteError"),
              );
              setInviteUrl(data.inviteUrl);
              toast.success(t("onboarding.roles.admin.people.inviteSuccess"));
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : t("onboarding.roles.admin.people.inviteError"),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={t("onboarding.roles.admin.people.teacherEmail")} required>
            <Input
              type="email"
              value={teacherEmail}
              onChange={(event) => setTeacherEmail(event.target.value)}
              required
            />
          </Field>
          {inviteUrl ? (
            <CopyButton
              value={inviteUrl}
              icon={Copy}
              showLabel
              variant="outline"
              className="mt-3"
              label={t("onboarding.roles.admin.people.copyInvite")}
              copiedLabel={t("onboarding.roles.admin.people.copied")}
            />
          ) : (
            <Button type="submit" size="sm" className="mt-3" disabled={busy}>
              <UserPlus className="size-4" />
              {busy
                ? t("onboarding.actions.working")
                : t("onboarding.roles.admin.people.invite")}
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Student                                                                    */
/* -------------------------------------------------------------------------- */

function StudentClassesStep({
  schoolId,
  classes,
  availableClasses,
}: {
  schoolId: string | null;
  classes: RoleStepProps["classes"];
  availableClasses: number;
}) {
  const { t } = useTranslation();
  const directory = useStudentClasses({ schoolId: schoolId ?? undefined, enabled: true });
  const requestJoin = useRequestJoinClassMutation(schoolId ?? undefined);
  const available = useMemo(
    () => (directory.data?.classes ?? []).filter((item) => item.canRequest).slice(0, 6),
    [directory.data?.classes],
  );

  return (
    <div className="space-y-4">
      {classes.length ? (
        <SettledNote
          title={t("onboarding.roles.student.classes.enrolled")}
          items={classes.map((item) => item.name)}
        />
      ) : null}

      {available.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {available.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent font-bold text-primary">
                {item.name.charAt(0).toUpperCase()}
              </span>
              <p className="mt-4 truncate text-sm font-semibold text-foreground">
                {item.name}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-4 self-start"
                disabled={requestJoin.isPending}
                onClick={async () => {
                  try {
                    await requestJoin.mutateAsync({ classId: item.id });
                    toast.success(t("onboarding.roles.student.classes.requested"));
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : t("onboarding.roles.student.classes.error"),
                    );
                  }
                }}
              >
                {t("onboarding.roles.student.classes.request")}
              </Button>
            </Card>
          ))}
        </div>
      ) : classes.length ? null : (
        <Card>
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
            <GraduationCap className="size-5" />
          </span>
          <p className="mt-4 text-sm font-semibold text-foreground">
            {t("onboarding.roles.student.classes.noneTitle")}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {t("onboarding.roles.student.classes.none", { count: availableClasses })}
          </p>
        </Card>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

export default function RoleStep(props: RoleStepProps) {
  const { t } = useTranslation();
  const { role, stepKey, classes, schoolName, studentJoinCode, schoolId } = props;

  if (stepKey === "ready") {
    return (
      <ReadySummary schoolName={schoolName} role={role} classCount={classes.length} />
    );
  }

  if (role === "ADMIN") {
    if (stepKey === "class") return <AdminClassStep classes={classes} />;
    if (stepKey === "people") return <AdminPeopleStep studentJoinCode={studentJoinCode} />;
    return <DestinationGrid keys={["school", "classes", "tests", "notifications"]} />;
  }

  if (role === "TEACHER") {
    if (stepKey === "classes") {
      return classes.length ? (
        <SettledNote
          title={t("onboarding.roles.teacher.classes.assigned")}
          items={classes.map((item) => item.name)}
        />
      ) : (
        <Card>
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
            <Bell className="size-5" />
          </span>
          <p className="mt-4 text-sm leading-6 text-foreground">
            {t("onboarding.roles.teacher.classes.waiting")}
          </p>
        </Card>
      );
    }
    if (stepKey === "tests") {
      return <DestinationGrid keys={["classes", "tests", "results", "notifications"]} />;
    }
    return <FeatureList keys={["trend", "classes", "grading", "notifications"]} />;
  }

  if (stepKey === "classes") {
    return (
      <StudentClassesStep
        schoolId={schoolId}
        classes={classes}
        availableClasses={props.availableClasses}
      />
    );
  }
  if (stepKey === "assignments") {
    return <DestinationGrid keys={["classes", "assignments", "results", "notifications"]} />;
  }
  return <FeatureList keys={["trend", "classes", "upcoming", "results"]} />;
}
