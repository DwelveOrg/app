"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { GraduationCap, LoaderCircle } from "lucide-react";

import Btn from "@/components/Custom/CustomButton";
import DwelveLogo from "@/components/Custom/DwelveLogo";
import { useAcceptTeacherInviteMutation } from "@/app/(authentication)/_hooks/useAuthMutations";

type InviteAcceptClientProps = {
  token: string;
  isAuthenticated: boolean;
  email?: string;
};

export default function InviteAcceptClient({
  token,
  isAuthenticated,
  email,
}: Readonly<InviteAcceptClientProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const acceptMutation = useAcceptTeacherInviteMutation();
  const [error, setError] = React.useState<string | null>(null);

  const nextPath = `/invite/teacher/${encodeURIComponent(token)}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  const onAccept = async () => {
    setError(null);

    try {
      const result = await acceptMutation.mutateAsync(token);
      toast.success(t("auth.invite.success"));
      router.push(result.redirectTo);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.invite.error");
      setError(message);
      toast.error(message);
    }
  };

  const isBusy = acceptMutation.isPending;

  return (
    <div className="app-shell-bg relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/12 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-primary/8 blur-[80px]" />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <DwelveLogo variant="form" />
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <GraduationCap className="h-7 w-7" />
          </div>

          <h1 className="text-center text-2xl font-bold text-foreground">
            {t("auth.invite.teacherTitle")}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {isAuthenticated
              ? t("auth.invite.teacherSubtitle")
              : t("auth.invite.authPromptSubtitle")}
          </p>

          {isAuthenticated ? (
            <div className="mt-7 space-y-4">
              {email && (
                <p className="text-center text-xs text-muted-foreground">
                  {t("auth.invite.signedInAs", { email })}
                </p>
              )}

              {error && (
                <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive-text">
                  {error}
                </div>
              )}

              <Btn
                type="button"
                onClick={onAccept}
                disabled={isBusy}
                className="w-full flex items-center justify-center py-3 text-sm"
              >
                {isBusy ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  t("auth.invite.accept")
                )}
              </Btn>

              <p className="text-center text-xs text-muted-foreground">
                {t("auth.invite.emailMismatchNote")}
              </p>
            </div>
          ) : (
            <div className="mt-7 space-y-3">
              <Link href={loginHref} className="block">
                <Btn type="button" className="w-full flex items-center justify-center py-3 text-sm">
                  {t("auth.invite.login")}
                </Btn>
              </Link>
              <Link
                href={signupHref}
                className="flex w-full items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                {t("auth.invite.signup")}
              </Link>
            </div>
          )}
        </div>

        <p className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            &larr; {t("auth.invite.backToLanding")}
          </Link>
        </p>
      </div>
    </div>
  );
}
