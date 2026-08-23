"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FilePlus2, RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import type {
  ApiTestSummary,
  FormatBlueprintRegistry,
  TestsListResponse,
  TestStatus,
} from "@/app/(root)/_lib/tests.schemas";
import { Button } from "@/components/ui/Button";
import Segmented from "@/components/ui/Segmented";
import Skeleton from "@/components/ui/Skeleton";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import {
  DEFAULT_TEST_STATUS,
  TEST_STATUS_TABS,
  studioRoutes,
} from "@/app/(root)/_constants/tests";
import { useTestsQuery } from "@/app/(root)/_hooks/useTests";
import { staggerContainer, staggerItem, stillVariants } from "@/lib/motion";
import AiImportCta from "@/app/(root)/_components/AiImportCta";
import DeleteTestDialog from "./DeleteTestDialog";
import TestCard from "./TestCard";

export default function ClassAssignmentsBoard({
  classId,
  formats,
  canAuthor,
  initialTests,
}: {
  classId: string;
  formats: FormatBlueprintRegistry;
  canAuthor: boolean;
  initialTests?: TestsListResponse;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [status, setStatus] = useState<TestStatus>(DEFAULT_TEST_STATUS);
  const [page, setPage] = useState(1);
  const [canUseInitialTests, setCanUseInitialTests] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ApiTestSummary | null>(null);
  const isDefaultView = status === DEFAULT_TEST_STATUS && page === 1;

  const { data, isPending, isError, isFetching, refetch } = useTestsQuery({
    classId,
    status,
    page,
    initialData: isDefaultView && canUseInitialTests ? initialTests : undefined,
  });

  const tests = data?.tests ?? [];
  const meta = data?.meta;

  const selectStatus = (next: TestStatus) => {
    setCanUseInitialTests(false);
    setStatus(next);
    setPage(1);
  };

  return (
    <section aria-labelledby="class-assignments-heading" className="flex flex-col gap-5">
      {/* Ahead of the heading, not behind the status tabs.

          Sitting under the tab row it was the fourth thing on the section and
          read as a footnote to whichever tab happened to be open, even though
          it has nothing to do with the filter. Here it is the first offer a
          teacher meets after the class identity, which is when "I have a paper
          to turn into a test" is actually on their mind. */}
      {canAuthor ? (
        <AiImportCta
          classId={classId}
          variant={!isPending && tests.length === 0 ? "hero" : "strip"}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="class-assignments-heading" className="type-section text-foreground">
          {t("root.classDetail.assignments.title")}
          {meta?.total ? (
            <span className="ml-2 text-base font-medium numeric text-muted-foreground">
              {meta.total}
            </span>
          ) : null}
        </h2>

        <Segmented
          layoutId="class-assignments-status"
          ariaLabel={t("root.tests.list.tabsLabel")}
          value={status}
          onChange={selectStatus}
          className="min-w-[18rem]"
          options={TEST_STATUS_TABS.map((tab) => ({
            value: tab,
            label: t(`root.tests.status.${tab}`),
          }))}
        />
      </div>

      {isPending ? (
        <div className="grid gap-3 lg:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
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
          variant={status === "ARCHIVED" ? "card" : "dashed"}
          title={t(`root.tests.list.empty.${status}.title`)}
          description={t(`root.tests.list.empty.${status}.description`)}
          action={
            status === "ARCHIVED" || !canAuthor ? null : (
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
        <motion.div
          key={status}
          variants={reduced ? stillVariants : staggerContainer}
          initial="hidden"
          animate="shown"
          className="grid gap-3 transition-opacity duration-[var(--dur-2)] data-pending:opacity-60 lg:grid-cols-2"
          aria-busy={isFetching}
          data-pending={isFetching ? "true" : undefined}
        >
          {tests.map((test) => (
            <motion.div
              key={test.id}
              variants={reduced ? stillVariants : staggerItem}
              className="h-full"
            >
              <TestCard
                test={test}
                formats={formats}
                onRequestDelete={canAuthor ? setDeleteTarget : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
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
            onClick={() => {
              setCanUseInitialTests(false);
              setPage(Math.max(1, page - 1));
            }}
          >
            <ChevronLeft className="size-3.5" />
            {t("root.tests.list.previous")}
          </Button>
          <span className="text-xs numeric text-muted-foreground">
            {t("root.tests.list.pageOf", { page: meta.page, total: meta.totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasMore || isFetching}
            onClick={() => {
              setCanUseInitialTests(false);
              setPage(page + 1);
            }}
          >
            {t("root.tests.list.next")}
            <ChevronRight className="size-3.5" />
          </Button>
        </nav>
      ) : null}

      {canAuthor ? (
        <DeleteTestDialog
          open={deleteTarget !== null}
          onOpenChange={(open: boolean) => {
            if (!open) setDeleteTarget(null);
          }}
          testId={deleteTarget?.id ?? ""}
          title={deleteTarget?.title ?? ""}
          status={deleteTarget?.status ?? "DRAFT"}
        />
      ) : null}
    </section>
  );
}
