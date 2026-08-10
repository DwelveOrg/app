"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import ExamTopBar from "../../_components/ExamTopBar";

/**
 * "We have your paper" — for a test whose results are not released on submit.
 *
 * A route rather than a state on the result page, because it is where the
 * runtime navigates the instant a submission succeeds and it must render
 * without waiting on a result the server is not going to give yet. A student
 * who has just handed in an exam should not watch a spinner.
 *
 * A client component because the product's i18n is client-side; there is no
 * server `t`.
 */
export default function Page() {
  const { t } = useTranslation();

  return (
    <>
      <ExamTopBar
        title={t("exam.submitted.title")}
        exitHref="/assignments/exams"
        exitLabel={t("exam.backToAssignments")}
      />
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center md:px-6">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success"
        >
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="type-title mt-4 text-foreground">{t("exam.submitted.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("exam.submitted.description")}
        </p>
        <Button asChild className="mt-6">
          <Link href="/assignments/exams">{t("exam.backToAssignments")}</Link>
        </Button>
      </div>
    </>
  );
}
