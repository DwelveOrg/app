"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import Empty from "../../_components/ui/Empty";
import { useTeacherClasses } from "@/app/(root)/_hooks/useTeacherRequests";
import TeacherClassCard from "./TeacherClassCard";

type TeacherClassesViewProps = {
  schoolId: string | undefined;
};

/**
 * Teacher-facing class list. `GET /classes` returns every active class in the
 * selected school (including ones the teacher does not yet teach) so the teacher
 * can request to teach them. Assigned classes surface the normal open action.
 * Backed by React Query so request/cancel and notification actions refresh it.
 */
export default function TeacherClassesView({ schoolId }: TeacherClassesViewProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce so filtering doesn't churn on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const query = useTeacherClasses({ schoolId });

  const classes = useMemo(() => {
    const all = query.data?.classes ?? [];
    const q = search.toLowerCase();
    const filtered = q
      ? all.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.teachers[0]?.fullName ?? "").toLowerCase().includes(q),
        )
      : all;
    // Surface the teacher's own classes first, then pending requests, then the
    // rest. Copy before sorting so the React Query cache array is never mutated.
    const rank = (item: (typeof all)[number]) =>
      item.canEnter ? 0 : item.teacherRequestStatus === "PENDING" ? 1 : 2;
    return [...filtered].sort((a, b) => rank(a) - rank(b));
  }, [query.data?.classes, search]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {t("root.enrollment.teacher.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {t("root.enrollment.teacher.subtitle")}
        </p>
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t("root.enrollment.teacher.searchPlaceholder")}
          aria-label={t("root.enrollment.teacher.searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
      </div>

      {query.isLoading ? (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]"
            />
          ))}
        </div>
      ) : query.isError ? (
        <Empty
          title={t("root.enrollment.teacher.errorTitle")}
          description={t("root.enrollment.teacher.errorDescription")}
        />
      ) : classes.length === 0 ? (
        <Empty
          title={
            search
              ? t("root.enrollment.teacher.noResultsTitle")
              : t("root.enrollment.teacher.emptyTitle")
          }
          description={
            search
              ? t("root.enrollment.teacher.noResultsDescription")
              : t("root.enrollment.teacher.emptyDescription")
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((item) => (
            <TeacherClassCard key={item.id} item={item} schoolId={schoolId} />
          ))}
        </div>
      )}
    </div>
  );
}
