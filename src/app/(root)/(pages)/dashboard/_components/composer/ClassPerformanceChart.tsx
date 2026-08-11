"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ClassPerformance } from "@/app/(root)/_lib/dashboard.schemas";

export default function ClassPerformanceChart({
  classes,
}: {
  classes: ClassPerformance["classes"];
}) {
  const { t } = useTranslation();
  const data = useMemo(
    () =>
      [...classes]
        .filter((item) => item.averageScore != null)
        .sort(
          (left, right) =>
            right.completedAssessments - left.completedAssessments ||
            left.className.localeCompare(right.className),
        )
        .slice(0, 8),
    [classes],
  );

  if (!data.length) return null;

  return (
    <figure className="m-0">
      <div className="h-72 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
          >
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="className"
              width={104}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
                return active && row ? (
                  <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-elev-3">
                    <p className="text-xs font-semibold text-foreground">{row.className}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("root.dashboard.modules.classPerformance.average")}: {" "}
                      {Math.round(row.averageScore ?? 0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("root.dashboard.modules.classPerformance.completed")}: {" "}
                      {row.completedAssessments}
                    </p>
                  </div>
                ) : null;
              }}
            />
            <Bar dataKey="averageScore" fill="var(--chart-2)" radius={[0, 7, 7, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {data
          .map(
            (item) =>
              `${item.className}: ${Math.round(item.averageScore ?? 0)}%, ${item.completedAssessments}`,
          )
          .join(", ")}
      </figcaption>
    </figure>
  );
}
