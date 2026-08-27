"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTestImportJobQuery } from "@/app/(root)/_hooks/useTestImport";
import {
  countMissingAnswers,
  hadDroppedQuestions,
  wasIncomplete,
  wasTruncated,
} from "@/app/(root)/_lib/test-import.schemas";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";

/**
 * What the import left for the teacher to do.
 *
 * Shown once, at the top of a builder opened straight from an import. It exists
 * because the facts a teacher most needs to know after an import are
 * invisible in the tree itself: how many questions still have no correct answer
 * marked, and why an outline count may exceed the imported count. These are
 * facts about what *did not* happen, and a list of questions cannot show an
 * absence.
 *
 * A signpost, not a safety net — publish validation independently refuses a test
 * with unanswered questions, so dismissing this cannot ship a broken test.
 */
export default function ImportSummaryBanner({ jobId }: { jobId: string }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const { data: job } = useTestImportJobQuery(dismissed ? null : jobId);

  if (dismissed || !job || job.status !== "READY") return null;

  const missing = countMissingAnswers(job);
  const dropped = hadDroppedQuestions(job);
  const truncated = wasTruncated(job);
  const incomplete = wasIncomplete(job);

  return (
    <Surface
      variant="muted"
      padding="none"
      radius="lg"
      elevation={0}
      className="flex flex-wrap items-start gap-3 border-primary/25 bg-accent/40 px-4 py-3"
    >
      {/* Icon plus text: never the tint alone. */}
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">
          {t("root.tests.import.banner.title", { count: job.questionCount ?? 0 })}
        </p>

        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {missing > 0 ? (
            <li>{t("root.tests.import.banner.missingAnswers", { count: missing })}</li>
          ) : (
            <li>{t("root.tests.import.banner.allAnswered")}</li>
          )}

          {truncated ? (
            <li>
              {t("root.tests.import.banner.truncated", {
                count: job.questionCount ?? 0,
                total: job.questionsFound ?? 0,
              })}
            </li>
          ) : null}

          {incomplete ? (
            <li>
              {t("root.tests.import.banner.incomplete", {
                count: job.questionCount ?? 0,
                total: job.questionsFound ?? 0,
              })}
            </li>
          ) : null}

          {dropped ? (
            <li>{t("root.tests.import.banner.dropped")}</li>
          ) : null}

          <li>{t("root.tests.import.banner.review")}</li>
        </ul>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("root.tests.import.banner.dismiss")}
        onClick={() => setDismissed(true)}
      >
        <X />
      </Button>
    </Surface>
  );
}
