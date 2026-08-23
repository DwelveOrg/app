"use client";

import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ScoreTrend } from "@/app/(root)/_lib/dashboard.schemas";

function monthLabel(month: string, language: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  if (!year || !monthIndex) return month;
  return new Intl.DateTimeFormat(language || "en", { month: "short" }).format(
    new Date(Date.UTC(year, monthIndex - 1, 1)),
  );
}

type Point = { label: string; avg: number };

/**
 * Marks the series endpoint: the one dot the line carries, filled in the
 * series hue with a surface-colored ring so it stays legible where it sits on
 * the line itself. Recharts calls this for every point; every index but the
 * last renders nothing.
 */
function EndDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength: number;
}) {
  const { cx, cy, index, dataLength } = props;
  if (index !== dataLength - 1 || cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="var(--card)" />
      <circle cx={cx} cy={cy} r={4} fill="var(--chart-1)" />
    </g>
  );
}

/**
 * The one direct label on the chart: the current value, at the line's end.
 * Everything else is carried by the axis and the tooltip — a number on every
 * point is chaos, and the endpoint is the number the reader came for.
 */
function EndLabel(props: {
  x?: number;
  y?: number;
  index?: number;
  value?: number;
  dataLength: number;
  chartWidth: number;
}) {
  const { x, y, index, value, dataLength } = props;
  if (index !== dataLength - 1 || x == null || y == null || value == null) return null;
  return (
    <text
      x={x}
      y={y - 12}
      textAnchor="end"
      fill="var(--foreground)"
      fontSize={12}
      fontWeight={600}
    >
      {Math.round(value)}%
    </text>
  );
}

/**
 * Average score over time — one series, so the form is not a preference.
 *
 * The data picks the shape: three or more months draw a 2px line over a flat
 * 10% wash (the trend is the story), while one or two months draw columns —
 * a lone dot floating in an empty area chart reads as a bug, and a bar is a
 * bar whether there are twelve of them or one. The axis is fixed to 0–100 in
 * both forms, so the same height always means the same score.
 */
export default function TrendChart({ points }: { points: ScoreTrend["points"] }) {
  const { t, i18n } = useTranslation();
  const rawId = useId();
  const gradientId = `dashboard-trend-${rawId.replaceAll(":", "")}`;
  const data: Point[] = useMemo(
    () =>
      points.map((point) => ({
        label: monthLabel(point.month, i18n.language),
        avg: Math.max(0, Math.min(100, point.avg)),
      })),
    [i18n.language, points],
  );

  if (!data.length) return null;

  const asColumns = data.length < 3;

  const grid = <CartesianGrid stroke="var(--border)" vertical={false} />;
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
        asColumns ? { fill: "var(--muted)" } : { stroke: "var(--border)", strokeWidth: 1 }
      }
      content={({ active, payload, label }) =>
        active && payload?.length ? (
          <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-elev-3">
            <p className="text-xs text-muted-foreground">{String(label)}</p>
            <p className="numeric mt-0.5 text-sm font-semibold text-foreground">
              {Math.round(Number(payload[0].value))}%
            </p>
          </div>
        ) : null
      }
    />
  );
  const margin = { top: 16, right: 8, left: -18, bottom: 0 };

  return (
    <figure className="m-0 min-w-0">
      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          {asColumns ? (
            <BarChart data={data} margin={margin}>
              {grid}
              {xAxis}
              {yAxis}
              {tooltip}
              <Bar
                dataKey="avg"
                fill="var(--chart-1)"
                // Rounded only at the data end; the baseline end stays square so
                // the column is visibly anchored to zero.
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
                label={{
                  position: "top",
                  fill: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: (value) => `${Math.round(Number(value))}%`,
                }}
              />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={margin}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
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
                strokeWidth={2}
                strokeLinecap="round"
                fill={`url(#${gradientId})`}
                dot={<EndDot dataLength={data.length} />}
                activeDot={{
                  r: 4,
                  fill: "var(--chart-1)",
                  stroke: "var(--card)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
                label={<EndLabel dataLength={data.length} chartWidth={0} />}
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
