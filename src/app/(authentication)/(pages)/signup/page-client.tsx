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
import TelegramAuthPanel from "../../_components/TelegramAuthPanel";
import {
  AuthMethodPanel,
  AuthMethodTabs,
  type AuthMethod,
} from "../../_components/AuthMethodTabs";
import AuthHandoffOverlay, {
  handoffDestination,
  type AuthHandoffDestination,
} from "../../_components/AuthHandoff";
import { safeNextPath } from "../../_utils/next-path";
import {
  parseTelegramAuthStatus,
  telegramStartHref,
} from "../../_utils/telegram-start";

type SignupPageClientProps = {
  /** Root-relative path to return to after signup (e.g. an invite). */
  next?: string;
  telegram?: string;
};

export default function SignupPageClient({ next, telegram }: Readonly<SignupPageClientProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const googleMutation = useGoogleAuthMutation();
  const telegramStatus = parseTelegramAuthStatus(telegram);
  // Open on the Telegram method when its outcome is in the URL, so its notice is what greets the user.
  const [method, setMethod] = React.useState<AuthMethod>(telegramStatus ? "telegram" : "email");
  // Raised once the server has accepted the account, and never lowered — see AuthHandoff.tsx.
  const [handoff, setHandoff] = React.useState<AuthHandoffDestination | null>(null);
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
      const target = safeNextPath(next, result.redirectTo);
      clearErrors("root");
      setHandoff(handoffDestination(target));
      toast.success(t("auth.signup.success"));
      router.push(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please check the form and try again.";
      setError("root", { message });
      toast.error(message);
    }
  };

  // Includes `handoff` so the submit button keeps its spinner under the overlay rather than
  // snapping back to rest behind the blur.
  const isBusy =
    isSubmitting || signupMutation.isPending || googleMutation.isPending || handoff !== null;

  const handleGoogleCredential = React.useCallback(async (idToken: string) => {
    try {
      const result = await googleMutation.mutateAsync(idToken);
      const target = safeNextPath(next, result.redirectTo);
      setHandoff(handoffDestination(target));
      toast.success(t("auth.signup.success"));
      router.push(target);
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
            <h1 className="type-title text-foreground">
              {t("auth.signup.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.signup.subtitle")}
            </p>
          </div>

          <AuthMethodTabs
            value={method}
            onChange={setMethod}
            label={t("auth.signup.methodsLabel")}
            labels={{
              email: t("auth.methods.email"),
              google: t("auth.methods.google"),
              telegram: t("auth.methods.telegram"),
            }}
          >
            <AuthMethodPanel value="email">
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            </AuthMethodPanel>

            <AuthMethodPanel value="google">
              <p className="text-sm text-muted-foreground">{t("auth.google.description")}</p>
              <div className="mt-4">
                <GoogleAuthButton
                  onCredential={handleGoogleCredential}
                  disabled={isBusy || googleMutation.isPending}
                  verifying={googleMutation.isPending}
                  text={t("auth.signup.google")}
                  waitingText={t("auth.signup.googleWaiting")}
                  verifyingText={t("auth.signup.googleVerifying")}
                  unavailableText={t("auth.signup.googleUnavailable")}
                />
              </div>
            </AuthMethodPanel>

            <AuthMethodPanel value="telegram">
              <TelegramAuthPanel
                source="signup"
                href={telegramStartHref("signup", next)}
                disabled={isBusy}
                status={telegramStatus}
                onSwitchMethod={() => setMethod("email")}
              />
            </AuthMethodPanel>
          </AuthMethodTabs>

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
      <AuthHandoffOverlay destination={handoff} />
    </AuthSplitLayout>
  );
}
