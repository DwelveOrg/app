"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ApiTestSummary,
  FormatBlueprintRegistry,
  TestsListResponse,
  TestStatus,
} from "@/app/(root)/_lib/tests.schemas";
import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import { DEFAULT_TEST_STATUS, TEST_STATUS_TABS } from "../_constants";
import { useTestsQuery } from "../_hooks/useTestsQuery";
import CreateTestDialog from "./CreateTestDialog";
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
 * The tests a class owns, split by lifecycle. Draft leads because that is where
 * unfinished work sits and what a teacher returns for; published and archived
 * are references.
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
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiTestSummary | null>(null);

  const isDefaultView = status === DEFAULT_TEST_STATUS && page === 1;
  const { data, isPending, isError, isFetching, refetch } = useTestsQuery({
    classId,
    status,
    page,
    initialData: isDefaultView ? (initialTests ?? undefined) : undefined,
  });

  const tests = data?.tests ?? [];
  const meta = data?.meta;

  const selectTab = (next: string) => {
    setStatus(next as TestStatus);
    setPage(1);
  };

  return (
    <section className="flex flex-col gap-6 py-6">
      <Link
        href={`/groups/${classId}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("root.tests.list.backToClass")}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
            {t("root.tests.list.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {t("root.tests.list.subtitle", { name: className })}
          </p>
        </div>

        <Button size="lg" onClick={() => setCreateOpen(true)}>
          <FilePlus2 className="h-4 w-4" />
          {t("root.tests.list.create")}
        </Button>
      </header>

      <Tabs value={status} onValueChange={selectTab}>
        <TabsList aria-label={t("root.tests.list.tabsLabel")}>
          {TEST_STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {t(`root.tests.status.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

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
              <RefreshCw className="h-4 w-4" />
              {t("root.tests.actions.retry")}
            </Button>
          }
        />
      ) : tests.length === 0 ? (
        <Empty
          title={t(`root.tests.list.empty.${status}.title`)}
          description={t(`root.tests.list.empty.${status}.description`)}
          action={
            status === "DRAFT" ? (
              <Button type="button" className="w-full" onClick={() => setCreateOpen(true)}>
                <FilePlus2 className="h-4 w-4" />
                {t("root.tests.list.create")}
              </Button>
            ) : null
          }
        />
      ) : (
        <div
          className="grid gap-3"
          aria-busy={isFetching}
          data-pending={isFetching ? "true" : undefined}
        >
          {tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              classId={classId}
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
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t("root.tests.list.previous")}
          </Button>
          <span className="text-xs text-[var(--muted-foreground)]">
            {t("root.tests.list.pageOf", { page: meta.page, total: meta.totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasMore || isFetching}
            onClick={() => setPage((current) => current + 1)}
          >
            {t("root.tests.list.next")}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </nav>
      ) : null}

      <CreateTestDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        classId={classId}
        formats={formats}
      />

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
