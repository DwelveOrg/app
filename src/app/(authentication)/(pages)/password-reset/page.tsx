"use client";

import Link from "next/link";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";

import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import DwelveLogo from "@/components/Custom/DwelveLogo";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormField,
} from "@/app/(authentication)/_types/_schemas";
import AuthSplitLayout from "../../_components/AuthSplitLayout";
import LoginPanel from "../login/_sections/LoginPanel";
import { useForgotPasswordMutation } from "../../_hooks/useAuthMutations";

export default function PasswordResetPage() {
  const { t } = useTranslation();
  const forgotMutation = useForgotPasswordMutation();
  const [sent, setSent] = React.useState(false);
  const [devResetUrl, setDevResetUrl] = React.useState<string | undefined>();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormField>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormField> = async (data) => {
    clearErrors("root");

    try {
      const result = await forgotMutation.mutateAsync(data);
      setDevResetUrl(result.resetUrl);
      setSent(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.passwordReset.error");
      setError("root", { message });
      toast.error(message);
    }
  };

  const isBusy = isSubmitting || forgotMutation.isPending;

  return (
    <AuthSplitLayout variant="login" panelContent={<LoginPanel />}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 lg:hidden">
          <DwelveLogo variant="form" />
        </div>

        <div className="w-full max-w-[400px]">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <MailCheck className="h-7 w-7" />
              </div>
              <h1 className="type-section text-foreground">
                {t("auth.passwordReset.sentTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("auth.passwordReset.sentBody")}
              </p>

              {devResetUrl && (
                <div className="mt-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-left text-xs text-warning">
                  <p className="font-semibold">{t("auth.passwordReset.devLinkNotice")}</p>
                  <Link
                    href={devResetUrl}
                    className="mt-1 block break-all font-medium text-primary underline"
                  >
                    {t("auth.passwordReset.devLinkCta")}
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.passwordReset.backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="type-title text-foreground">
                  {t("auth.passwordReset.title")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("auth.passwordReset.subtitle")}
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Field label={t("auth.passwordReset.emailLabel")} error={errors.email?.message}>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder={t("auth.passwordReset.emailPlaceholder")}
                    className={`w-full py-3 ${errors.email ? "border-destructive focus:border-destructive" : ""}`}
                  />
                </Field>

                {errors.root && (
                  <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {errors.root.message}
                  </div>
                )}

                <Button type="submit" size="xl" className="w-full" loading={isBusy}>
                  {t("auth.passwordReset.submit")}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-hover"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("auth.passwordReset.backToLogin")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </AuthSplitLayout>
  );
}
