import type { ClassFilter } from "../_types";

export const classFilters: ClassFilter[] = ["all", "active", "archived"];

export const classFilterLabelKeys: Record<ClassFilter, string> = {
  all: "root.classes.filters.all",
  active: "root.classes.filters.active",
  archived: "root.classes.filters.archived",
};

/**
 * Decorative class tints.
 *
 * These used to be six raw Tailwind hues (indigo/amber/emerald/pink/sky/orange), each with a
 * hand-written `dark:` variant — the only multi-hue palette in the authenticated app, and the one
 * place a new brand colour would have looked obviously wrong. They now come from the chart ramp, so
 * they follow the theme, need no `dark:` overrides, and stay inside the documented palette.
 *
 * Uses the ramp's `-tint` / `-ink` pair rather than mixing the raw value: the fill is light enough
 * to sit under the initial in both themes, and the ink is deepened just far enough that the pairing
 * clears 4.5:1. The raw ramp only cleared AA here while the initial was 16px bold (large text); the
 * shared `Avatar` renders it smaller, at which point three of the five slots would have failed.
 *
 * Written out one per line, deliberately. These were previously generated with
 * `[1,2,3,4,5].map(slot => \`bg-[…var(--chart-${slot})…]\`)`, which Tailwind's scanner cannot see —
 * it matches class names as literal text in the source, and a template hole is not a class name.
 * The utilities were never generated, so every accent tile rendered with a transparent background
 * and inherited text colour. Keep these literal.
 */
export const classAccents = [
  "bg-[var(--chart-1-tint)] text-[var(--chart-1-ink)]",
  "bg-[var(--chart-2-tint)] text-[var(--chart-2-ink)]",
  "bg-[var(--chart-3-tint)] text-[var(--chart-3-ink)]",
  "bg-[var(--chart-4-tint)] text-[var(--chart-4-ink)]",
  "bg-[var(--chart-5-tint)] text-[var(--chart-5-ink)]",
];

/**
 * Deterministic accent for a class from its id, so a class keeps the same colour across filters and
 * page loads (the real ids are opaque, so we hash them into the palette rather than relying on
 * array position).
 */
export function classAccent(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return classAccents[hash % classAccents.length];
}
