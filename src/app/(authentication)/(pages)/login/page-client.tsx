"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { loginSchema, LoginFormField } from "@/app/(authentication)/_types/_schemas/index";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import type { LoginPageClientProps } from "@/app/(authentication)/_types/ui";
import AuthSplitLayout from "../../_components/AuthSplitLayout";
import DwelveLogo from "@/components/Custom/DwelveLogo";
import { marketingHref } from "@/lib/hosts";
import LoginPanel from "./_sections/LoginPanel";
import { useLoginMutation, useGoogleAuthMutation } from "../../_hooks/useAuthMutations";
import GoogleAuthButton from "../../_components/GoogleAuthButton";
import TelegramAuthButton from "../../_components/TelegramAuthButton";
import TelegramAuthNotice from "../../_components/TelegramAuthNotice";
import AuthHandoffOverlay, {
  handoffDestination,
  type AuthHandoffDestination,
} from "../../_components/AuthHandoff";
import { safeNextPath } from "../../_utils/next-path";
import {
  parseTelegramAuthStatus,
  telegramStartHref,
} from "../../_utils/telegram-start";

export default function LoginPageClient({
  deleted,
  logout,
  next,
  telegram,
}: Readonly<LoginPageClientProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  const statusToastShownRef = React.useRef(false);
  // Raised once the server has accepted the credential, and never lowered: the overlay stays up
  // through `router.push` and is unmounted by the route it hands over to. See AuthHandoff.tsx.
  const [handoff, setHandoff] = React.useState<AuthHandoffDestination | null>(null);
  const loginMutation = useLoginMutation();
  const googleMutation = useGoogleAuthMutation();
  const telegramStatus = parseTelegramAuthStatus(telegram);
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
      const target = safeNextPath(next, result.redirectTo);
      clearErrors("root");
      setHandoff(handoffDestination(target));
      toast.success(t("auth.login.success"));
      router.push(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid email or password.";
      setError("root", { message });
      toast.error(message);
    }
  };

  // `handoff` is part of busy so the submit button keeps its spinner while the overlay is up —
  // it stays faintly visible through the blur, and a button that snaps back to rest under it
  // would read as the attempt having been dropped.
  const isBusy =
    isSubmitting || loginMutation.isPending || googleMutation.isPending || handoff !== null;

  const handleGoogleCredential = React.useCallback(async (idToken: string) => {
    try {
      const result = await googleMutation.mutateAsync(idToken);
      const target = safeNextPath(next, result.redirectTo);
      setHandoff(handoffDestination(target));
      toast.success(t("auth.login.success"));
      router.push(target);
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
            <h1 className="type-title text-foreground">
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
              verifying={googleMutation.isPending}
              text={t("auth.login.google")}
              waitingText={t("auth.login.googleWaiting")}
              verifyingText={t("auth.login.googleVerifying")}
              unavailableText={t("auth.login.googleUnavailable")}
            />

            <TelegramAuthButton
              href={telegramStartHref("login", next)}
              disabled={isBusy}
              text={t("auth.telegram.continue")}
              openingText={t("auth.telegram.opening")}
            />

            <TelegramAuthNotice
              status={telegramStatus}
              message={telegramStatus ? t(`auth.telegram.${telegramStatus}`) : undefined}
            />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">{t("auth.login.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          <form className="mt-4 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field label={t("auth.login.loginLabel")} error={errors.identifier?.message}>
              <Input
                {...register("identifier")}
                type="text"
                placeholder={t("auth.login.loginPlaceholder")}
                className={`w-full py-3 ${errors.identifier ? "border-destructive focus:border-destructive" : ""}`}
              />
            </Field>

            {/*
              No `label` prop: the reset link sits on the label row, and Field renders its label
              inside a `<label>` element — a link nested there would steal the click that is
              supposed to focus the input. The header stays hand-built; the error does not.
            */}
            <Field error={errors.password?.message}>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  {t("auth.login.passwordLabel")}
                </label>
                <Link href="/password-reset" className="text-xs font-medium text-primary hover:text-primary-hover">
                  {t("auth.login.forgot")}
                </Link>
              </div>
              <Input
                id="login-password"
                {...register("password")}
                type="password"
                placeholder={t("auth.login.passwordPlaceholder")}
                revealLabel={t("auth.login.showPassword")}
                hideLabel={t("auth.login.hidePassword")}
                aria-invalid={Boolean(errors.password)}
              />
            </Field>

            {errors.root && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" size="xl" className="w-full" loading={isBusy}>
              {t("auth.login.submit")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link href={signupHref} className="font-semibold text-primary hover:text-primary-hover">
              {t("auth.login.signup")}
            </Link>
          </p>

          <p className="mt-10 text-center">
            <Link href={marketingHref("/")} className="text-xs text-muted-foreground hover:text-foreground transition">
              ← {t("auth.common.backToLanding")}
            </Link>
          </p>
        </div>
      </div>
      <AuthHandoffOverlay destination={handoff} />
    </AuthSplitLayout>
  );
}
