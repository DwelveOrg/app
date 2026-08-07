import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The labelled facts row under an entity header: "Teacher — Ольга", "Questions — 40".
 *
 * The class page and the test builder are the same kind of page — an entity, its facts, then the
 * things inside it — and both were drawing this grid themselves. Two call sites hard-coding their
 * own tile padding for "the same" fact is the drift `docs/design/design-system.md` §8 exists to
 * prevent, so the grid and its tile live here.
 *
 * Tiles are `--background` inside a `--card` surface: a well recessed *into* the panel rather than
 * a second card stacked on it, which keeps the depth ladder at one level (§4, "never nest cards").
 */
export function FactGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </dl>
  );
}

export type FactProps = {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  /** Secondary line under the value — a capacity warning, a count of the rest. */
  hint?: string;
};

/** One labelled fact. */
export function Fact({ icon, label, value, hint }: FactProps) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon ? (
          <span aria-hidden="true" className="text-muted-foreground">
            {icon}
          </span>
        ) : null}
        {label}
      </dt>
      {/*
        `truncate` is deliberate here and not on the entity title: a fact is a short value in a
        fixed-width tile, and a wrapping teacher name would make the four tiles different heights.
      */}
      <dd className="mt-1 truncate text-sm font-semibold text-foreground">{value}</dd>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default FactGrid;
