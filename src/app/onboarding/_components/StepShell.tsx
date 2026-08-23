"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import DwelveLogo from "@/components/Custom/DwelveLogo";
import { Button } from "@/components/ui/Button";

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Title and description — centred, on a narrow measure.
 *
 * Centring is the change. The old wizard set every step left-aligned against a
 * `max-w-6xl` column, which put the title in the top-left corner of a very wide
 * empty page and gave the flow no focal point. One question at a time reads
 * better centred: the eye lands on the title, then falls straight into the
 * work below it.
 */
export function StepHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-[42rem] text-center">
      {/* The step's short name used to sit here as an eyebrow — a smaller
          restatement of the title directly above the title. The heading
          carries its own weight. */}
      <h1 className="type-title text-foreground">{title}</h1>
      {description ? (
        <p className="mx-auto mt-3 max-w-[52ch] text-base leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The step's own controls: a quiet way past on the left, the real action right.
 *
 * It is deliberately not sticky. The old footer was a full-width bar pinned to
 * the bottom of the viewport with a border and a blur, which meant every step —
 * including ones with three lines of content — carried a permanent slab of
 * chrome. Here the row simply ends the step, and a long step scrolls to reach
 * it like any other page.
 */
export function StepActions({
  secondary,
  children,
}: {
  secondary?: ReactNode;
  children?: ReactNode;
}) {
  if (!secondary && !children) return null;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">{secondary}</div>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * The escapes, below the step's own controls.
 *
 * Skipping the whole flow and signing out are both real needs — onboarding is a
 * full-screen route with no sidebar, so an account that landed in the wrong
 * school has no other way out — but neither is what the step is asking for.
 * Keeping them here, small and after the action, means they are always
 * available and never compete with it.
 */
export function StepEscapes({
  onSkipAll,
  onLogOut,
  showSkipAll,
  busy,
}: {
  onSkipAll: () => void;
  onLogOut: () => void;
  showSkipAll: boolean;
  busy: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 type-caption text-muted-foreground">
      {showSkipAll ? (
        <>
          <button
            type="button"
            onClick={onSkipAll}
            disabled={busy}
            className="interactive rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
          >
            {t("onboarding.actions.skipAll")}
          </button>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
        </>
      ) : null}
      <button
        type="button"
        onClick={onLogOut}
        disabled={busy}
        className="interactive rounded-sm underline underline-offset-4 outline-none hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
      >
        {t("onboarding.actions.logOut")}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Book-ends                                                                  */
/* -------------------------------------------------------------------------- */

/** The two arrow chips under the opening screen's call to action. */
function ArrowKeyHint() {
  const { t } = useTranslation();

  return (
    <p className="mt-6 flex items-center justify-center gap-1.5 type-caption text-muted-foreground">
      <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-mono text-3xs">
        ←
      </kbd>
      <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-mono text-3xs">
        →
      </kbd>
      {t("onboarding.progress.hint")}
    </p>
  );
}

/**
 * The opening screen: brand, greeting, one way forward.
 *
 * Nothing is asked here on purpose. The first screen of setup is the one place
 * where the honest content is "here is what this is" — a form or a card grid at
 * this position makes the flow feel longer than it is, because the user has to
 * evaluate something before they have agreed to start.
 */
export function HeroStep({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action: ReactNode;
  /** Optional supporting detail, sat well below the call to action. */
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[42rem] text-center">
      <div className="flex justify-center">
        <DwelveLogo variant="form" />
      </div>

      <h1 className="mt-10 type-display text-foreground">{title}</h1>
      {description ? (
        <p className="mx-auto mt-4 max-w-[46ch] text-base leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}

      <div className="mt-9 flex justify-center">{action}</div>
      <ArrowKeyHint />

      {children ? <div className="mt-14 text-left">{children}</div> : null}
    </div>
  );
}

/**
 * The closing screen.
 *
 * A tick in a soft square rather than a full-bleed success banner: the flow is
 * finishing, not reporting an outcome, and the only thing that should draw the
 * eye is the button out.
 */
export function DoneStep({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[42rem] text-center">
      <div className="flex justify-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-elev-1">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-success/15 text-success">
            <Check className="size-5" />
          </span>
        </span>
      </div>

      <h1 className="mt-10 type-display text-foreground">{title}</h1>
      {description ? (
        <p className="mx-auto mt-4 max-w-[46ch] text-base leading-7 text-muted-foreground">
          {description}
        </p>
      ) : null}

      <div className="mt-9 flex justify-center">{action}</div>
    </div>
  );
}

/** The pill-shaped primary used by the two book-end screens. */
export function HeroAction({
  onClick,
  busy,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="xl"
      onClick={onClick}
      disabled={busy}
      loading={busy}
      className="rounded-[var(--radius-pill)] px-7"
    >
      {children}
    </Button>
  );
}
