import type { ReactNode } from "react";

import DwelveLogo from "@/components/Custom/DwelveLogo";

type Avatar = {
  initials: string;
  color: string;
};

export function AuthPanelLogo() {
  return <DwelveLogo />;
}

export function AuthPanelHeading({
  titleLine1,
  titleLine2,
  children,
}: {
  titleLine1: ReactNode;
  titleLine2: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-serif text-[2.5rem] leading-[1.12] tracking-tight text-white">
        {titleLine1}
        <br />
        {titleLine2}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{children}</p>
    </div>
  );
}

export function AuthStatusBadge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success shadow-[0_0_6px_color-mix(in_srgb,var(--success)_90%,transparent)]" />
      {children}
    </div>
  );
}

export function AvatarStack({ avatars, extra = "+" }: { avatars: Avatar[]; extra?: ReactNode }) {
  return (
    <div className="flex -space-x-2.5">
      {avatars.map((avatar) => (
        <div
          key={avatar.initials}
          // `color` is a chart token, so the tint follows the palette instead of a raw Tailwind hue.
          style={{ background: avatar.color }}
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/25 text-3xs font-bold text-white shadow-elev-2"
        >
          {avatar.initials}
        </div>
      ))}
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/20 bg-white/15 text-xs font-semibold text-white backdrop-blur-sm">
        {extra}
      </div>
    </div>
  );
}

export function SocialProof({
  avatars,
  title,
  subtitle,
}: {
  avatars: Avatar[];
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <AvatarStack avatars={avatars} />
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/70">{subtitle}</p>
      </div>
    </div>
  );
}

export function FeatureTile({ icon, label }: { icon: ReactNode; label: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 backdrop-blur-sm">
      <span className="text-base text-white">{icon}</span>
      <span className="text-xs font-medium text-white">{label}</span>
    </div>
  );
}
