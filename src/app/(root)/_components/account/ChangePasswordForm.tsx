"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  changePasswordAction,
  setPasswordAction,
} from "@/app/(root)/_lib/profile-actions";
import {
  changePasswordSchema,
  setPasswordSchema,
  type ChangePasswordInput,
  type SetPasswordInput,
} from "@/app/(root)/_lib/profile.schemas.forms";
import Input from "@/components/ui/Input.dark";

type ChangePasswordFormProps = {
  /** From `account.authMethods.password`: true → change flow, false → set flow. */
  hasPassword: boolean;
};

/**
 * Renders the password panel from the backend `authMethods.password` signal:
 * a first-time "Set password" flow for accounts without a password (e.g.
 * Google-only users), or a "Change password" flow for accounts that already
 * have one. See `docs/features/password-auth-settings.md`.
 */
export function ChangePasswordForm({ hasPassword }: Readonly<ChangePasswordFormProps>) {
  return hasPassword ? <ChangePasswordFields /> : <SetPasswordFields />;
}

function PasswordCard({
  title,
  description,
  children,
}: Readonly<{ title: string; description: string; children: ReactNode }>) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <header className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
          <KeyRound className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[var(--foreground)]">{title}</h2>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function SubmitButton({ isBusy, label }: Readonly<{ isBusy: boolean; label: string }>) {
  return (
    <div className="flex justify-end pt-1">
      <button
        type="submit"
        disabled={isBusy}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {label}
      </button>
    </div>
  );
}

function ChangePasswordFields() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.profile.password.error"));
        return;
      }
      form.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success(t("root.profile.password.updated"));
      router.refresh();
    });
  });

  const isBusy = isPending || form.formState.isSubmitting;

  return (
    <PasswordCard
      title={t("root.profile.password.title")}
      description={t("root.profile.password.description")}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="profile-current-password"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {t("root.profile.password.current.label")}
          </label>
          <Input
            id="profile-current-password"
            type="password"
            autoComplete="current-password"
            {...form.register("currentPassword")}
            placeholder={t("root.profile.password.current.placeholder")}
            aria-invalid={Boolean(form.formState.errors.currentPassword)}
          />
        </div>

        <div>
          <label
            htmlFor="profile-new-password"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {t("root.profile.password.new.label")}
          </label>
          <Input
            id="profile-new-password"
            type="password"
            autoComplete="new-password"
            {...form.register("newPassword")}
            placeholder={t("root.profile.password.new.placeholder")}
            aria-invalid={Boolean(form.formState.errors.newPassword)}
          />
          {form.formState.errors.newPassword ? (
            <p className="mt-1.5 text-xs text-[var(--destructive)]">
              {t("root.profile.password.new.error")}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
              {t("root.profile.password.new.hint")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="profile-confirm-password"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {t("root.profile.password.confirm.label")}
          </label>
          <Input
            id="profile-confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
            placeholder={t("root.profile.password.confirm.placeholder")}
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="mt-1.5 text-xs text-[var(--destructive)]">
              {t("root.profile.password.confirm.error")}
            </p>
          ) : null}
        </div>

        <SubmitButton isBusy={isBusy} label={t("root.profile.password.submit")} />
      </form>
    </PasswordCard>
  );
}

function SetPasswordFields() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await setPasswordAction(values);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.profile.password.error"));
        return;
      }
      form.reset({ newPassword: "", confirmPassword: "" });
      toast.success(t("root.profile.password.set.updated"));
      // authMethods.password flips to true — refresh so the panel switches to
      // the change-password flow.
      router.refresh();
    });
  });

  const isBusy = isPending || form.formState.isSubmitting;

  return (
    <PasswordCard
      title={t("root.profile.password.set.title")}
      description={t("root.profile.password.set.description")}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="profile-set-new-password"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {t("root.profile.password.new.label")}
          </label>
          <Input
            id="profile-set-new-password"
            type="password"
            autoComplete="new-password"
            {...form.register("newPassword")}
            placeholder={t("root.profile.password.new.placeholder")}
            aria-invalid={Boolean(form.formState.errors.newPassword)}
          />
          {form.formState.errors.newPassword ? (
            <p className="mt-1.5 text-xs text-[var(--destructive)]">
              {t("root.profile.password.new.error")}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
              {t("root.profile.password.new.hint")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="profile-set-confirm-password"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {t("root.profile.password.confirm.label")}
          </label>
          <Input
            id="profile-set-confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
            placeholder={t("root.profile.password.confirm.placeholder")}
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="mt-1.5 text-xs text-[var(--destructive)]">
              {t("root.profile.password.confirm.error")}
            </p>
          ) : null}
        </div>

        <SubmitButton isBusy={isBusy} label={t("root.profile.password.set.submit")} />
      </form>
    </PasswordCard>
  );
}
