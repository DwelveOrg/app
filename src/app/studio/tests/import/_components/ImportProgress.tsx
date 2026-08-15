"use client";

import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import Dialog from "@/app/(root)/_components/Dialog";
import type {
  TestImportJob,
  TestImportStatus,
} from "@/app/(root)/_lib/test-import.schemas";
import { cn } from "@/lib/utils";


type Step = {
  key: string;
  statuses: TestImportStatus[];
};

const STEPS: Step[] = [
  { key: "uploading", statuses: ["PENDING", "UPLOADING"] },
  { key: "analyzing", statuses: ["ANALYZING"] },
  { key: "extracting", statuses: ["EXTRACTING"] },
  { key: "building", statuses: ["BUILDING", "READY"] },
];

/** Where each status sits in the sequence, for deciding done vs active vs waiting. */
const STATUS_ORDER: TestImportStatus[] = [
  "PENDING",
  "UPLOADING",
  "ANALYZING",
  "EXTRACTING",
  "BUILDING",
  "READY",
];

type StepState = "done" | "active" | "waiting";

/**
 * A failed job reports only that it failed, never which stage it was in, so no
 * step is marked as the culprit — blaming "Uploading your file" for a failure
 * that happened during extraction would be a confident lie. On failure every
 * step goes quiet and the error message below carries the meaning.
 */
function stepState(step: Step, status: TestImportStatus): StepState {
  if (status === "FAILED") return "waiting";

  if (step.statuses.includes(status)) {
    return status === "READY" ? "done" : "active";
  }

  const currentIndex = STATUS_ORDER.indexOf(status);
  const stepIndex = Math.min(
    ...step.statuses.map((entry) => STATUS_ORDER.indexOf(entry)),
  );
  return currentIndex > stepIndex ? "done" : "waiting";
}

export default function ImportProgress({
  open,
  job,
  fileName,
  onCancel,
  canceling,
  children,
}: {
  open: boolean;
  job: TestImportJob | undefined;
  fileName: string;
  onCancel?: () => void;
  canceling?: boolean;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const status: TestImportStatus = job?.status ?? "PENDING";
  const failed = status === "FAILED";

  return (
    <Dialog
      open={open}
      dismissible={false}
      title={
        failed
          ? t("root.tests.import.progress.failedTitle")
          : t("root.tests.import.progress.title")
      }
      description={fileName}
      contentClassName="max-w-lg"
    >
      <div className="space-y-5">
        {failed ? (
          <p className="flex items-center gap-2 text-13 text-destructive">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-destructive/10">
              <X className="size-3" strokeWidth={3} />
            </span>
            {t("root.tests.import.progress.failedHint")}
          </p>
        ) : (
          <WorkingBar percent={job?.progress ?? 0} />
        )}

        <ol className="relative space-y-0">
          {STEPS.map((step, index) => {
            const state = stepState(step, status);
            const isLast = index === STEPS.length - 1;

            return (
              <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
                {!isLast ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-[0.6875rem] top-6 h-[calc(100%-1.5rem)] w-px",
                      state === "done" ? "bg-primary/40" : "bg-border",
                    )}
                  />
                ) : null}

                <span
                  className={cn(
                    "relative z-10 flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border",
                    "transition-colors duration-[--dur-2] ease-[--ease-out]",
                    state === "done" && "border-primary bg-primary text-primary-foreground",
                    state === "active" && "border-primary bg-card text-primary",
                    state === "waiting" && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {state === "done" ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : state === "active" ? (
                    <Loader2 className="size-3 animate-spin motion-reduce:animate-none" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>

                <div className="min-w-0 flex-1 pt-px">
                  <p
                    className={cn(
                      "text-sm",
                      state === "waiting"
                        ? "text-muted-foreground"
                        : "font-medium text-foreground",
                    )}
                  >
                    {t(`root.tests.import.progress.steps.${step.key}`)}
                  </p>
                  <StepDetail stepKey={step.key} state={state} job={job} />
                </div>
              </li>
            );
          })}
        </ol>

        {children}

        {!failed && onCancel ? (
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={canceling}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
            >
              {t("root.tests.import.progress.cancel")}
            </button>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

function WorkingBar({ percent }: { percent: number }) {
  const { t } = useTranslation();
  const clamped = Math.min(100, Math.max(4, Math.round(percent)));

  return (
    <div className="space-y-2">
      <div
        className="relative h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label={t("root.tests.import.progress.title")}
      >
        <div
          className="working-bar-fill relative h-full overflow-hidden rounded-full transition-[width] duration-[--dur-4] ease-[--ease-out-quint]"
          style={{ width: `${clamped}%` }}
        >
          <span aria-hidden className="working-bar-sheen absolute inset-y-0 left-0 block" />
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-2xs text-muted-foreground">
        <Sparkles className="size-3 text-primary" aria-hidden="true" />
        {t("root.tests.import.progress.working")}
        <span className="ml-auto tabular-nums">{Math.round(percent)}%</span>
      </p>
    </div>
  );
}

/**
 * The number under an active step.
 *
 * Only rendered where the backend actually has a figure — a step that invents
 * "0 of 0" while it waits is worse than one that says nothing.
 */
function StepDetail({
  stepKey,
  state,
  job,
}: {
  stepKey: string;
  state: StepState;
  job: TestImportJob | undefined;
}) {
  const { t } = useTranslation();
  if (!job || state === "waiting") return null;

  if (stepKey === "analyzing" && job.pageCount) {
    return (
      <p className="mt-0.5 text-2xs text-muted-foreground">
        {t("root.tests.import.progress.pages", { count: job.pageCount })}
      </p>
    );
  }

  if (stepKey === "extracting" && job.questionCount != null) {
    const found = job.questionsFound ?? null;
    return (
      <p className="mt-0.5 text-2xs text-muted-foreground">
        {found
          ? t("root.tests.import.progress.questionsOf", {
              count: job.questionCount,
              total: found,
            })
          : t("root.tests.import.progress.questions", { count: job.questionCount })}
      </p>
    );
  }

  return null;
}
