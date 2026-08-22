"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AreaChart, BarChart3, LineChart } from "lucide-react";
import { useTranslation } from "react-i18next";

import Segmented from "@/components/ui/Segmented";
import {
  TREND_CHART_TYPES,
  type TrendChartType,
} from "./TrendChart";

const STORAGE_KEY = "dwelve-dashboard-chart-type";

/**
 * Which shape the trend panel draws, remembered across visits.
 *
 * Kept in `localStorage` rather than in component state because the choice is
 * about how this person reads a chart, not about this render: a teacher who
 * switched to bars because they have two months of data would otherwise be
 * handed the area chart again on every navigation, and would stop switching.
 *
 * `useSyncExternalStore` rather than an effect so the value is read once, is
 * shared by every mounted toggle, and renders the same on the server as it does
 * in the first client pass — the default — instead of flashing.
 */
const listeners = new Set<() => void>();
let cached: TrendChartType | null = null;

function isTrendChartType(value: unknown): value is TrendChartType {
  return (
    typeof value === "string" && (TREND_CHART_TYPES as readonly string[]).includes(value)
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => {
    cached = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read(): TrendChartType {
  if (cached) return cached;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    cached = isTrendChartType(stored) ? stored : "area";
  } catch {
    cached = "area";
  }
  return cached;
}

export function useChartType() {
  const type = useSyncExternalStore(
    subscribe,
    read,
    // The server has no storage, so it renders the default and the client
    // reconciles to the stored value on hydration.
    () => "area" as TrendChartType,
  );

  const setType = useCallback((next: TrendChartType) => {
    cached = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A blocked storage still gets the in-memory value for this session.
    }
    for (const listener of listeners) listener();
  }, []);

  return { type, setType };
}

export default function ChartTypeToggle({
  value,
  onChange,
}: {
  value: TrendChartType;
  onChange: (value: TrendChartType) => void;
}) {
  const { t } = useTranslation();

  return (
    <Segmented
      value={value}
      onChange={onChange}
      layoutId="dashboard-chart-type"
      ariaLabel={t("root.dashboard.trend.chartType.label")}
      className="p-0.5"
      options={[
        {
          value: "area",
          label: t("root.dashboard.trend.chartType.area"),
          icon: AreaChart,
        },
        {
          value: "line",
          label: t("root.dashboard.trend.chartType.line"),
          icon: LineChart,
        },
        {
          value: "bar",
          label: t("root.dashboard.trend.chartType.bar"),
          icon: BarChart3,
        },
      ]}
    />
  );
}
