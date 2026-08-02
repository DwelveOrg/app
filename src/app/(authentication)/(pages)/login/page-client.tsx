"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Btn from "@/components/Custom/CustomButton";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { loginSchema, LoginFormField } from "@/app/(authentication)/_types/_schemas/index";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import type { LoginPageClientProps } from "@/app/(authentication)/_types/ui";
import AuthSplitLayout from "../../_components/AuthSplitLayout";
import DwelveLogo from "@/components/Custom/DwelveLogo";
import LoginPanel from "./_sections/LoginPanel";
import { useLoginMutation, useGoogleAuthMutation } from "../../_hooks/useAuthMutations";
import GoogleAuthButton from "../../_components/GoogleAuthButton";
import { safeNextPath } from "../../_utils/next-path";

export default function LoginPageClient({ deleted, logout, next }: Readonly<LoginPageClientProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  const statusToastShownRef = React.useRef(false);
  const loginMutation = useLoginMutation();
  const googleMutation = useGoogleAuthMutation();
  const [showPassword, setShowPassword] = React.useState(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormField>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  React.useEffect(() => {
    if (statusToastShownRef.current) return;
    if (deleted !== "1" && logout !== "1" && logout !== "all") return;
    statusToastShownRef.current = true;
    toast.success(deleted === "1"
      ? t("auth.login.accountDeletedSuccess")
      : logout === "all"
        ? t("auth.login.logoutAllSuccess")
        : t("auth.login.logoutSuccess"));
    router.replace("/login");
  }, [deleted, logout, router, t]);

  const onSubmit: SubmitHandler<LoginFormField> = async (data) => {
    clearErrors("root");

    try {
      const result = await loginMutation.mutateAsync(data);
      clearErrors("root");
      toast.success(t("auth.login.success"));
      router.push(safeNextPath(next, result.redirectTo));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid email or password.";
      setError("root", { message });
      toast.error(message);
    }
  };

  const isBusy = isSubmitting || loginMutation.isPending;

  const handleGoogleCredential = React.useCallback(async (idToken: string) => {
    try {
      const result = await googleMutation.mutateAsync(idToken);
      toast.success(t("auth.login.success"));
      router.push(safeNextPath(next, result.redirectTo));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed.";
      toast.error(message);
    }
  }, [googleMutation, next, router, t]);

  return (
    <AuthSplitLayout variant="login" panelContent={<LoginPanel />}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile-only logo */}
        <div className="mb-8 lg:hidden">
          <DwelveLogo variant="form" />
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {t("auth.login.access")}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">
              {t("auth.login.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.login.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <GoogleAuthButton
              onCredential={handleGoogleCredential}
              disabled={isBusy || googleMutation.isPending}
              text={t("auth.login.google")}
            />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("auth.login.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          <form className="mt-4 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("auth.login.loginLabel")}
              </label>
              <Input
                {...register("identifier")}
                type="text"
                placeholder={t("auth.login.loginPlaceholder")}
                className={`w-full py-3 ${errors.identifier ? "border-destructive focus:border-destructive" : ""}`}
              />
              {errors.identifier && (
                <p className="mt-1.5 text-xs text-destructive-text">{errors.identifier.message}</p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  {t("auth.login.passwordLabel")}
                </label>
                <Link href="/password-reset" className="text-xs font-medium text-primary hover:text-[var(--primary-hover)]">
                  {t("auth.login.forgot")}
                </Link>
              </div>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.login.passwordPlaceholder")}
                  className={`w-full py-3 pr-11 ${errors.password ? "border-destructive focus:border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-1 right-1 inline-flex w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-destructive-text">{errors.password.message}</p>
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
              {isBusy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : t("auth.login.submit")}
            </Btn>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link href={signupHref} className="font-semibold text-primary hover:text-[var(--primary-hover)]">
              {t("auth.login.signup")}
            </Link>
          </p>

          <p className="mt-10 text-center">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition">
              ← {t("auth.common.backToLanding")}
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
