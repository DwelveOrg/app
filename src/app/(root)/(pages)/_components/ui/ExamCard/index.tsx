"use client";

import type { ExamItem } from "../../../_types";
import { AlarmClock, CalendarDays, Clock, ListChecks, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import Surface from "@/components/ui/Surface";

const InfoRow = ({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) => (
  <Surface padding="none" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
    <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Icon className="size-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  </Surface>
);

export default function ExamCard({ exam }: { exam: ExamItem }) {
  const { t } = useTranslation();

  return (
    <article className="interactive group relative overflow-hidden rounded-[28px] border border-border bg-card p-5 shadow-elev-3 hover:-translate-y-1 hover:shadow-elev-4">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl dark:bg-primary/12" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {t(exam.subject)}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{t(exam.title)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("root.exams.card.labels.instructor")}: {t(exam.instructor)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow icon={CalendarDays} label={t("root.exams.card.labels.date")} value={`${exam.date} - ${exam.time}`} />
          <InfoRow
            icon={Clock}
            label={t("root.exams.card.labels.duration")}
            value={`${exam.durationMinutes} ${t("root.exams.card.units.minutes")}`}
          />
          <InfoRow
            icon={ListChecks}
            label={t("root.exams.card.labels.questions")}
            value={`${exam.questions} ${t("root.exams.card.units.questions")}`}
          />
          <InfoRow
            icon={GraduationCap}
            label={t("root.exams.card.labels.totalMarks")}
            value={`${exam.totalMarks} ${t("root.exams.card.units.points")}`}
          />
          <InfoRow icon={AlarmClock} label={t("root.exams.card.labels.deadline")} value={exam.deadline} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("root.exams.card.labels.passingScore")}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">{exam.passingScore}%</p>
          </div>
          <div className="flex items-center gap-2">
            {!exam.completed && (
              <button
                type="button"
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("root.exams.card.actions.start", "Start")}
              </button>
            )}
            <button
              type="button"
              className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
 exam.completed
 ?"bg-primary text-primary-foreground hover:bg-primary-hover"
                  : "border border-border bg-card text-foreground hover:border-ring"
              }`}
            >
              {t("root.exams.card.actions.details")}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
