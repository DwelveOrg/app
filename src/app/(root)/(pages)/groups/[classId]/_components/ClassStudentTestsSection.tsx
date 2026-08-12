"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import TabBar from "@/components/ui/TabBar";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import StudentTestCard from "@/components/tests/StudentTestCard";
import type { StudentTestRow } from "@/app/exam/_lib/attempts.schemas";
import { staggerContainer, staggerItem, stillVariants } from "@/lib/motion";

type Tab = "open" | "done";

/**
 * The tests set for this class, on the class page, for the student in it.
 *
 * A student opening a class used to see its name, its facts, and a list of
 * their classmates — everything about the class except the only part of it that
 * asks anything of them. The work was reachable only from Assignments, which
 * mixes every class together, so "what is due for this class" had no answer on
 * the page named after that class.
 *
 * Rows are `StudentTestCard`, the same component Assignments renders, with the
 * class name suppressed: every row here belongs to the class in the heading, so
 * repeating it on each card is noise.
 */
export default function ClassStudentTestsSection({
  tests,
}: {
  tests: StudentTestRow[];
}) {
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
    <section aria-labelledby="class-tests-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2
          id="class-tests-heading"
          className="inline-flex items-center gap-2 text-base font-bold text-foreground"
        >
          <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
          {t("root.classDetail.tests.title")}
        </h2>

        {/* Out to the full list, because a student with six classes eventually
            wants them in one place rather than six pages. */}
        <Button asChild variant="ghost" size="sm">
          <Link href="/assignments/exams">
            {t("root.classDetail.tests.seeAll")}
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {tests.length === 0 ? (
        <Empty
          title={t("root.classDetail.tests.emptyTitle")}
          description={t("root.classDetail.tests.emptyDescription")}
        />
      ) : (
        <>
          <TabBar
            variant="pill"
            layoutId="class-student-tests-tabs"
            ariaLabel={t("root.classDetail.tests.tabsLabel")}
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
            <Empty
              title={t(`root.exams.empty.${tab}.title`)}
              description={t(`root.exams.empty.${tab}.description`)}
            />
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
                  <StudentTestCard test={test} showClassName={false} />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </>
      )}
    </section>
  );
}
