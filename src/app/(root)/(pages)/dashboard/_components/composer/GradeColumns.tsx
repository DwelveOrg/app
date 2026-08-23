"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import type { Distributions } from "@/app/(root)/_lib/dashboard.schemas";

/**
 * Grade distribution as ordered columns.
 *
 * The buckets are ordinal — A above B above C above D/F — and a donut throws
 * that order away, leaving the reader to reassemble it from a legend. Columns
 * keep the scale on the x-axis where it already lives in every teacher's head,
 * and one hue is enough: the buckets are positions on a scale, not four
 * different subjects, so identity comes from the axis label, not from color.
 */
export default function GradeColumns({
  grades,
}: {
  grades: Distributions["grades"];
}) {
  const total = grades.reduce((sum, grade) => sum + grade.count, 0);
  if (!total) return null;

  return (
    <figure className="m-0 min-w-0">
      <div className="h-52 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          {/* Every column carries its value, so a y-axis would state each fact
              twice; the one drawn line is the shared baseline the bars grow
              from. */}
          <BarChart data={grades} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
            <XAxis
              dataKey="bucket"
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as
                  | Distributions["grades"][number]
                  | undefined;
                return active && row ? (
                  <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-elev-3">
                    <p className="text-xs font-semibold text-foreground">{row.bucket}</p>
                    <p className="numeric mt-0.5 text-xs text-muted-foreground">
                      {row.count} · {Math.round((row.count / total) * 100)}%
                    </p>
                  </div>
                ) : null;
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
              label={{
                position: "top",
                fill: "var(--foreground)",
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {grades.map((grade) => `${grade.bucket}: ${grade.count}`).join(", ")}
      </figcaption>
    </figure>
  );
}
