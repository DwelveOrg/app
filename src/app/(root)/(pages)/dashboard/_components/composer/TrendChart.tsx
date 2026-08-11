"use client";

import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
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

export default function TrendChart({ points }: { points: ScoreTrend["points"] }) {
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

  return (
    <figure className="m-0 min-w-0">
      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.34} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
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
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {t("root.dashboard.trend.aria")}: {" "}
        {data.map((point) => `${point.label} ${Math.round(point.avg)}%`).join(", ")}
      </figcaption>
    </figure>
  );
}
