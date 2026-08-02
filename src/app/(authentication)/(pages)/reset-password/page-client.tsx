"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, ShieldAlert } from "lucide-react";

import Input from "@/components/ui/Input";
import Btn from "@/components/Custom/CustomButton";
import DwelveLogo from "@/components/Custom/DwelveLogo";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormField,
} from "@/app/(authentication)/_types/_schemas";
import AuthSplitLayout from "../../_components/AuthSplitLayout";
import LoginPanel from "../login/_sections/LoginPanel";
import { useResetPasswordMutation } from "../../_hooks/useAuthMutations";

type ResetPasswordPageClientProps = {
  token: string;
};

export default function ResetPasswordPageClient({ token }: Readonly<ResetPasswordPageClientProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const resetMutation = useResetPasswordMutation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

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
      toast.success(t("auth.resetPassword.success"));
      router.push(result.redirectTo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.resetPassword.invalidBody");
      setError("root", { message });
      toast.error(message);
    }
  };

  const isBusy = isSubmitting || resetMutation.isPending;

  return (
    <AuthSplitLayout variant="login" panelContent={<LoginPanel />}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 lg:hidden">
          <DwelveLogo variant="form" />
        </div>

        <div className="w-full max-w-[400px]">
          {!token ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive-text">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {t("auth.resetPassword.invalidTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("auth.resetPassword.invalidBody")}
              </p>
              <Link
                href="/password-reset"
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[var(--primary-hover)]"
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
                <h1 className="mt-2 text-3xl font-bold text-foreground">
                  {t("auth.resetPassword.title")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("auth.resetPassword.subtitle")}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("auth.resetPassword.passwordLabel")}
                  </label>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.resetPassword.passwordPlaceholder")}
                      className={`w-full py-3 pr-11 ${errors.password ? "border-destructive focus:border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-1 right-1 inline-flex w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground"
                      aria-label={showPassword ? t("auth.resetPassword.hidePassword") : t("auth.resetPassword.showPassword")}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-destructive-text">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("auth.resetPassword.confirmPasswordLabel")}
                  </label>
                  <div className="relative">
                    <Input
                      {...register("confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                      placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                      className={`w-full py-3 pr-11 ${errors.confirmPassword ? "border-destructive focus:border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute inset-y-1 right-1 inline-flex w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground"
                      aria-label={showConfirm ? t("auth.resetPassword.hidePassword") : t("auth.resetPassword.showPassword")}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-destructive-text">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {errors.root && (
                  <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive-text">
                    {errors.root.message}
                  </div>
                )}

                <Btn
                  type="submit"
                  className="w-full flex items-center justify-center py-3 text-sm"
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    t("auth.resetPassword.submit")
                  )}
                </Btn>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-[var(--primary-hover)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("auth.resetPassword.backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </AuthSplitLayout>
  );
}
