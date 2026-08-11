"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  BookOpenCheck,
  Check,
  Copy,
  GraduationCap,
  LayoutGrid,
  School,
  Sparkles,
  TicketCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import { useCreateSchoolMutation } from "@/app/(root)/(pages)/schools/new/_hooks/useCreateSchoolMutation";
import { useJoinSchoolMutation } from "@/app/(root)/(pages)/_hooks/useJoinSchoolMutation";
import { useAcceptTeacherInviteMutation } from "@/app/(root)/(pages)/_hooks/useAcceptTeacherInviteMutation";
import {
  useRequestJoinClassMutation,
  useStudentClasses,
} from "@/app/(root)/_hooks/useEnrollment";
import { createClassAction } from "@/app/(root)/_lib/class-actions";
import { inviteTeacherAction } from "@/app/(root)/_lib/school-actions";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import CopyButton from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";
import { updateOnboardingAction } from "@/app/(root)/_lib/onboarding-actions";

type WizardUser = {
  id: string;
  fullName: string | null;
  schoolId: string | null;
  memberId: string | null;
  role: SchoolRole | null;
};

type WizardProps = {
  /**
   * Server-persisted resume point. Already accounts for replay, which the page
   * resolves before rendering, so the wizard never needs to know the difference.
   */
  initialStep: number;
  user: WizardUser;
  schoolName: string | null;
  studentJoinCode: string | null;
  classes: Array<{ id: string; name: string }>;
  availableClasses: number;
};

type AccessPath = "choose" | "admin" | "student" | "teacher";

const ROLE_STEPS: Record<SchoolRole, Array<{ icon: LucideIcon; key: string }>> = {
  ADMIN: [
    { icon: School, key: "ready" },
    { icon: LayoutGrid, key: "class" },
    { icon: UserPlus, key: "people" },
    { icon: BarChart3, key: "workspace" },
  ],
  TEACHER: [
    { icon: School, key: "ready" },
    { icon: Users, key: "classes" },
    { icon: BookOpenCheck, key: "tests" },
    { icon: BarChart3, key: "analytics" },
  ],
  STUDENT: [
    { icon: School, key: "ready" },
    { icon: GraduationCap, key: "classes" },
    { icon: BookOpenCheck, key: "assignments" },
    { icon: BarChart3, key: "progress" },
  ],
};

export default function OnboardingWizard(props: WizardProps) {
  const { user, initialStep } = props;
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(() => Math.max(0, initialStep));
  const [leaving, startLeaving] = useTransition();

  /**
   * Progress is written server-side so the flow resumes on any device. Step
   * writes are fire-and-forget: a failed save costs at most a resumed position,
   * and blocking the wizard on a network round trip per click would be worse.
   */
  const saveStep = (value: number) => {
    void updateOnboardingAction({ status: "in_progress", step: value });
  };

  const finish = (status: "completed" | "skipped") => {
    startLeaving(async () => {
      try {
        // The save must land before leaving. The dashboard sends unfinished
        // users straight back here, so redirecting on a failed write would
        // bounce the user between the two pages.
        const result = await updateOnboardingAction({ status, step });
        readSafeActionData(result, t("onboarding.actions.saveError"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("onboarding.actions.saveError"),
        );
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  };

  if (!user.role || !user.memberId) {
    return <AccessSetup {...props} busy={leaving} onSkip={() => finish("skipped")} />;
  }

  const role = user.role;
  const steps = ROLE_STEPS[role];
  const safeStep = Math.min(Math.max(step, 0), steps.length - 1);
  const current = steps[safeStep];
  const Icon = current.icon;
  const base = `onboarding.roles.${role.toLowerCase()}.${current.key}`;
  const next = () => {
    if (safeStep === steps.length - 1) {
      finish("completed");
      return;
    }
    const value = safeStep + 1;
    setStep(value);
    saveStep(value);
  };
  const back = () => {
    const value = Math.max(0, safeStep - 1);
    setStep(value);
    saveStep(value);
  };

  return (
    <Surface className="w-full max-w-5xl overflow-hidden p-0">
      <div className="grid min-h-[590px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-border bg-sidebar p-6 lg:border-b-0 lg:border-r">
          <p className="type-micro text-primary">{t("onboarding.progress.eyebrow")}</p>
          <h1 className="mt-2 type-heading text-foreground">
            {t(`onboarding.roles.${role.toLowerCase()}.title`)}
          </h1>
          <ol className="mt-7 grid grid-cols-4 gap-2 lg:grid-cols-1 lg:gap-3">
            {steps.map((item, index) => {
              const StepIcon = item.icon;
              const active = index === safeStep;
              const done = index < safeStep;
              return (
                <li key={item.key} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (!done) return;
                      setStep(index);
                      saveStep(index);
                    }}
                    disabled={!done}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left",
                      active && "bg-accent text-accent-foreground",
                      !active && "text-muted-foreground",
                      done && "hover:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card",
                        done && "border-primary bg-primary text-primary-foreground",
                        active && "border-primary text-primary",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </span>
                    <span className="hidden truncate text-xs font-semibold lg:block">
                      {t(`onboarding.roles.${role.toLowerCase()}.${item.key}.nav`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="flex min-w-0 flex-col p-6 sm:p-9">
          <div className="flex-1">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <Icon className="h-6 w-6" />
            </span>
            <p className="mt-6 type-micro text-primary">
              {t("onboarding.progress.label", { current: safeStep + 1, total: steps.length })}
            </p>
            <h2 className="mt-2 type-title text-foreground">{t(`${base}.title`)}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(`${base}.description`, { school: props.schoolName ?? t("onboarding.yourSchool") })}
            </p>
            <RoleStepContent {...props} stepKey={current.key} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => finish("skipped")}
              disabled={leaving}
            >
              {t("onboarding.actions.skip")}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={back}
                disabled={safeStep === 0 || leaving}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("onboarding.actions.back")}
              </Button>
              <Button type="button" onClick={next} disabled={leaving}>
                {safeStep === steps.length - 1
                  ? t("onboarding.actions.finish")
                  : t("onboarding.actions.next")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Surface>
  );
}

function AccessSetup({
  user,
  busy: leaving,
  onSkip,
}: WizardProps & { busy: boolean; onSkip: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [path, setPath] = useState<AccessPath>("choose");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const createSchool = useCreateSchoolMutation();
  const joinSchool = useJoinSchoolMutation();
  const acceptInvite = useAcceptTeacherInviteMutation();

  // Gaining a membership does not finish onboarding — it unlocks the role tour,
  // which the refreshed server render picks up from step 0.
  const complete = () => {
    toast.success(t("onboarding.access.success"));
    router.refresh();
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (path === "admin") {
        await createSchool.mutateAsync({ name, country, city });
      } else if (path === "student") {
        await joinSchool.mutateAsync({ code });
      } else if (path === "teacher") {
        await acceptInvite.mutateAsync({ token });
      }
      complete();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("onboarding.access.error"));
    }
  };
  const busy =
    createSchool.isPending ||
    joinSchool.isPending ||
    acceptInvite.isPending ||
    leaving;

  return (
    <Surface className="w-full max-w-4xl p-6 sm:p-10">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="mt-6 type-micro text-primary">{t("onboarding.access.eyebrow")}</p>
      <h1 className="mt-2 type-title text-foreground">
        {t("onboarding.access.title", {
          name: user.fullName?.trim().split(/\s+/)[0] ?? "",
        })}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {t("onboarding.access.description")}
      </p>

      {path === "choose" ? (
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <AccessCard icon={School} title={t("onboarding.access.admin.title")} description={t("onboarding.access.admin.description")} onClick={() => setPath("admin")} />
          <AccessCard icon={GraduationCap} title={t("onboarding.access.student.title")} description={t("onboarding.access.student.description")} onClick={() => setPath("student")} />
          <AccessCard icon={TicketCheck} title={t("onboarding.access.teacher.title")} description={t("onboarding.access.teacher.description")} onClick={() => setPath("teacher")} />
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 max-w-xl space-y-4">
          {path === "admin" ? (
            <>
              <Field label={t("onboarding.access.admin.name")} required>
                <Input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} autoFocus />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("onboarding.access.admin.country")}>
                  <Input value={country} onChange={(event) => setCountry(event.target.value)} maxLength={80} />
                </Field>
                <Field label={t("onboarding.access.admin.city")}>
                  <Input value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} />
                </Field>
              </div>
            </>
          ) : path === "student" ? (
            <Field label={t("onboarding.access.student.code")} required>
              <Input value={code} onChange={(event) => setCode(event.target.value)} required maxLength={64} autoFocus />
            </Field>
          ) : (
            <Field label={t("onboarding.access.teacher.token")} required>
              <Input value={token} onChange={(event) => setToken(event.target.value)} required autoFocus />
            </Field>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPath("choose")} disabled={busy}>
              <ArrowLeft className="h-4 w-4" />
              {t("onboarding.actions.back")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? t("onboarding.actions.working") : t("onboarding.actions.continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 border-t border-border pt-5">
        <Button type="button" variant="ghost" onClick={onSkip} disabled={busy}>
          {t("onboarding.actions.skip")}
        </Button>
      </div>
    </Surface>
  );
}

function AccessCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="interactive flex min-h-44 flex-col items-start rounded-2xl border border-border bg-card p-5 text-left shadow-elev-1 hover:border-primary/40"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-4 text-sm font-semibold text-foreground">{title}</span>
      <span className="mt-1 text-xs leading-5 text-muted-foreground">{description}</span>
      <ArrowRight className="mt-auto h-4 w-4 text-primary" />
    </button>
  );
}

function RoleStepContent(props: WizardProps & { stepKey: string }) {
  if (props.user.role === "ADMIN") return <AdminStep {...props} />;
  if (props.user.role === "TEACHER") return <TeacherStep {...props} />;
  return <StudentStep {...props} />;
}

function AdminStep({ stepKey, classes, studentJoinCode, schoolName }: WizardProps & { stepKey: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [className, setClassName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [busy, setBusy] = useState(false);

  if (stepKey === "class") {
    if (classes.length) {
      return <SuccessList items={classes.map((item) => item.name)} label={t("onboarding.roles.admin.class.existing")} />;
    }
    return (
      <form
        className="mt-6 max-w-lg space-y-3"
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
            toast.error(error instanceof Error ? error.message : t("onboarding.roles.admin.class.error"));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={t("onboarding.roles.admin.class.field")} required>
          <Input value={className} onChange={(event) => setClassName(event.target.value)} maxLength={120} required />
        </Field>
        <Button type="submit" disabled={busy}>
          <LayoutGrid className="h-4 w-4" />
          {busy ? t("onboarding.actions.working") : t("onboarding.roles.admin.class.action")}
        </Button>
      </form>
    );
  }

  if (stepKey === "people") {
    return (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-sm font-semibold text-foreground">{t("onboarding.roles.admin.people.students")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("onboarding.roles.admin.people.studentsDescription")}</p>
          {studentJoinCode ? (
            <CopyButton value={studentJoinCode} icon={Copy} showLabel variant="outline" className="mt-4" label={studentJoinCode} copiedLabel={t("onboarding.roles.admin.people.copied")} />
          ) : null}
        </div>
        <form
          className="rounded-2xl bg-muted p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              const result = await inviteTeacherAction({ email: teacherEmail });
              const data = await readSafeActionData(result, t("onboarding.roles.admin.people.inviteError"));
              setInviteUrl(data.inviteUrl);
              toast.success(t("onboarding.roles.admin.people.inviteSuccess"));
            } catch (error) {
              toast.error(error instanceof Error ? error.message : t("onboarding.roles.admin.people.inviteError"));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={t("onboarding.roles.admin.people.teacherEmail")} required>
            <Input type="email" value={teacherEmail} onChange={(event) => setTeacherEmail(event.target.value)} required />
          </Field>
          {inviteUrl ? (
            <CopyButton value={inviteUrl} icon={Copy} showLabel variant="outline" className="mt-3" label={t("onboarding.roles.admin.people.copyInvite")} copiedLabel={t("onboarding.roles.admin.people.copied")} />
          ) : (
            <Button type="submit" size="sm" className="mt-3" disabled={busy}>
              <UserPlus className="h-4 w-4" />
              {busy ? t("onboarding.actions.working") : t("onboarding.roles.admin.people.invite")}
            </Button>
          )}
        </form>
      </div>
    );
  }

  if (stepKey === "workspace") return <DestinationGrid role="admin" />;
  return <ReadySummary schoolName={schoolName} />;
}

function TeacherStep({ stepKey, classes, schoolName }: WizardProps & { stepKey: string }) {
  const { t } = useTranslation();
  if (stepKey === "classes") {
    return classes.length ? (
      <SuccessList items={classes.map((item) => item.name)} label={t("onboarding.roles.teacher.classes.assigned")} />
    ) : (
      <InfoBox icon={Bell} text={t("onboarding.roles.teacher.classes.waiting")} />
    );
  }
  if (stepKey === "tests") return <DestinationGrid role="teacher" />;
  if (stepKey === "analytics") return <FeatureList keys={["trend", "classes", "grading", "notifications"]} />;
  return <ReadySummary schoolName={schoolName} />;
}

function StudentStep({ stepKey, user, schoolName, classes, availableClasses }: WizardProps & { stepKey: string }) {
  const { t } = useTranslation();
  const directory = useStudentClasses({ schoolId: user.schoolId ?? undefined, enabled: stepKey === "classes" });
  const requestJoin = useRequestJoinClassMutation(user.schoolId ?? undefined);
  const available = useMemo(
    () => (directory.data?.classes ?? []).filter((item) => item.canRequest).slice(0, 4),
    [directory.data?.classes],
  );

  if (stepKey === "classes") {
    return (
      <div className="mt-6 space-y-3">
        {classes.length ? <SuccessList items={classes.map((item) => item.name)} label={t("onboarding.roles.student.classes.enrolled")} /> : null}
        {!available.length ? (
          <InfoBox icon={GraduationCap} text={t("onboarding.roles.student.classes.none", { count: availableClasses })} />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {available.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={requestJoin.isPending}
                  onClick={async () => {
                    try {
                      await requestJoin.mutateAsync({ classId: item.id });
                      toast.success(t("onboarding.roles.student.classes.requested"));
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : t("onboarding.roles.student.classes.error"));
                    }
                  }}
                >
                  {t("onboarding.roles.student.classes.request")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (stepKey === "assignments") return <DestinationGrid role="student" />;
  if (stepKey === "progress") return <FeatureList keys={["trend", "classes", "upcoming", "results"]} />;
  return <ReadySummary schoolName={schoolName} />;
}

function ReadySummary({ schoolName }: { schoolName: string | null }) {
  const { t } = useTranslation();
  return <InfoBox icon={Check} text={t("onboarding.ready", { school: schoolName ?? t("onboarding.yourSchool") })} />;
}

function InfoBox({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <p className="text-sm leading-6 text-foreground">{text}</p>
    </div>
  );
}

function SuccessList({ items, label }: { items: string[]; label: string }) {
  return (
    <div className="mt-6 rounded-2xl bg-muted p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-elev-1">
            <Check className="h-3.5 w-3.5 text-success" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DestinationGrid({ role }: { role: "admin" | "teacher" | "student" }) {
  const { t } = useTranslation();
  const keys = role === "admin" ? ["school", "classes", "tests", "notifications"] : role === "teacher" ? ["classes", "tests", "results", "notifications"] : ["classes", "assignments", "results", "notifications"];
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {keys.map((key) => (
        <div key={key} className="rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold text-foreground">{t(`onboarding.destinations.${key}.title`)}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{t(`onboarding.destinations.${key}.description`)}</p>
        </div>
      ))}
    </div>
  );
}

function FeatureList({ keys }: { keys: string[] }) {
  const { t } = useTranslation();
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
      {keys.map((key) => (
        <li key={key} className="flex gap-3 rounded-2xl bg-muted p-4">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <span className="text-sm text-foreground">{t(`onboarding.features.${key}`)}</span>
        </li>
      ))}
    </ul>
  );
}
