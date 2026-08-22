"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { GraduationCap } from "lucide-react";

import Button from "@/components/ui/Button";
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
      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-8 flex justify-center">
          <DwelveLogo variant="form" />
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-elev-4">
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
                <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="button"
                onClick={onAccept}
                size="xl"
                className="w-full"
                loading={isBusy}
              >
                {t("auth.invite.accept")}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t("auth.invite.emailMismatchNote")}
              </p>
            </div>
          ) : (
            <div className="mt-7 space-y-3">
              <Button asChild size="xl" className="w-full">
                <Link href={loginHref}>{t("auth.invite.login")}</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="w-full">
                <Link href={signupHref}>{t("auth.invite.signup")}</Link>
              </Button>
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
