"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import Dialog, { DialogFooterActions } from "@/app/(root)/_components/Dialog";
import Field from "@/components/ui/Field";
import Textarea from "@/components/ui/textarea";
import { submitReportAction } from "@/lib/reports/reports.actions";
import {
  REPORT_MESSAGE_MAX,
  REPORT_MESSAGE_MIN,
  type ReportKind,
} from "@/lib/reports/reports.schemas";
import { cn } from "@/lib/utils";

const KINDS: ReportKind[] = ["BUG", "FEEDBACK", "QUESTION"];

/**
 * "Something is wrong here", said from wherever the user is.
 *
 * Reports are deliberately text-only. The page and browser context collected
 * below give maintainers enough information to start triage without asking the
 * reporter to upload potentially sensitive screen content.
 *
 * ## What it collects without asking
 *
 * The page URL, viewport, locale, and user agent. These are the questions a
 * maintainer asks first and the reporter is worst placed to answer, so the
 * dialog answers them itself and says so — the disclosure exists because
 * collecting silently is the part that would be objectionable, not the
 * collecting.
 */
export default function ReportProblemDialog({
  open,
  onOpenChange,
  /** Preselects the kind for callers that already know it — the Support tab's
      "Report a bug" and "Suggest a feature" rows open the same dialog. */
  defaultKind = "BUG",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultKind?: ReportKind;
}) {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();

  const [kind, setKind] = useState<ReportKind>(defaultKind);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const trimmed = message.trim();
  const tooShort = trimmed.length < REPORT_MESSAGE_MIN;

  const reset = () => {
    setKind(defaultKind);
    setMessage("");
    setError(null);
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const submit = () => {
    if (tooShort) {
      setError(t("report.errors.tooShort", { count: REPORT_MESSAGE_MIN }));
      return;
    }

    const form = new FormData();
    form.set("message", trimmed);
    form.set("kind", kind);
    // `href` rather than `pathname` so a report about a filtered or deep-linked
    // view points at the view the reporter was actually looking at.
    form.set("pageUrl", window.location.href);
    form.set("userAgent", navigator.userAgent);
    form.set("viewport", `${window.innerWidth}x${window.innerHeight}`);
    form.set("locale", i18n.resolvedLanguage ?? i18n.language ?? "en");

    startSending(async () => {
      try {
        const result = await submitReportAction(form);

        if (result.error) {
          setError(result.error);
          return;
        }

        toast.success(t("report.sent"));
        close(false);
      } catch (cause) {
        // A Server Action can fail as transport before its body runs and never
        // return `{ error }`, so keep the dialog actionable on that path too.
        console.error("Report submission failed:", cause);
        setError(t("report.errors.transport"));
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("report.title")}
      description={t("report.description")}
      showClose
      closeLabel={t("report.close")}
      contentClassName="max-w-lg"
      footer={
        <DialogFooterActions
          cancelLabel={t("report.close")}
          submitLabel={sending ? t("report.sending") : t("report.submit")}
          isBusy={sending}
          submitDisabled={tooShort || sending}
          onSubmit={submit}
        />
      }
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-foreground">
            {t("report.kindLabel")}
          </legend>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={kind === option}
                onClick={() => setKind(option)}
                className={cn(
                  "interactive-flat rounded-[var(--radius-pill)] border px-3 py-1.5 text-13 font-medium transition",
                  kind === option
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t(`report.kinds.${option}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <Field
          label={t("report.messageLabel")}
          htmlFor="report-message"
          hint={t("report.messageHint")}
          error={error ?? undefined}
        >
          <Textarea
            id="report-message"
            surface="muted"
            value={message}
            maxLength={REPORT_MESSAGE_MAX}
            onChange={(event) => {
              setMessage(event.target.value);
              if (error) setError(null);
            }}
            placeholder={t(`report.placeholders.${kind}`)}
            aria-invalid={Boolean(error)}
            className="min-h-[132px]"
          />
        </Field>

        {/* Said out loud. Collecting the page URL and browser silently is the
            part that would be objectionable; collecting it is what makes the
            report answerable. */}
        <p className="flex items-start gap-2 type-caption text-muted-foreground">
          <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          {t("report.contextNotice", { page: pathname })}
        </p>
      </div>
    </Dialog>
  );
}
