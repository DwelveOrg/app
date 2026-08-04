import type { ReactNode } from "react";

export type AuthLayoutVariant = "login" | "signup" | "admin";

type PanelConfig = {
  /** Base wash over the panel — the depth the variant sits at in the violet ramp. */
  gradient: string;
  /** Three positioned glow orbs, back to front. */
  orb1: string;
  orb2: string;
  orb3: string;
};

/**
 * The auth panel is the one place violet gets to be loud.
 *
 * Violet is the identity accent (design-system §3) and this is a brand surface, not a task
 * surface — the product's teal action colour appears here only on the form side.
 *
 * The three variants used to run indigo / cyan-teal / fuchsia — three unrelated hues across three
 * screens of one product. They now differentiate by *depth* within the single brand ramp
 * (ink → violet-900 → violet-800 → violet-600): login sits deepest, signup opens toward the accent,
 * admin stays authoritative.
 *
 * There is no photograph. Each panel used to hotlink a different Unsplash URL, which meant three
 * uncached third-party requests on the critical path of the sign-in screen, a layout that broke if
 * the CDN was slow or blocked, and a stock-photo look the rest of the product does not have. The
 * composition below is rendered entirely from tokens.
 */
const PANEL_CONFIGS: Record<AuthLayoutVariant, PanelConfig> = {
  login: {
    gradient:
      "bg-[linear-gradient(150deg,var(--brand-ink)_0%,var(--brand-violet-900)_48%,var(--brand-violet-800)_100%)]",
    orb1: "bg-brand-violet-600/30",
    orb2: "bg-brand-violet/20",
    orb3: "bg-brand-violet-800/24",
  },
  signup: {
    gradient:
      "bg-[linear-gradient(150deg,var(--brand-violet-900)_0%,var(--brand-violet-800)_52%,var(--brand-ink)_100%)]",
    orb1: "bg-brand-violet/26",
    orb2: "bg-brand-violet-300/20",
    orb3: "bg-brand-violet-600/22",
  },
  admin: {
    gradient:
      "bg-[linear-gradient(150deg,var(--brand-ink)_0%,var(--brand-violet-900)_58%,var(--brand-violet-800)_100%)]",
    orb1: "bg-brand-violet-800/32",
    orb2: "bg-brand-violet/18",
    orb3: "bg-brand-violet-900/28",
  },
};

type AuthSplitLayoutProps = {
  /** Controls the gradient depth and glow placement of the left panel. */
  variant: AuthLayoutVariant;
  /** Content rendered inside the left panel (logo, cards, social proof). */
  panelContent: ReactNode;
  /** The form / right-side content. */
  children: ReactNode;
};

export default function AuthSplitLayout({
  variant,
  panelContent,
  children,
}: AuthSplitLayoutProps) {
  const cfg = PANEL_CONFIGS[variant];

  return (
    <div className="flex min-h-screen w-full">
      {/* ── Left visual panel (hidden below lg) ── */}
      <div
        className={`relative hidden flex-col overflow-hidden lg:flex lg:w-[44%] xl:w-[46%] ${cfg.gradient}`}
      >
        {/* Glow orbs — depth without an image. */}
        <div
          aria-hidden
          className={`absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full blur-[80px] ${cfg.orb1}`}
        />
        <div
          aria-hidden
          className={`absolute -left-32 top-1/2 h-80 w-80 rounded-full blur-[70px] ${cfg.orb2}`}
        />
        <div
          aria-hidden
          className={`absolute -bottom-16 right-16 h-64 w-64 rounded-full blur-[60px] ${cfg.orb3}`}
        />

        {/* Ruled paper: the one figurative gesture, and the only one that is on-brand for a
            testing product. Two hairline grids at different pitches so it reads as a page. */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="auth-rule" x="0" y="0" width="120" height="28" patternUnits="userSpaceOnUse">
              <line x1="0" y1="27.5" x2="120" y2="27.5" stroke="white" strokeWidth="1" />
            </pattern>
            <pattern id="auth-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-rule)" />
          <rect width="100%" height="100%" fill="url(#auth-dots)" opacity="0.55" />
        </svg>

        {/* Bottom vignette so panel text always reads against dark. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-brand-ink/55 to-transparent"
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          {panelContent}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-background">{children}</div>
    </div>
  );
}
