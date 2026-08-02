"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import ExamCard from "../../_components/ui/ExamCard";
import Empty from "../../_components/ui/Empty";
import { containerVariants, examItems, examTabLabelKeys, examTabs, itemVariants } from "../../_constants";
import type { ExamTab } from "../../_types";

export default function Page() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ExamTab>("active");

  const filteredItems = useMemo(() => {
    return examItems.filter((exam) => (activeTab === "completed" ? exam.completed : !exam.completed));
  }, [activeTab]);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        {examTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-semibold transition ${
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "border-border bg-card text-muted-foreground hover:border-[var(--ring)]"
              }`}
            >
              {t(examTabLabelKeys[tab])}
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Empty
            title={t("root.empty.title")}
            description={t("root.empty.description")}
          />
        </div>
      ) : (
        <motion.div
          key={activeTab}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-5 lg:grid-cols-2"
        >
          {filteredItems.map((exam) => (
            <motion.div key={exam.id} variants={itemVariants}>
              <ExamCard exam={exam} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
