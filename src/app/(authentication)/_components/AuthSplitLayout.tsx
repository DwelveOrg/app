import Image from "next/image";
import type { ReactNode } from "react";

export type AuthLayoutVariant = "login" | "signup" | "admin";

type PanelConfig = {
  imageSrc: string;
  imageAlt: string;
  /** Tailwind gradient stop classes applied over the photo */
  gradient: string;
  /** Glow orb colour classes — three positioned blobs for depth */
  orb1: string;
  orb2: string;
  orb3: string;
};

// The three panels previously ran indigo / cyan-teal / fuchsia — three unrelated
// hues across three screens of one product. They now differentiate by depth
// within the single brand ramp (ink → violet-900 → violet-800 → violet-600):
// login sits deepest, signup opens up toward the accent, admin stays authoritative.
const PANEL_CONFIGS: Record<AuthLayoutVariant, PanelConfig> = {
  login: {
    imageSrc:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Students collaborating at laptops",
    gradient: "from-brand-ink/92 via-brand-violet-900/74 to-brand-violet-800/62",
    orb1: "bg-brand-violet-600/18",
    orb2: "bg-brand-violet/14",
    orb3: "bg-brand-violet-800/12",
  },
  signup: {
    imageSrc:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Student focused at study desk",
    gradient: "from-brand-violet-900/86 via-brand-violet-800/66 to-brand-ink/88",
    orb1: "bg-brand-violet/16",
    orb2: "bg-brand-violet-300/12",
    orb3: "bg-brand-violet-600/12",
  },
  admin: {
    imageSrc:
      "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Lecture hall aerial view",
    gradient: "from-brand-ink/94 via-brand-violet-900/72 to-brand-violet-800/64",
    orb1: "bg-brand-violet-800/20",
    orb2: "bg-brand-violet/12",
    orb3: "bg-brand-violet-900/16",
  },
};

type AuthSplitLayoutProps = {
  /** Controls the background photo and gradient colour theme of the left panel. */
  variant: AuthLayoutVariant;
  /** Content rendered inside the left photo panel (logo, cards, social proof). */
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
      <div className="relative hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col overflow-hidden">
        {/* Background photo */}
        <Image
          src={cfg.imageSrc}
          alt={cfg.imageAlt}
          fill
          className="object-cover object-center"
          priority
          sizes="46vw"
        />
        {/* Brand gradient overlay — unique per variant */}
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient}`} />
        {/* Glowing orbs for depth */}
        <div className={`absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full ${cfg.orb1} blur-[80px]`} />
        <div className={`absolute top-1/2 -left-32 h-80 w-80 rounded-full ${cfg.orb2} blur-[70px]`} />
        <div className={`absolute -bottom-16 right-16 h-64 w-64 rounded-full ${cfg.orb3} blur-[60px]`} />
        {/* Subtle dot-grid texture */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.055]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="auth-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-dots)" />
        </svg>
        {/* Bottom vignette so panel text always reads against dark */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Panel content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          {panelContent}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-background">
        {children}
      </div>
    </div>
  );
}
