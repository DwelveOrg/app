"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";

/**
 * Route error boundary for the authenticated shell.
 *
 * There was no `error.tsx` anywhere in the app before this — a single uncaught
 * throw in any server component (a Zod response schema drifting against the
 * NestJS backend is the likely one) took down the whole shell and left the user
 * on Next's default error screen with no way back.
 *
 * This deliberately does NOT reuse `ResourceStateView`: that component is for a
 * *resolved* state a page fetched successfully (forbidden / not-found), and it
 * renders a back link derived from the route. An error boundary catches the
 * render itself, so there is no resolved route context to derive from — only
 * `reset()` and a route home.
 */
export default function RootError({
  error,
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  const { t } = useTranslation();

  useEffect(() => {
    // The digest is the only handle on the server-side stack, which Next strips
    // from the client payload in production. Without logging it here, a report
    // of "the page broke" cannot be tied to anything in the server logs.
    console.error("[route error]", error.digest ?? "(no digest)", error);
  }, [error]);

  return (
    <section className="flex flex-col gap-6 py-6">
      <Surface as="div" padding="lg" className="flex flex-col items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>

        <div className="flex flex-col gap-1.5">
          <h1 className="type-heading text-foreground">{t("root.errorBoundary.title")}</h1>
          <p className="max-w-[68ch] text-sm text-muted-foreground">
            {t("root.errorBoundary.description")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={reset}>
            <RefreshCw className="size-4" />
            {t("root.errorBoundary.retry")}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">{t("root.errorBoundary.home")}</Link>
          </Button>
        </div>
      </Surface>
    </section>
  );
}
