"use client";

import type { ReactNode } from "react";
import Surface from "@/components/ui/Surface";

/**
 * A labelled group inside the account area: a quiet section label above a single
 * flat panel whose rows are separated by hairline dividers. Replaces the old
 * card-inside-card pattern (SectionCard wrapping bordered Row cards) so the
 * surface reads as one structured list, not stacked floating cards.
 */
export function AccountGroup({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <section>
      <h2 className="mb-2.5 px-1 text-13 font-semibold text-muted-foreground">
        {label}
      </h2>
      <Surface divided>{children}</Surface>
    </section>
  );
}
