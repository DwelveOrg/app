"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";

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
    <Surface as="section">
      <header className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary">
          <KeyRound className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      {children}
    </Surface>
  );
}

function SubmitButton({ isBusy, label }: Readonly<{ isBusy: boolean; label: string }>) {
  return (
    <div className="flex justify-end pt-1">
      <Button type="submit" size="lg" loading={isBusy}>
        {label}
      </Button>
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
        <Field
          htmlFor="profile-current-password"
          label={t("root.profile.password.current.label")}
        >
          <Input
            surface="muted"
            id="profile-current-password"
            type="password"
            autoComplete="current-password"
            {...form.register("currentPassword")}
            placeholder={t("root.profile.password.current.placeholder")}
            aria-invalid={Boolean(form.formState.errors.currentPassword)}
          />
        </Field>

        <Field
          htmlFor="profile-new-password"
          label={t("root.profile.password.new.label")}
          // Field falls back to the hint when there is no error, which is the alternation this
          // form used to spell out with a ternary over two near-identical paragraphs.
          error={
            form.formState.errors.newPassword
              ? t("root.profile.password.new.error")
              : undefined
          }
          hint={t("root.profile.password.new.hint")}
        >
          <Input
            surface="muted"
            id="profile-new-password"
            type="password"
            autoComplete="new-password"
            {...form.register("newPassword")}
            placeholder={t("root.profile.password.new.placeholder")}
            aria-invalid={Boolean(form.formState.errors.newPassword)}
          />
        </Field>

        <Field
          htmlFor="profile-confirm-password"
          label={t("root.profile.password.confirm.label")}
          error={
            form.formState.errors.confirmPassword
              ? t("root.profile.password.confirm.error")
              : undefined
          }
        >
          <Input
            surface="muted"
            id="profile-confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
            placeholder={t("root.profile.password.confirm.placeholder")}
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          />
        </Field>

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
        <Field
          htmlFor="profile-set-new-password"
          label={t("root.profile.password.new.label")}
          error={
            form.formState.errors.newPassword
              ? t("root.profile.password.new.error")
              : undefined
          }
          hint={t("root.profile.password.new.hint")}
        >
          <Input
            surface="muted"
            id="profile-set-new-password"
            type="password"
            autoComplete="new-password"
            {...form.register("newPassword")}
            placeholder={t("root.profile.password.new.placeholder")}
            aria-invalid={Boolean(form.formState.errors.newPassword)}
          />
        </Field>

        <Field
          htmlFor="profile-set-confirm-password"
          label={t("root.profile.password.confirm.label")}
          error={
            form.formState.errors.confirmPassword
              ? t("root.profile.password.confirm.error")
              : undefined
          }
        >
          <Input
            surface="muted"
            id="profile-set-confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
            placeholder={t("root.profile.password.confirm.placeholder")}
            aria-invalid={Boolean(form.formState.errors.confirmPassword)}
          />
        </Field>

        <SubmitButton isBusy={isBusy} label={t("root.profile.password.set.submit")} />
      </form>
    </PasswordCard>
  );
}
