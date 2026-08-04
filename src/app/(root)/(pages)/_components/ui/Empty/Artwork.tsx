"use client";

export default function EmptyArtwork() {
  return (
    <div className="relative h-40 w-56 sm:h-44 sm:w-64" aria-hidden>
      <div className="absolute inset-x-6 top-8 h-20 rounded-[28px] border border-border bg-muted" />

      <div className="absolute left-10 top-3 h-10 w-24 rounded-t-[20px] rounded-br-[18px] border border-b-0 border-border bg-muted" />

      <div className="absolute left-14 top-14 h-16 w-12 rotate-[-9deg] rounded-2xl border border-border bg-card shadow-elev-1">
        <div className="mx-auto mt-4 h-1.5 w-6 rounded-full bg-border" />
        <div className="mx-auto mt-2 h-1.5 w-7 rounded-full bg-muted" />
      </div>

      <div className="absolute right-14 top-10 h-18 w-14 rotate-[8deg] rounded-[22px] border border-[color-mix(in_srgb,var(--primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--primary)_10%,var(--card))]">
        <div className="mx-auto mt-4 h-1.5 w-7 rounded-full bg-[color-mix(in_srgb,var(--primary)_45%,transparent)]" />
        <div className="mx-auto mt-2 h-1.5 w-8 rounded-full bg-[color-mix(in_srgb,var(--primary)_25%,transparent)]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <div className="h-3 w-40 rounded-full bg-foreground/8 blur-md dark:bg-black/40" />
      </div>
    </div>
  );
}
