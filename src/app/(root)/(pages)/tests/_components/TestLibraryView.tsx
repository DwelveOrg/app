"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ApiLibraryTestSummary,
  FormatBlueprintRegistry,
  LibraryTestsListResponse,
  TestStatus,
} from "@/app/(root)/_lib/tests.schemas";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import TabBar from "@/components/ui/TabBar";
import PageHeader from "@/app/(root)/_components/PageHeader";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query/keys";
import {
  DEFAULT_TEST_STATUS,
  TEST_STATUS_TABS,
} from "@/app/(root)/_constants/tests";
import { useLibraryTestsQuery } from "@/app/(root)/_hooks/useTests";
import AssignTestDialog, { type AssignableClass } from "./AssignTestDialog";
import LibraryTestCard from "./LibraryTestCard";

/** `Select` cannot hold an empty string, so "every class" needs a real value. */
const ALL_CLASSES = "__all__";

type TestLibraryViewProps = {
  formats: FormatBlueprintRegistry;
  /** First page of the default tab, rendered on the server. */
  initialTests: LibraryTestsListResponse | null;
  classes: AssignableClass[];
};

/**
 * Every test the viewer has written, across classes, with the filters a
 * cross-class list needs and a class-scoped one cannot want.
 *
 * The status tabs match `/groups/[classId]/tests` deliberately — the same three
 * lifecycle stages, in the same order, so the two lists are read the same way.
 * What differs is the row: each card names its class, and each carries the
 * assign control that is the point of this page.
 */
export default function TestLibraryView({
  formats,
  initialTests,
  classes,
}: TestLibraryViewProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TestStatus>(DEFAULT_TEST_STATUS);
  const [page, setPage] = useState(1);
  const [classId, setClassId] = useState(ALL_CLASSES);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] =
    useState<ApiLibraryTestSummary | null>(null);

  /**
   * The server-rendered seed describes this page load, so it is spent once —
   * the same rule as the class list. Left in place it would re-seed the default
   * view after the cache entry expired and suppress the refetch a tab change is
   * supposed to guarantee.
   */
  const [seed, setSeed] = useState(initialTests);

  /**
   * Typing is debounced rather than sent per keystroke: each distinct term is
   * its own cache entry and its own request, and a five-letter title would
   * otherwise cost five.
   */
  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return;

    const timer = setTimeout(() => {
      setSearch(next);
      // A new term is a new result set, so the page resets and the seed — which
      // describes the unfiltered first render — no longer applies.
      setSeed(null);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const effectiveClassId = classId === ALL_CLASSES ? "" : classId;
  const isDefaultView =
    status === DEFAULT_TEST_STATUS &&
    page === 1 &&
    !effectiveClassId &&
    !search;

  const { data, isPending, isError, isFetching, refetch } =
    useLibraryTestsQuery({
      status,
      page,
      classId: effectiveClassId,
      search,
      initialData: isDefaultView ? (seed ?? undefined) : undefined,
    });

  const tests = data?.tests ?? [];
  const meta = data?.meta;
  const isFiltered = Boolean(effectiveClassId || search);

  /** Any move away from the first render spends the seed — see `seed` above. */
  const goToPage = (next: number) => {
    setSeed(null);
    setPage(next);
  };

  const selectTab = (next: string) => {
    setStatus(next as TestStatus);
    goToPage(1);
  };

  const selectClass = (next: string) => {
    setClassId(next);
    goToPage(1);
  };

  return (
    <section className="flex flex-col gap-6 py-6">
      <PageHeader
        title={t("root.tests.library.title")}
        subtitle={t("root.tests.library.subtitle")}
      />

      <TabBar
        layoutId="library-status-tabs"
        ariaLabel={t("root.tests.list.tabsLabel")}
        value={status}
        onSelect={selectTab}
        items={TEST_STATUS_TABS.map((tab) => ({
          value: tab,
          label: t(`root.tests.status.${tab}`),
          // Only the tab in view has a total — the endpoint returns one status
          // at a time, so a number beside the others would be a wrong fact.
          count: tab === status ? meta?.total : undefined,
          showZeroCount: true,
          refresh: {
            queryKeys: [
              queryKeys.tests.library({
                status: tab,
                page: 1,
                classId: effectiveClassId,
                search,
              }),
            ],
          },
        }))}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            className="pl-9"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            maxLength={200}
            placeholder={t("root.tests.library.searchPlaceholder")}
            aria-label={t("root.tests.library.searchLabel")}
          />
        </div>

        <Select value={classId} onValueChange={selectClass}>
          <SelectTrigger
            className="w-full sm:w-56"
            aria-label={t("root.tests.library.classFilterLabel")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CLASSES}>
              {t("root.tests.library.allClasses")}
            </SelectItem>
            {classes.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="grid gap-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <Empty
          title={t("root.tests.list.errorTitle")}
          description={t("root.tests.list.errorDescription")}
          action={
            <Button
              type="button"
              className="w-full"
              onClick={() => void refetch()}
            >
              <RefreshCw className="size-4" />
              {t("root.tests.actions.retry")}
            </Button>
          }
        />
      ) : tests.length === 0 ? (
        /*
          A filtered miss and an empty library are different facts. "No tests
          match" is answered by widening the filter; "you have not written one
          yet" is answered from a class, since a test cannot be created without
          one — so neither state offers a create button this page cannot honour.
        */
        <Empty
          variant={isFiltered ? "card" : "dashed"}
          title={
            isFiltered
              ? t("root.tests.library.empty.filtered.title")
              : t(`root.tests.library.empty.${status}.title`)
          }
          description={
            isFiltered
              ? t("root.tests.library.empty.filtered.description")
              : t(`root.tests.library.empty.${status}.description`)
          }
          action={
            isFiltered ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setClassId(ALL_CLASSES);
                  goToPage(1);
                }}
              >
                {t("root.tests.library.clearFilters")}
              </Button>
            ) : null
          }
        />
      ) : (
        <div
          className="grid gap-3 transition-opacity duration-[var(--dur-2)] data-pending:opacity-60"
          aria-busy={isFetching}
          data-pending={isFetching ? "true" : undefined}
        >
          {tests.map((test) => (
            <LibraryTestCard
              key={test.id}
              test={test}
              formats={formats}
              canOpenClass={classes.some((item) => item.id === test.class.id)}
              onRequestAssign={setAssignTarget}
            />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <nav
          className="flex items-center justify-between gap-3"
          aria-label={t("root.tests.list.pagination")}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => goToPage(Math.max(1, page - 1))}
          >
            <ChevronLeft className="size-3.5" />
            {t("root.tests.list.previous")}
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("root.tests.list.pageOf", {
              page: meta.page,
              total: meta.totalPages,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasMore || isFetching}
            onClick={() => goToPage(page + 1)}
          >
            {t("root.tests.list.next")}
            <ChevronRight className="size-3.5" />
          </Button>
        </nav>
      ) : null}

      <AssignTestDialog
        open={assignTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAssignTarget(null);
        }}
        test={assignTarget}
        classes={classes}
      />
    </section>
  );
}
