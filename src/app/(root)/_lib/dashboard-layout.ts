import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { DashboardAvailability } from "../_utils/getDashboard";

/**
 * How far along this member is, derived from what the API actually returned.
 *
 * The dashboard reads very differently at each stage, so the stage — not just
 * the role — decides which modules appear and how wide they are. A brand-new
 * admin needs setup actions filling the page; an established one needs charts.
 */
export type DashboardStage =
  | "fresh" // No classes yet. Nothing to measure; lead with setup.
  | "populating" // Classes exist, but no people or assessments in them.
  | "awaiting" // People and assessments exist, but nothing graded yet.
  | "active"; // Results are flowing; analytics carry the page.

export function deriveStage(
  role: SchoolRole,
  availability: DashboardAvailability,
): DashboardStage {
  if (!availability.hasClasses) {
    return "fresh";
  }

  if (availability.hasResults) {
    return "active";
  }

  // Students have no roster to fill, so "populating" for them means enrolled
  // but with nothing scheduled yet.
  const populated =
    role === "STUDENT"
      ? availability.hasUpcoming || availability.hasActivity
      : availability.hasStudents;

  return populated ? "awaiting" : "populating";
}

export const GRID_COLUMNS = 12;

export type PackInput = {
  id: string;
  /** Preferred width in 12ths. */
  span: number;
  /** Smallest width this module stays readable at. Defaults to `span`. */
  minSpan?: number;
  /** Never widen past this, even to fill a row. Defaults to `GRID_COLUMNS`. */
  maxSpan?: number;
};

export type PackedItem<T extends PackInput> = T & { span: number; row: number };

/**
 * Packs modules into rows that always sum to exactly 12.
 *
 * The previous layout assigned fixed spans (7, 5, 7, 6, …) and let CSS grid
 * wrap them. Any row whose next module did not fit stranded the remainder as
 * dead space — a teacher dashboard wasted 5 of 12 columns on two separate rows.
 * Packing explicitly and stretching the row's items to absorb the remainder
 * makes that class of gap structurally impossible.
 */
export function packRows<T extends PackInput>(items: T[]): PackedItem<T>[] {
  const rows: T[][] = [];
  let current: T[] = [];
  let used = 0;

  for (const item of items) {
    const span = clamp(item.span, 1, GRID_COLUMNS);
    const min = clamp(item.minSpan ?? span, 1, span);

    // Start a new row when even the module's minimum will not fit.
    if (used + min > GRID_COLUMNS && current.length > 0) {
      rows.push(current);
      current = [];
      used = 0;
    }

    current.push(item);
    used += span;
  }

  if (current.length > 0) {
    rows.push(current);
  }

  return rows.flatMap((row, rowIndex) => fitRow(row, rowIndex));
}

/**
 * Resolves one row to exactly `GRID_COLUMNS`, shrinking toward each module's
 * `minSpan` when the row overflows and growing toward `maxSpan` when it is
 * short. Growth is spread from the widest module down so a narrow list panel
 * next to a chart does not balloon.
 */
function fitRow<T extends PackInput>(row: T[], rowIndex: number): PackedItem<T>[] {
  const spans = row.map((item) => clamp(item.span, 1, GRID_COLUMNS));
  const mins = row.map((item, index) =>
    clamp(item.minSpan ?? spans[index], 1, spans[index]),
  );
  const maxes = row.map((item) => clamp(item.maxSpan ?? GRID_COLUMNS, 1, GRID_COLUMNS));

  let total = sum(spans);

  // Overflow: take columns back, widest first, never below minSpan.
  while (total > GRID_COLUMNS) {
    const index = widestReducibleIndex(spans, mins);
    if (index === -1) break;
    spans[index] -= 1;
    total -= 1;
  }

  // Shortfall: hand columns out, widest first, never above maxSpan.
  while (total < GRID_COLUMNS) {
    const index = widestGrowableIndex(spans, maxes);
    if (index === -1) break;
    spans[index] += 1;
    total += 1;
  }

  return row.map((item, index) => ({ ...item, span: spans[index], row: rowIndex }));
}

function widestReducibleIndex(spans: number[], mins: number[]) {
  let best = -1;
  for (let index = 0; index < spans.length; index += 1) {
    if (spans[index] > mins[index] && (best === -1 || spans[index] > spans[best])) {
      best = index;
    }
  }
  return best;
}

function widestGrowableIndex(spans: number[], maxes: number[]) {
  let best = -1;
  for (let index = 0; index < spans.length; index += 1) {
    if (spans[index] < maxes[index] && (best === -1 || spans[index] > spans[best])) {
      best = index;
    }
  }
  return best;
}

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Static span → class map. Tailwind only emits classes it can see as literal
 * strings, so these cannot be built by interpolation. Below `lg` every module
 * is full width, which also keeps the grid from inventing implicit columns the
 * way an inline `grid-column: span 7` did on a one-column mobile grid.
 */
export const SPAN_CLASS: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
  9: "lg:col-span-9",
  10: "lg:col-span-10",
  11: "lg:col-span-11",
  12: "lg:col-span-12",
};
