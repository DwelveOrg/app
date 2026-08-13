"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FilePlus2, FileUp, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ApiTestSummary,
  FormatBlueprintRegistry,
  TestsListResponse,
  TestStatus,
} from "@/app/(root)/_lib/tests.schemas";
import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import TabBar from "@/components/ui/TabBar";
import BackLink from "@/app/(root)/_components/BackLink";
import PageHeader from "@/app/(root)/_components/PageHeader";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import { queryKeys } from "@/lib/query/keys";
import {
  DEFAULT_TEST_STATUS,
  TEST_STATUS_TABS,
  studioRoutes,
} from "@/app/(root)/_constants/tests";
import { useTestsQuery } from "@/app/(root)/_hooks/useTests";
import DeleteTestDialog from "./DeleteTestDialog";
import TestCard from "./TestCard";

type TestsListViewProps = {
  classId: string;
  className: string;
  formats: FormatBlueprintRegistry;
  /** First page of the default tab, rendered on the server. */
  initialTests: TestsListResponse | null;
};

/**
 * The tests a class owns, split by lifecycle. Published leads because it is the
 * class's live state — the papers students can sit right now; drafts and the
 * archive are what a teacher goes looking for on purpose.
 *
 * This page stays in the dashboard: it is class management, not authoring.
 * Writing a test happens in the studio, so "New test" and every card navigate
 * out of this shell rather than opening a dialog over it.
 *
 * Authoring controls render only for staff, but the backend is the
 * authorization boundary — every route here answers 403 to a student.
 */
export default function TestsListView({
  classId,
  className,
  formats,
  initialTests,
}: TestsListViewProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TestStatus>(DEFAULT_TEST_STATUS);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ApiTestSummary | null>(null);

  /**
   * The server-rendered seed describes this page load, so it is spent once.
   *
   * Left in place it is re-supplied every time the default tab comes back into
   * view, and seeding counts as a fresh fetch — so once the cache entry has been
   * garbage-collected (five idle minutes), returning to the tab would re-seed
   * the render-time list and suppress the very request the tab switch is
   * supposed to guarantee. `keepPreviousData` covers the gap without it.
   *
   * State rather than a ref: it decides what this render passes to the query.
   */
  const [seed, setSeed] = useState(initialTests);

  const isDefaultView = status === DEFAULT_TEST_STATUS && page === 1;
  const { data, isPending, isError, isFetching, refetch } = useTestsQuery({
    classId,
    status,
    page,
    initialData: isDefaultView ? (seed ?? undefined) : undefined,
  });

  const tests = data?.tests ?? [];
  const meta = data?.meta;

  /** Any move away from the first render spends the seed — see `seed` above. */
  const goToPage = (next: number) => {
    setSeed(null);
    setPage(next);
  };

  const selectTab = (next: string) => {
    setStatus(next as TestStatus);
    goToPage(1);
  };

  return (
    <section className="flex flex-col gap-6 py-6">
      <BackLink href={`/groups/${classId}`}>{t("root.tests.list.backToClass")}</BackLink>

      <PageHeader
        title={t("root.tests.list.title")}
        subtitle={t("root.tests.list.subtitle", { name: className })}
        actions={
          // Authoring lives in the studio, a different environment with its own
          // chrome, so these are navigations rather than dialogs. The class comes
          // along as a query parameter because the draft does not exist yet.
          //
          // Import sits beside "New test" as an outline button, not a menu item:
          // it is the other way a test starts, and a teacher who arrived holding
          // a PDF should see it without opening anything.
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="lg">
              <Link href={studioRoutes.importTest(classId)}>
                <FileUp className="size-4" />
                {t("root.tests.list.import")}
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href={studioRoutes.newTest(classId)}>
                <FilePlus2 className="size-4" />
                {t("root.tests.list.create")}
              </Link>
            </Button>
          </div>
        }
      />

      {/*
        `TabBar` rather than a local tab row: the sliding indicator, height, and weight are the
        same control the school, class, and notification pages use. The count is only shown for
        the tab in view — the list endpoint returns a total per status, not all three at once,
        and a "0" beside the two tabs we have not fetched would be a wrong fact, not a quiet one.
      */}
      <TabBar
        layoutId="tests-status-tabs"
        ariaLabel={t("root.tests.list.tabsLabel")}
        value={status}
        onSelect={selectTab}
        // Each tab is its own cache entry, so a first visit fetches on its own —
        // but a return visit, and the default tab seeded with `initialData`,
        // would both replay what was already there. The key is page 1 because
        // `selectTab` resets paging.
        items={TEST_STATUS_TABS.map((tab) => ({
          value: tab,
          label: t(`root.tests.status.${tab}`),
          count: tab === status ? meta?.total : undefined,
          showZeroCount: true,
          refresh: { queryKeys: [queryKeys.tests.list(classId, { status: tab, page: 1 })] },
        }))}
      />

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
            <Button type="button" className="w-full" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              {t("root.tests.actions.retry")}
            </Button>
          }
        />
      ) : tests.length === 0 ? (
        <Empty
          // Published and Draft empty are both first-run states a teacher is meant
          // to act on — Published is now the landing tab, so an empty one with no
          // control would make a new class a dead end. An empty Archive is simply a
          // fact about the past, so it stays a plain card with nothing to press.
          variant={status === "ARCHIVED" ? "card" : "dashed"}
          title={t(`root.tests.list.empty.${status}.title`)}
          description={t(`root.tests.list.empty.${status}.description`)}
          action={
            status === "ARCHIVED" ? null : (
              <Button asChild className="w-full">
                <Link href={studioRoutes.newTest(classId)}>
                  <FilePlus2 className="size-4" />
                  {t("root.tests.list.create")}
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div
          className="grid gap-3 transition-opacity duration-[var(--dur-2)] data-pending:opacity-60"
          aria-busy={isFetching}
          data-pending={isFetching ? "true" : undefined}
        >
          {tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              formats={formats}
              onRequestDelete={setDeleteTarget}
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
            {t("root.tests.list.pageOf", { page: meta.page, total: meta.totalPages })}
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

      <DeleteTestDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        testId={deleteTarget?.id ?? ""}
        title={deleteTarget?.title ?? ""}
        status={deleteTarget?.status ?? "DRAFT"}
      />
    </section>
  );
}
