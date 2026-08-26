"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import DwelveLogo from "@/components/Custom/DwelveLogo";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormField,
} from "@/app/(authentication)/_types/_schemas";
import AuthSplitLayout from "../../_components/AuthSplitLayout";
import LoginPanel from "../login/_sections/LoginPanel";
import { useResetPasswordMutation } from "../../_hooks/useAuthMutations";
import AuthHandoffOverlay, {
  handoffDestination,
  type AuthHandoffDestination,
} from "../../_components/AuthHandoff";

type ResetPasswordPageClientProps = {
  token: string;
};

export default function ResetPasswordPageClient({ token }: Readonly<ResetPasswordPageClientProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const resetMutation = useResetPasswordMutation();
  // A completed reset signs the user straight in, so it lands in the same navigation dead zone as
  // login and gets the same overlay. See AuthHandoff.tsx.
  const [handoff, setHandoff] = React.useState<AuthHandoffDestination | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormField>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit: SubmitHandler<ResetPasswordFormField> = async (data) => {
    clearErrors("root");

    try {
      const result = await resetMutation.mutateAsync({ token, password: data.password });
      setHandoff(handoffDestination(result.redirectTo));
      toast.success(t("auth.resetPassword.success"));
      router.push(result.redirectTo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.resetPassword.invalidBody");
      setError("root", { message });
      toast.error(message);
    }
  };

  const isBusy = isSubmitting || resetMutation.isPending || handoff !== null;

  return (
    <AuthSplitLayout variant="login" panelContent={<LoginPanel />}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 lg:hidden">
          <DwelveLogo variant="form" />
        </div>

        <div className="w-full max-w-[400px]">
          {!token ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h1 className="type-section text-foreground">
                {t("auth.resetPassword.invalidTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("auth.resetPassword.invalidBody")}
              </p>
              <Link
                href="/password-reset"
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
              >
                {t("auth.resetPassword.requestNew")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {t("auth.resetPassword.access")}
                </p>
                <h1 className="mt-2 type-title text-foreground">
                  {t("auth.resetPassword.title")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("auth.resetPassword.subtitle")}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Field
                  label={t("auth.resetPassword.passwordLabel")}
                  error={errors.password?.message}
                >
                  <Input
                    {...register("password")}
                    type="password"
                    placeholder={t("auth.resetPassword.passwordPlaceholder")}
                    revealLabel={t("auth.resetPassword.showPassword")}
                    hideLabel={t("auth.resetPassword.hidePassword")}
                    aria-invalid={Boolean(errors.password)}
                  />
                </Field>

                <Field
                  label={t("auth.resetPassword.confirmPasswordLabel")}
                  error={errors.confirmPassword?.message}
                >
                  <Input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                    revealLabel={t("auth.resetPassword.showPassword")}
                    hideLabel={t("auth.resetPassword.hidePassword")}
                    aria-invalid={Boolean(errors.confirmPassword)}
                  />
                </Field>

                {errors.root && (
                  <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errors.root.message}
                  </div>
                )}

                <Button type="submit" size="xl" className="w-full" loading={isBusy}>
                  {t("auth.resetPassword.submit")}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-hover"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("auth.resetPassword.backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <AuthHandoffOverlay destination={handoff} />
    </AuthSplitLayout>
  );
}
