"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  RegularSignupFormField,
  regularSignupSchema,
} from "@/app/(authentication)/_types/_schemas/index";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { regularSignupDefaults } from "../../_constants/signup";
import AuthSplitLayout from "../../_components/AuthSplitLayout";
import DwelveLogo from "@/components/Custom/DwelveLogo";
import { marketingHref } from "@/lib/hosts";
import SignupPanel from "./_sections/SignupPanel";
import { useSignupMutation, useGoogleAuthMutation } from "../../_hooks/useAuthMutations";
import GoogleAuthButton from "../../_components/GoogleAuthButton";
import { safeNextPath } from "../../_utils/next-path";

type SignupPageClientProps = {
  /** Root-relative path to return to after signup (e.g. an invite). */
  next?: string;
};

export default function SignupPageClient({ next }: Readonly<SignupPageClientProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const googleMutation = useGoogleAuthMutation();
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegularSignupFormField>({
    resolver: zodResolver(regularSignupSchema),
    defaultValues: regularSignupDefaults,
  });

  const onSubmit: SubmitHandler<RegularSignupFormField> = async (data) => {
    clearErrors("root");

    try {
      const result = await signupMutation.mutateAsync(data);
      clearErrors("root");
      toast.success(t("auth.signup.success"));
      router.push(safeNextPath(next, result.redirectTo));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please check the form and try again.";
      setError("root", { message });
      toast.error(message);
    }
  };

  const isBusy = isSubmitting || signupMutation.isPending;

  const handleGoogleCredential = React.useCallback(async (idToken: string) => {
    try {
      const result = await googleMutation.mutateAsync(idToken);
      toast.success(t("auth.signup.success"));
      router.push(safeNextPath(next, result.redirectTo));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed.";
      toast.error(message);
    }
  }, [googleMutation, next, router, t]);

  return (
    <AuthSplitLayout variant="signup" panelContent={<SignupPanel />}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 lg:hidden">
          <DwelveLogo variant="form" />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("auth.signup.access")}
            </p>
            <h1 className="mt-2 type-title text-foreground">
              {t("auth.signup.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.signup.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <GoogleAuthButton
              onCredential={handleGoogleCredential}
              disabled={isBusy || googleMutation.isPending}
              text={t("auth.signup.google")}
              unavailableText={t("auth.signup.googleUnavailable")}
            />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("auth.signup.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label={t("auth.signup.fullName")} error={errors.fullName?.message}>
              <Input
                {...register("fullName")}
                type="text"
                placeholder={t("auth.signup.fullNamePlaceholder")}
                className={`w-full py-3 ${errors.fullName ? "border-destructive" : ""}`}
              />
            </Field>

            <Field label={t("auth.signup.email")} error={errors.email?.message}>
              <Input
                {...register("email")}
                type="email"
                placeholder={t("auth.signup.emailPlaceholder")}
                className={`w-full py-3 ${errors.email ? "border-destructive" : ""}`}
              />
            </Field>

            <Field label={t("auth.signup.password")} error={errors.password?.message}>
              <Input
                {...register("password")}
                type="password"
                placeholder={t("auth.signup.createPasswordPlaceholder")}
                revealLabel={t("auth.signup.showPassword")}
                hideLabel={t("auth.signup.hidePassword")}
                aria-invalid={Boolean(errors.password)}
              />
            </Field>

            {errors.root && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" size="xl" className="w-full" loading={isBusy}>
              {t("auth.signup.createAccount")}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {t("auth.signup.terms")}
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.signup.alreadyAccount")}{" "}
            <Link href={loginHref} className="font-semibold text-primary hover:text-primary-hover">
              {t("auth.signup.login")}
            </Link>
          </p>

          <p className="mt-6 text-center">
            <Link href={marketingHref("/")} className="text-xs text-muted-foreground transition hover:text-foreground">
              &larr; {t("auth.common.backToLanding")}
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
