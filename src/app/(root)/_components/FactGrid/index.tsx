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
 * v5.1: the facts lost their boxes. Four identical recessed wells made an entity's facts read as
 * yet another row of stat cards — the exact sameness the maintainer asked to break. Facts now sit
 * directly on the panel, separated by hairlines, each led by its icon in a small accent chip; the
 * dashboard's KPI tiles keep the card shape, so the two kinds of number stop looking alike.
 */
export function FactGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-y-4 sm:grid-cols-2 lg:grid-cols-4",
        "lg:divide-x lg:divide-border",
        className,
      )}
    >
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
    <div className="flex min-w-0 items-start gap-2.5 lg:px-5 lg:first:pl-0 lg:last:pr-0">
      {icon ? (
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        {/*
          `truncate` is deliberate here and not on the entity title: a fact is a short value in a
          fixed-width column, and a wrapping teacher name would make the four columns different
          heights.
        */}
        <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</dd>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

export default FactGrid;
