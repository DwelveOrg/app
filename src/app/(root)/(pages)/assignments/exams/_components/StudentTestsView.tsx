"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import TabBar from "@/components/ui/TabBar";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import PageHeader from "@/app/(root)/_components/PageHeader";
import StudentTestCard from "@/components/tests/StudentTestCard";
import type { StudentTestRow } from "@/app/exam/_lib/attempts.schemas";
import { staggerContainer, staggerItem, stillVariants } from "@/lib/motion";

type Tab = "open" | "done";

/**
 * A student's tests, across every class they are in.
 *
 * ## What this replaced
 *
 * Three hard-coded fixtures — "Midterm", "Code Sprint", "History Final" — with
 * invented dates and invented marks, on a route any signed-in user could reach
 * by URL. A student who typed the address was shown fabricated results as if
 * they were their own. The fixtures are deleted, not hidden.
 *
 * ## Two tabs, not five
 *
 * The seven backend states collapse into the only distinction a student acts
 * on: **something to do**, and **something already done**. "Not yet open" and
 * "in progress" belong together because both mean *this one is still ahead of
 * you*; the row itself says which. A tab per state would be five tabs, four of
 * them usually empty.
 *
 * The card is `StudentTestCard`, shared with the tests section on a class page,
 * so the same paper cannot describe itself differently depending on the route
 * the student arrived from.
 */
export default function StudentTestsView({ tests }: { tests: StudentTestRow[] }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<Tab>("open");

  const { open, done } = useMemo(() => {
    const open: StudentTestRow[] = [];
    const done: StudentTestRow[] = [];

    for (const test of tests) {
      if (test.state === "SUBMITTED" || test.state === "GRADED") done.push(test);
      else open.push(test);
    }

    return { open, done };
  }, [tests]);

  const visible = tab === "open" ? open : done;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <PageHeader title={t("root.exams.title")} subtitle={t("root.exams.subtitle")} />

      {/*
        The page-level treatment, not the pill one. These two tabs are the page's
        sections rather than a filter inside a panel, and a pill tray stretched
        across a wide page is mostly empty trough — the underline rule spans the
        full width and reads as deliberate. `showZeroCount` because "Completed 0"
        is a fact about the student's term, not noise.
      */}
      <TabBar
        layoutId="student-tests-tabs"
        ariaLabel={t("root.exams.tabsLabel")}
        value={tab}
        onSelect={(next) => setTab(next as Tab)}
        items={[
          {
            value: "open",
            label: t("root.exams.tabs.active"),
            count: open.length,
            showZeroCount: true,
          },
          {
            value: "done",
            label: t("root.exams.tabs.completed"),
            count: done.length,
            showZeroCount: true,
          },
        ]}
      />

      {visible.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Empty
            title={t(`root.exams.empty.${tab}.title`)}
            description={t(`root.exams.empty.${tab}.description`)}
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
              <StudentTestCard test={test} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
