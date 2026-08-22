"use client";

import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Submissions } from "@/app/(root)/_lib/dashboard.schemas";

export default function SubmissionsChart({
  rows,
}: {
  rows: Submissions["byClass"];
}) {
  const { t } = useTranslation();
  if (!rows.length) return null;

  const labels = {
    onTime: t("root.dashboard.modules.submissions.onTime"),
    late: t("root.dashboard.modules.submissions.late"),
    missing: t("root.dashboard.modules.submissions.missing"),
  };

  return (
    <figure className="m-0">
      <div className="h-72 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows.slice(0, 8)} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 5" vertical={false} />
            <XAxis
              dataKey="className"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "var(--popover)",
                color: "var(--foreground)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="onTime" name={labels.onTime} stackId="status" fill="var(--chart-2)" />
            <Bar dataKey="late" name={labels.late} stackId="status" fill="var(--chart-3)" />
            <Bar
              dataKey="missing"
              name={labels.missing}
              stackId="status"
              fill="var(--chart-4)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {rows
          .map(
            (row) =>
              `${row.className}: ${labels.onTime} ${row.onTime}, ${labels.late} ${row.late}, ${labels.missing} ${row.missing}`,
          )
          .join(", ")}
      </figcaption>
    </figure>
  );
}
