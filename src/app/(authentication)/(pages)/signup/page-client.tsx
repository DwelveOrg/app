"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Btn from "@/components/Custom/CustomButton";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
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
  const [showPassword, setShowPassword] = React.useState(false);
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
            <h1 className="mt-2 text-3xl font-bold text-foreground">
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
            />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("auth.signup.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("auth.signup.fullName")}
              </label>
              <Input
                {...register("fullName")}
                type="text"
                placeholder={t("auth.signup.fullNamePlaceholder")}
                className={`w-full py-3 ${errors.fullName ? "border-destructive" : ""}`}
              />
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-destructive-text">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("auth.signup.email")}
              </label>
              <Input
                {...register("email")}
                type="email"
                placeholder={t("auth.signup.emailPlaceholder")}
                className={`w-full py-3 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-destructive-text">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("auth.signup.password")}
              </label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.signup.createPasswordPlaceholder")}
                  className={`w-full py-3 pr-11 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-1 right-1 inline-flex w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground"
                  aria-label={showPassword ? t("auth.signup.hidePassword") : t("auth.signup.showPassword")}
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

            {errors.root && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive-text">
                {errors.root.message}
              </div>
            )}

            <Btn type="submit" disabled={isBusy} className="w-full flex items-center justify-center py-3 text-sm">
              {isBusy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : t("auth.signup.createAccount")}
            </Btn>

            <p className="text-center text-xs text-muted-foreground">
              {t("auth.signup.terms")}
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.signup.alreadyAccount")}{" "}
            <Link href={loginHref} className="font-semibold text-primary hover:text-[var(--primary-hover)]">
              {t("auth.signup.login")}
            </Link>
          </p>

          <p className="mt-6 text-center">
            <Link href="/" className="text-xs text-muted-foreground transition hover:text-foreground">
              &larr; {t("auth.common.backToLanding")}
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
