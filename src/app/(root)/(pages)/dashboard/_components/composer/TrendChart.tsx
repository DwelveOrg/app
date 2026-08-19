"use client";

import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ScoreTrend } from "@/app/(root)/_lib/dashboard.schemas";

/** The three ways this series can be drawn. See `TrendChartTypeToggle`. */
export const TREND_CHART_TYPES = ["area", "line", "bar"] as const;
export type TrendChartType = (typeof TREND_CHART_TYPES)[number];

function monthLabel(month: string, language: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  if (!year || !monthIndex) return month;
  return new Intl.DateTimeFormat(language || "en", { month: "short" }).format(
    new Date(Date.UTC(year, monthIndex - 1, 1)),
  );
}

/**
 * Average score over time.
 *
 * ## Why the shape is a choice
 *
 * The three forms answer three different questions about the same numbers, and
 * which one is right depends on data this component cannot know in advance:
 *
 * - **Area** — the default. Reads as one continuous quantity and is the easiest
 *   shape to glance at over a long run of months.
 * - **Line** — the same trajectory without the fill. Better when the interesting
 *   part is the *slope* rather than the level, because a filled region draws the
 *   eye to area rather than to direction.
 * - **Bar** — each month as its own quantity. This is the honest form for a
 *   short or gappy series: a school with one month of results was previously
 *   shown a single dot floating in an empty area chart, which reads as a bug
 *   rather than as "one month of data". A bar is a bar whether there are twelve
 *   of them or one.
 *
 * The axis is fixed to 0–100 in all three, so switching form never changes what
 * the same height means.
 */
export default function TrendChart({
  points,
  type = "area",
}: {
  points: ScoreTrend["points"];
  type?: TrendChartType;
}) {
  const { t, i18n } = useTranslation();
  const rawId = useId();
  const gradientId = `dashboard-trend-${rawId.replaceAll(":", "")}`;
  const data = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        label: monthLabel(point.month, i18n.language),
        avg: Math.max(0, Math.min(100, point.avg)),
      })),
    [i18n.language, points],
  );

  if (!data.length) return null;

  // Shared between the three charts, so a form switch cannot quietly change the
  // grid, the scale, or what the tooltip says.
  const grid = (
    <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false} />
  );
  const xAxis = (
    <XAxis
      dataKey="label"
      axisLine={false}
      tickLine={false}
      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
    />
  );
  const yAxis = (
    <YAxis
      domain={[0, 100]}
      ticks={[0, 25, 50, 75, 100]}
      axisLine={false}
      tickLine={false}
      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
    />
  );
  const tooltip = (
    <Tooltip
      cursor={
        type === "bar"
          ? { fill: "var(--muted)" }
          : { stroke: "var(--border)", strokeDasharray: "4 4" }
      }
      content={({ active, payload, label }) =>
        active && payload?.length ? (
          <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-elev-3">
            <p className="text-xs text-muted-foreground">{String(label)}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
              {Math.round(Number(payload[0].value))}%
            </p>
          </div>
        ) : null
      }
    />
  );
  const margin = { top: 12, right: 8, left: -18, bottom: 0 };

  return (
    <figure className="m-0 min-w-0">
      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={margin}>
              {grid}
              {xAxis}
              {yAxis}
              {tooltip}
              <Bar
                dataKey="avg"
                fill="var(--chart-1)"
                // Rounded only at the data end; the baseline end stays square so
                // the bar is visibly anchored to zero.
                radius={[4, 4, 0, 0]}
                // A lone month should not become a full-width slab.
                maxBarSize={56}
                isAnimationActive={false}
              />
            </BarChart>
          ) : type === "line" ? (
            <LineChart data={data} margin={margin}>
              {grid}
              {xAxis}
              {yAxis}
              {tooltip}
              <Line
                type="monotone"
                dataKey="avg"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 4, fill: "var(--card)", stroke: "var(--chart-1)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "var(--chart-1)" }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={margin}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {grid}
              {xAxis}
              {yAxis}
              {tooltip}
              <Area
                type="monotone"
                dataKey="avg"
                stroke="var(--chart-1)"
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                dot={{ r: 4, fill: "var(--card)", stroke: "var(--chart-1)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "var(--chart-1)" }}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/*
        The same numbers as text. This is the table view the chart owes a reader
        who cannot use it — and it is why the plot above can be `aria-hidden`.
      */}
      <figcaption className="sr-only">
        {t("root.dashboard.trend.aria")}:{" "}
        {data.map((point) => `${point.label} ${Math.round(point.avg)}%`).join(", ")}
      </figcaption>
    </figure>
  );
}
