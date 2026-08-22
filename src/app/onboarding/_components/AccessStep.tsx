"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  GraduationCap,
  MailCheck,
  School,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useCreateSchoolMutation } from "@/app/(root)/(pages)/schools/new/_hooks/useCreateSchoolMutation";
import { useJoinSchoolMutation } from "@/app/(root)/(pages)/_hooks/useJoinSchoolMutation";
import { useAcceptTeacherInviteMutation } from "@/app/(root)/(pages)/_hooks/useAcceptTeacherInviteMutation";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/**
 * The three ways into a school. `teacher` used to be labelled "Redeem teacher
 * invite", which read like a coupon; it is now "Use an invitation", parallel
 * with the other two and matching the wording on the dashboard empty state.
 */
export type AccessPath = "admin" | "student" | "teacher";

const PATHS: Array<{ id: AccessPath; icon: LucideIcon }> = [
  { id: "admin", icon: School },
  { id: "student", icon: GraduationCap },
  { id: "teacher", icon: MailCheck },
];

/**
 * The three rules that make the rest of the product make sense, sat under the
 * opening screen's call to action.
 *
 * This used to be a two-column block: three bordered cards plus an aside that
 * greeted the user by name and repeated that nothing is permanent. The hero
 * above now does the greeting, so the aside was saying it twice — and the cards
 * were competing with the one button the screen actually wants pressed. What is
 * left is the information, quietened: no borders, no fills, no icons repeated
 * three times, just three short paragraphs on a rule.
 */
export function WelcomeStep() {
  const { t } = useTranslation();
  const points = ["role", "invite", "later"];

  return (
    <div className="border-t border-border pt-8">
      <p className="text-center type-micro text-muted-foreground">
        {t("onboarding.access.welcome.body")}
      </p>
      <ul className="mt-7 grid gap-6 sm:grid-cols-3 sm:gap-8">
        {points.map((key) => (
          <li key={key}>
            <p className="text-sm font-semibold text-foreground">
              {t(`onboarding.access.welcome.points.${key}.title`)}
            </p>
            <p className="mt-1.5 type-caption leading-5 text-muted-foreground">
              {t(`onboarding.access.welcome.points.${key}.description`)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PathStep({
  value,
  onChange,
}: {
  value: AccessPath | null;
  onChange: (path: AccessPath) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PATHS.map(({ id, icon: Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={selected}
            className={cn(
              "group interactive-flat flex min-h-52 flex-col items-start rounded-2xl border bg-card p-6 text-left shadow-elev-1",
              "hover:border-foreground/30 hover:bg-muted/40",
              selected ? "border-foreground/60 ring-2 ring-ring/30" : "border-border",
            )}
          >
            <span
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-xl transition-colors",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-primary",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="mt-5 text-base font-semibold text-foreground">
              {t(`onboarding.access.${id}.title`)}
            </span>
            <span className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(`onboarding.access.${id}.description`)}
            </span>
            <span
              className={cn(
                "mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold transition-colors",
                selected ? "text-primary" : "text-muted-foreground",
              )}
            >
              {t(
                selected
                  ? "onboarding.access.selected"
                  : "onboarding.access.choose",
              )}
              <ArrowRight className="size-4" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * What the connect step shows when no path was ever chosen.
 *
 * Previously this state re-rendered `PathStep`, so the flow's last two screens
 * held the same three cards and only the heading changed — it read as a bug,
 * because it was one. A short explanation and one control back to the question
 * is the whole of what this state has to say.
 */
export function NoPathStep({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <span className="mx-auto inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
        <Compass className="size-5" />
      </span>
      <p className="mt-5 text-base font-semibold text-foreground">
        {t("onboarding.access.noPath.title")}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-pretty text-muted-foreground">
        {t("onboarding.access.noPath.description")}
      </p>
      <Button type="button" variant="outline" onClick={onBack} className="mt-6">
        <ArrowLeft className="size-4" />
        {t("onboarding.access.noPath.action")}
      </Button>
    </div>
  );
}

export function ConnectStep({
  path,
  onConnected,
  onChangePath,
  disabled,
}: {
  path: AccessPath;
  onConnected: () => void;
  /** Back to the chooser, without losing the wizard's place. */
  onChangePath: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");

  const createSchool = useCreateSchoolMutation();
  const joinSchool = useJoinSchoolMutation();
  const acceptInvite = useAcceptTeacherInviteMutation();

  const busy =
    disabled ||
    createSchool.isPending ||
    joinSchool.isPending ||
    acceptInvite.isPending;

  const ChosenIcon = PATHS.find((entry) => entry.id === path)?.icon ?? School;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (path === "admin") {
        await createSchool.mutateAsync({ name, country, city });
      } else if (path === "student") {
        await joinSchool.mutateAsync({ code });
      } else {
        await acceptInvite.mutateAsync({ token });
      }
      toast.success(t("onboarding.access.success"));
      onConnected();
      // Gaining a membership switches the whole flow to the role tour, which
      // the server render resolves — so refresh rather than advancing locally.
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("onboarding.access.error"),
      );
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-12">
      <div className="min-w-0 space-y-4">
        {/* The decision from the previous step, carried forward as a fact
            rather than as a control. It is what makes this screen legible on
            its own — without it the form is three unlabelled fields, and the
            user has no way back to the choice except the browser. */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
          <span className="inline-flex items-center gap-2 text-13 font-medium text-foreground">
            <ChosenIcon className="size-4 text-primary" aria-hidden="true" />
            {t(`onboarding.access.${path}.title`)}
          </span>
          <button
            type="button"
            onClick={onChangePath}
            disabled={busy}
            className="interactive-flat rounded-md text-2xs font-semibold text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60"
          >
            {t("onboarding.access.changePath")}
          </button>
        </div>

        {path === "admin" ? (
          <>
            <Field label={t("onboarding.access.admin.name")} required>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={120}
                autoFocus
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("onboarding.access.admin.country")}>
                <Input
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  maxLength={80}
                />
              </Field>
              <Field label={t("onboarding.access.admin.city")}>
                <Input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  maxLength={80}
                />
              </Field>
            </div>
          </>
        ) : path === "student" ? (
          <Field
            label={t("onboarding.access.student.code")}
            hint={t("onboarding.access.student.codeHint")}
            required
          >
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              maxLength={64}
              autoFocus
            />
          </Field>
        ) : (
          <Field
            label={t("onboarding.access.teacher.token")}
            hint={t("onboarding.access.teacher.tokenHint")}
            required
          >
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              autoFocus
            />
          </Field>
        )}

        {/* Only the submit. Going back is the chrome bar's job now, and a
            second control beside the one that creates the membership made the
            form read as optional. */}
        <div className="pt-2">
          <Button type="submit" disabled={busy} loading={busy}>
            {t("onboarding.actions.continue")}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <aside className="rounded-2xl border border-border bg-muted/60 p-6">
        <p className="text-sm font-semibold text-foreground">
          {t(`onboarding.access.${path}.asideTitle`)}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t(`onboarding.access.${path}.asideBody`)}
        </p>
      </aside>
    </form>
  );
}
