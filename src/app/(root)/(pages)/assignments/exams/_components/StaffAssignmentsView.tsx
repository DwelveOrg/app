"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Clock3, ListChecks, Target, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import TabBar from "@/components/ui/TabBar";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import PageHeader from "@/app/(root)/_components/PageHeader";
import FormatMark from "@/components/tests/FormatMark";
import TestStatusBadge from "@/components/tests/TestStatusBadge";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { formatIcon, studioRoutes } from "@/app/(root)/_constants/tests";
import type {
  ApiLibraryTestSummary,
  TestStatus,
} from "@/app/(root)/_lib/tests.schemas";
import { staggerContainer, staggerItem, stillVariants } from "@/lib/motion";

type Tab = "live" | "drafts" | "archive";

const TAB_STATUS: Record<Tab, TestStatus> = {
  live: "PUBLISHED",
  drafts: "DRAFT",
  archive: "ARCHIVED",
};

/**
 * What a teacher or admin has set, across every class they run.
 *
 * The Assignments row used to be a greyed-out "coming soon" for staff, because
 * the only test surface was the class-scoped authoring list — so answering
 * "what have I got out there right now" meant opening each class in turn and
 * remembering. This is the same question the student side of Assignments
 * answers, asked from the other direction.
 *
 * It is a *view*, not an authoring surface. Every card leads into the studio,
 * which owns writing, and to the class the test belongs to; nothing is created,
 * duplicated, or deleted from here — the class list already does that, and two
 * places to delete a test is one place too many.
 *
 * The scope is the backend's: `GET /tests` gives an admin the school's tests
 * and a teacher their own.
 */
export default function StaffAssignmentsView({
  tests,
}: {
  tests: ApiLibraryTestSummary[];
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<Tab>("live");

  const byStatus = useMemo(() => {
    const grouped: Record<Tab, ApiLibraryTestSummary[]> = {
      live: [],
      drafts: [],
      archive: [],
    };

    for (const test of tests) {
      if (test.status === "PUBLISHED") grouped.live.push(test);
      else if (test.status === "ARCHIVED") grouped.archive.push(test);
      else grouped.drafts.push(test);
    }

    return grouped;
  }, [tests]);

  const visible = byStatus[tab];

  return (
    <div className="flex flex-col gap-6 pt-4">
      <PageHeader
        title={t("root.staffAssignments.title")}
        subtitle={t("root.staffAssignments.subtitle")}
      />

      {/* Live leads, for the same reason Published leads the class test list:
          it is what is out there now, with submissions coming in against it. */}
      <TabBar
        layoutId="staff-assignments-tabs"
        ariaLabel={t("root.staffAssignments.tabsLabel")}
        value={tab}
        onSelect={(next) => setTab(next as Tab)}
        items={(Object.keys(TAB_STATUS) as Tab[]).map((key) => ({
          value: key,
          label: t(`root.staffAssignments.tabs.${key}`),
          count: byStatus[key].length,
          showZeroCount: true,
        }))}
      />

      {visible.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Empty
            title={t(`root.staffAssignments.empty.${tab}.title`)}
            description={t(`root.staffAssignments.empty.${tab}.description`)}
          />
        </div>
      ) : (
        <motion.ul
          key={tab}
          variants={reduced ? stillVariants : staggerContainer}
          initial="hidden"
          animate="shown"
          className="grid gap-4 lg:grid-cols-2"
        >
          {visible.map((test) => (
            <motion.li key={test.id} variants={reduced ? stillVariants : staggerItem}>
              <AssignmentCard test={test} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

function AssignmentCard({ test }: { test: ApiLibraryTestSummary }) {
  const { t } = useTranslation();

  const questionCount = test.counts?.questions ?? test.questionCount ?? null;
  const submissions = test.counts?.students ?? null;
  const closesAt = test.availableUntil ? new Date(test.availableUntil) : null;

  return (
    <Surface as="article" className="flex h-full flex-col gap-3">
      <div className="flex items-start gap-3">
        <FormatMark icon={formatIcon(test.format)} size="sm" />

        <div className="min-w-0 flex-1">
          <h3 className="type-heading truncate text-foreground">{test.title}</h3>
          {/* The class is the point of a cross-class list: without it, two
              similarly-named midterms are indistinguishable. */}
          {test.class ? (
            <Link
              href={`/groups/${test.class.id}`}
              className="mt-0.5 block truncate text-sm text-muted-foreground transition hover:text-foreground"
            >
              {test.class.name}
            </Link>
          ) : null}
        </div>

        <TestStatusBadge status={test.status} />
      </div>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {questionCount != null ? (
          <Meta
            icon={<ListChecks className="size-3.5" />}
            label={t("exam.cover.questions")}
            value={String(questionCount)}
          />
        ) : null}
        <Meta
          icon={<Target className="size-3.5" />}
          label={t("exam.cover.points")}
          value={String(test.totalPoints)}
        />
        {test.durationMinutes ? (
          <Meta
            icon={<Clock3 className="size-3.5" />}
            label={t("exam.cover.duration")}
            value={t("exam.cover.minutes", { count: test.durationMinutes })}
          />
        ) : null}
        {submissions != null ? (
          <Meta
            icon={<Users className="size-3.5" />}
            label={t("root.staffAssignments.card.submissions")}
            value={String(submissions)}
          />
        ) : null}
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        {/* A live paper's deadline is the fact that decides whether to act on
            it today; for a draft, when it was last touched is. */}
        <span className="text-2xs text-muted-foreground">
          {test.status === "PUBLISHED" && closesAt ? (
            <Badge variant="neutral" size="xs">
              {t("root.staffAssignments.card.closes", {
                when: closesAt.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                }),
              })}
            </Badge>
          ) : test.updatedAt ? (
            <RelativeTime date={String(test.updatedAt)} />
          ) : null}
        </span>

        <span className="flex flex-wrap items-center gap-2">
          {/* Results exist only once there is something to have results about. */}
          {test.status === "PUBLISHED" && test.class ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/groups/${test.class.id}/tests/${test.id}/results`}>
                <BarChart3 className="size-3.5" />
                {t("root.staffAssignments.card.results")}
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost">
            <Link href={studioRoutes.builder(test.id)}>
              {t("root.staffAssignments.card.open")}
            </Link>
          </Button>
        </span>
      </div>
    </Surface>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="inline-flex items-center gap-1">
        <span aria-hidden="true">{icon}</span>
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
