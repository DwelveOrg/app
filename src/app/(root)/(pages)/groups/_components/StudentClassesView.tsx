"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { useStudentClasses } from "@/app/(root)/_hooks/useEnrollment";
import Empty from "../../_components/ui/Empty";
import ClassesNav from "./ClassesNav";
import StudentClassCard from "./StudentClassCard";

type StudentClassesViewProps = {
  schoolId: string | undefined;
};

type DirectoryFilter = "all" | "enrolled" | "available";

const FILTERS: { value: DirectoryFilter; labelKey: string }[] = [
  { value: "all", labelKey: "root.enrollment.directory.filters.all" },
  { value: "enrolled", labelKey: "root.enrollment.directory.filters.enrolled" },
  { value: "available", labelKey: "root.enrollment.directory.filters.available" },
];

/**
 * Student class directory embedded on the School page. It is the only surface
 * that lists requestable classes; the user's Classes page contains active
 * enrollments only. Filtering and search stay client-side.
 */
export default function StudentClassesView({ schoolId }: StudentClassesViewProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DirectoryFilter>("all");

  // Debounce so filtering doesn't churn on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const query = useStudentClasses({ schoolId });

  const classes = useMemo(() => {
    const all = query.data?.classes ?? [];
    const q = search.toLowerCase();

    const matched = all.filter((item) => {
      if (filter === "enrolled" && item.studentEnrollmentStatus !== "ACTIVE") return false;
      if (filter === "available" && item.studentEnrollmentStatus === "ACTIVE") return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.teacher?.name ?? "").toLowerCase().includes(q)
      );
    });

    // Classes the student is already in come first, then pending requests, then
    // the rest. Copy before sorting so the React Query cache array is untouched.
    const rank = (item: (typeof all)[number]) =>
      item.studentEnrollmentStatus === "ACTIVE"
        ? 0
        : item.studentEnrollmentStatus === "PENDING"
          ? 1
          : 2;
    return [...matched].sort((a, b) => rank(a) - rank(b));
  }, [filter, query.data?.classes, search]);

  const enrolledCount = useMemo(
    () =>
      (query.data?.classes ?? []).filter((item) => item.studentEnrollmentStatus === "ACTIVE")
        .length,
    [query.data?.classes],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {t("root.enrollment.directory.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {enrolledCount > 0
            ? t("root.enrollment.directory.subtitle", { count: enrolledCount })
            : t("root.enrollment.directory.subtitleEmpty")}
        </p>
      </header>

      <ClassesNav schoolId={schoolId} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("root.enrollment.directory.searchPlaceholder")}
            aria-label={t("root.enrollment.directory.searchPlaceholder")}
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </div>

        <div
          role="group"
          aria-label={t("root.enrollment.directory.filters.label")}
          className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1"
        >
          {FILTERS.map((option) => {
            const isActive = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(option.value)}
                className={`inline-flex h-8 cursor-pointer items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {query.isLoading ? (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-2xl border border-[var(--border)]" />
          ))}
        </div>
      ) : query.isError ? (
        <Empty
          title={t("root.enrollment.directory.errorTitle")}
          description={t("root.enrollment.directory.errorDescription")}
          action={
            <Button type="button" className="w-full" onClick={() => query.refetch()}>
              <RefreshCw className="h-4 w-4" />
              {t("root.enrollment.directory.retry")}
            </Button>
          }
        />
      ) : classes.length === 0 ? (
        <Empty
          title={
            search
              ? t("root.enrollment.directory.noResultsTitle")
              : t(`root.enrollment.directory.empty.${filter}Title`)
          }
          description={
            search
              ? t("root.enrollment.directory.noResultsDescription")
              : t(`root.enrollment.directory.empty.${filter}Description`)
          }
          action={
            !search && filter !== "all" ? (
              <Button type="button" className="w-full" onClick={() => setFilter("all")}>
                {t("root.enrollment.directory.empty.showAll")}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((item) => (
            <StudentClassCard key={item.id} item={item} schoolId={schoolId} />
          ))}
        </div>
      )}
    </div>
  );
}
