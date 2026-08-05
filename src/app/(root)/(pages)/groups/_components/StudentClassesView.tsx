"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import type { DiscoverableClass } from "@/app/(root)/_lib/enrollment.schemas";
import { useStudentClasses } from "@/app/(root)/_hooks/useEnrollment";
import Empty from "../../_components/ui/Empty";
import ClassesNav from "./ClassesNav";
import StudentClassCard from "./StudentClassCard";

type StudentClassesViewProps = {
  schoolId: string | undefined;
  /**
   * `embedded` drops the page title and the Classes/Requests nav for hosts that
   * already provide them — the School page renders this inside its own tabs.
   */
  variant?: "page" | "embedded";
};

/**
 * The student's classes, grouped by the decision each one is waiting on.
 *
 * A student's question is never "which classes exist" — it is "which can I open,
 * what am I waiting on, and what can I ask to join". A flat grid sorted by
 * status answered that only by reading every card, so the states are separate
 * sections now, each with its own heading and count.
 *
 * Every state comes from the backend as returned — `canEnter`, `canRequest`,
 * `studentEnrollmentStatus`, `enrollmentMode`, `capacity`, `activeStudentCount`.
 * The UI never reconstructs the rules.
 */
type ClassGroupKey = "enrolled" | "pending" | "available" | "unavailable";

const GROUP_ORDER: ClassGroupKey[] = ["enrolled", "pending", "available", "unavailable"];

/** Which decision a class is waiting on, read straight from the backend flags. */
function groupFor(item: DiscoverableClass): ClassGroupKey {
  if (item.canEnter) return "enrolled";
  if (item.studentEnrollmentStatus === "PENDING") return "pending";
  if (item.canRequest) return "available";
  return "unavailable";
}

export default function StudentClassesView({
  schoolId,
  variant = "page",
}: StudentClassesViewProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce so filtering doesn't churn on every keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const query = useStudentClasses({ schoolId });

  const groups = useMemo(() => {
    const all = query.data?.classes ?? [];
    const term = search.toLowerCase();

    const matched = term
      ? all.filter(
          (item) =>
            item.name.toLowerCase().includes(term) ||
            (item.teacher?.name ?? "").toLowerCase().includes(term),
        )
      : all;

    const grouped: Record<ClassGroupKey, DiscoverableClass[]> = {
      enrolled: [],
      pending: [],
      available: [],
      unavailable: [],
    };
    for (const item of matched) grouped[groupFor(item)].push(item);
    return grouped;
  }, [query.data?.classes, search]);

  const enrolledCount = useMemo(
    () => (query.data?.classes ?? []).filter((item) => item.canEnter).length,
    [query.data?.classes],
  );
  const visibleGroups = GROUP_ORDER.filter((key) => groups[key].length > 0);

  return (
    <div className="flex flex-col gap-6">
      {variant === "page" ? (
        <>
          <header>
            <h1 className="type-title text-foreground">
              {t("root.enrollment.directory.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {enrolledCount > 0
                ? t("root.enrollment.directory.subtitle", { count: enrolledCount })
                : t("root.enrollment.directory.subtitleEmpty")}
            </p>
          </header>

          <ClassesNav schoolId={schoolId} />
        </>
      ) : null}

      <div className="relative min-w-0 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t("root.enrollment.directory.searchPlaceholder")}
          aria-label={t("root.enrollment.directory.searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring shadow-elev-1"
        />
      </div>

      {query.isLoading ? (
        <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-2xl border border-border" />
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
      ) : visibleGroups.length === 0 ? (
        <Empty
          title={
            search
              ? t("root.enrollment.directory.noResultsTitle")
              : t("root.enrollment.directory.empty.allTitle")
          }
          description={
            search
              ? t("root.enrollment.directory.noResultsDescription")
              : t("root.enrollment.directory.empty.allDescription")
          }
          action={
            search ? (
              <Button type="button" className="w-full" onClick={() => setSearchInput("")}>
                {t("root.enrollment.directory.clearSearch")}
              </Button>
            ) : null
          }
        />
      ) : (
        visibleGroups.map((key) => (
          <section key={key} aria-labelledby={`class-group-${key}`} className="flex flex-col gap-3">
            <div>
              <h2
                id={`class-group-${key}`}
                className="text-base font-bold text-foreground"
              >
                {t(`root.enrollment.directory.groups.${key}.title`, {
                  count: groups[key].length,
                })}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t(`root.enrollment.directory.groups.${key}.description`)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups[key].map((item) => (
                <StudentClassCard key={item.id} item={item} schoolId={schoolId} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
