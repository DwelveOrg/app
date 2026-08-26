"use client";

import Image from "next/image";
import React from "react";
import { useTranslation } from "react-i18next";

import { DWELVE_ICON_ON_DARK, DWELVE_ICON_ON_LIGHT } from "@/components/Custom/DwelveLogo";

/**
 * The screen that covers the gap between "you are signed in" and "the app is on screen".
 *
 * ## Why this exists at all
 *
 * `docs/design/interaction-and-states.md` §2 says a non-button spinner needs a specific reason.
 * This is the reason. A successful sign-in has a dead zone that no button state can reach:
 *
 *   1. the server action resolves — the session cookie is written, the button stops spinning;
 *   2. `router.push()` starts an RSC fetch for the destination;
 *   3. `(root)/layout.tsx` is `force-dynamic` and awaits `getUser()`, which decrypts the session
 *      **and** calls the NestJS backend through `getSchool()` to re-read the membership role;
 *   4. only once that resolves does the dashboard's `loading.tsx` skeleton get to render.
 *
 * Through steps 2–4 the App Router keeps the *old* page mounted, so the user sits looking at a
 * fully-rendered login form that no longer does anything, for as long as a backend round trip
 * takes. Nothing on that screen says it is mid-navigation. This overlay lives in the auth page's
 * tree precisely because that tree is what stays alive across the transition — the route it hands
 * over to unmounts it when it paints, which is exactly when it should go.
 *
 * ## What it deliberately does not cover
 *
 * The credential check itself. That belongs to the submit button (§5: "the button owns the pending
 * state"), and a full-screen takeover torn down again 700ms later because the password was wrong
 * is worse than no takeover at all. This is raised only after the server has already said yes, so
 * it can never flash.
 */
export type AuthHandoffDestination = "app" | "onboarding";

/**
 * Which of the two stories to tell, from the path actually being pushed.
 *
 * Derived from the real target rather than from the action's `onboardingRequired`, because a
 * `?next=` invite path overrides `redirectTo` — the copy has to follow where the user is going.
 */
export function handoffDestination(target: string): AuthHandoffDestination {
  return target.startsWith("/onboarding") ? "onboarding" : "app";
}

/**
 * When the copy moves from "signing you in" to "preparing your workspace".
 *
 * Both sentences are true for the whole wait — the client cannot observe step 3 above finishing,
 * because `router.push` reports nothing back. The switch is a liveness signal, not a progress
 * claim: it is why the ring's arc steps on a phase change rather than creeping on a timer, and why
 * nothing here ever shows a percentage nobody measured.
 */
const PREPARING_AFTER_MS = 800;

/** Long enough that a normal sign-in never sees it, short enough to arrive before doubt does. */
const SLOW_AFTER_MS = 7000;

type Phase = "signingIn" | "preparing";

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Arc length per phase. The step between them is the one honest "something happened" beat. */
const ARC: Record<Phase, number> = {
  signingIn: 0.28,
  preparing: 0.72,
};

export default function AuthHandoffOverlay({
  destination,
}: Readonly<{ destination: AuthHandoffDestination | null }>) {
  // Mounted only once raised, so its phase state starts fresh rather than being reset from an
  // effect. `destination` is one-way in every caller: nothing lowers it again.
  return destination ? <HandoffPanel destination={destination} /> : null;
}

function HandoffPanel({ destination }: { destination: AuthHandoffDestination }) {
  const { t } = useTranslation();
  const [phase, setPhase] = React.useState<Phase>("signingIn");
  const [slow, setSlow] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const toPreparing = window.setTimeout(() => setPhase("preparing"), PREPARING_AFTER_MS);
    const toSlow = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);

    return () => {
      window.clearTimeout(toPreparing);
      window.clearTimeout(toSlow);
    };
  }, []);

  // Focus moves here so a keyboard user is not left tabbing through a form that is covered, still
  // focusable, and about to be unmounted. The container is an announcement, not a control, so it
  // takes no visible ring — `role="status"` is what carries it to a screen reader.
  React.useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={[
        // No entrance on the sheet itself. It is what blocks a page that is no longer live, so it
        // has to be opaque the instant it mounts: an animated fade-in would leave a transparent,
        // click-swallowing layer over a form that still looks usable if it ever failed to run
        // (design-system §5 — animate from a visible default, never from `opacity: 0`). Landing at
        // once is also the honest response to a click that has already been answered.
        "fixed inset-0 z-50 grid place-items-center overflow-hidden px-6",
        "bg-background/92 supports-backdrop-filter:backdrop-blur-xl focus:outline-none",
      ].join(" ")}
    >
      {/* The same glow language as the auth panel's orbs, so the handoff reads as that surface
          closing rather than as a generic system overlay dropped on top of it. */}
      <div
        aria-hidden
        className="auth-handoff-halo pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-brand-violet/14 blur-[120px] dark:bg-brand-violet/24"
      />

      {/* `layout-enter` is the product's one arrival gesture (fade + 8px rise, 260ms) — the same
          one the app shell uses, so arriving here and arriving there feel like one movement. */}
      <div className="layout-enter relative flex w-full max-w-sm flex-col items-center text-center">
        <HandoffRing phase={phase} />

        <h2 className="type-section mt-7 text-foreground">
          {t(`auth.handoff.${destination}.${phase}.title`)}
        </h2>
        <p className="mt-2 max-w-[32ch] text-sm text-muted-foreground">
          {t(`auth.handoff.${destination}.${phase}.body`)}
        </p>

        {slow ? (
          <p className="layout-enter mt-6 max-w-[42ch] rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-muted-foreground shadow-elev-1">
            {t("auth.handoff.slow")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The mark inside a ring whose arc length is the phase.
 *
 * Decorative in full: the heading below it is the accessible statement of what is happening, and a
 * `progressbar` role here would have to name a value nobody measured.
 */
function HandoffRing({ phase }: { phase: Phase }) {
  return (
    <div aria-hidden className="relative grid size-24 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" role="presentation">
        <defs>
          <linearGradient id="auth-handoff-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-violet-300)" />
            <stop offset="100%" stopColor="var(--brand-violet)" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth="3" />

        {/* -90° so the arc starts at twelve o'clock. The class spins the group; the dash offset is
            what actually changes when the phase does. */}
        <g className="auth-handoff-ring" transform="rotate(-90 50 50)">
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="url(#auth-handoff-arc)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - ARC[phase])}
            className="transition-[stroke-dashoffset] duration-[--dur-4] ease-[--ease-out-quint]"
          />
        </g>
      </svg>

      {/* Light mode → navy mark, dark mode → white mark. Both files are already in cache: the auth
          screen renders one of each (panel logo and mobile form logo) before this ever mounts. */}
      <Image src={DWELVE_ICON_ON_LIGHT} alt="" width={40} height={40} className="size-10 dark:hidden" />
      <Image src={DWELVE_ICON_ON_DARK} alt="" width={40} height={40} className="hidden size-10 dark:block" />
    </div>
  );
}
