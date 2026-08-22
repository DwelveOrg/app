"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { ImageUp, Loader2, Paperclip, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import Dialog, { DialogFooterActions } from "@/app/(root)/_components/Dialog";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Textarea from "@/components/ui/textarea";
import { compressImage } from "@/lib/uploads/compressImage";
import { formatBytes } from "@/lib/uploads/limits";
import { submitReportAction } from "@/lib/reports/reports.actions";
import {
  REPORT_MESSAGE_MAX,
  REPORT_MESSAGE_MIN,
  REPORT_SCREENSHOT_MAX_BYTES,
  REPORT_SCREENSHOT_TYPES,
  type ReportKind,
} from "@/lib/reports/reports.schemas";
import { cn } from "@/lib/utils";

const KINDS: ReportKind[] = ["BUG", "FEEDBACK", "QUESTION"];

/**
 * "Something is wrong here", said from wherever the user is.
 *
 * ## Why a screenshot is the point
 *
 * The old path was the profile Support tab, which composed a `mailto:`. A
 * `mailto:` URL cannot carry an attachment, so the one artefact that makes a
 * bug report actionable was the one thing it could not send — and the modal
 * ended up asking the user to attach it themselves in a mail client they may
 * not have configured. This posts to `POST /reports` and the image goes with it.
 *
 * Paste is a first-class input, not a convenience: the way a person actually
 * takes a screenshot is a system shortcut that puts it on the clipboard, and
 * requiring them to save it to disk first to satisfy a file input adds a step
 * to the exact moment they are already frustrated.
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<ReportKind>(defaultKind);
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  /** The source file's size, kept only to say "4.8 MB → 210 KB" when it shrank. */
  const [originalBytes, setOriginalBytes] = useState<number | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const trimmed = message.trim();
  const tooShort = trimmed.length < REPORT_MESSAGE_MIN;

  // Derived rather than stored: the preview *is* the file, so a second piece of
  // state to keep in step with it would only be a way for the two to disagree.
  const previewUrl = useMemo(
    () => (screenshot ? URL.createObjectURL(screenshot) : null),
    [screenshot],
  );

  // Object URLs are a manual allocation. Without the revoke the blob stays
  // pinned for the lifetime of the document, and this dialog can be opened,
  // filled, and cleared repeatedly in one session.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const reset = () => {
    setKind(defaultKind);
    setMessage("");
    setScreenshot(null);
    setOriginalBytes(null);
    setPreparing(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  /**
   * Takes the file, then makes it small enough to actually arrive.
   *
   * The size check is on the *source* — the user's screenshot may legitimately
   * be 8 MB — while what gets uploaded is whatever `compressImage` can fit into
   * the transport budget. Without that step a real screenshot is destroyed at
   * Vercel's edge with a 413 that never reaches this component; see
   * `src/lib/uploads/limits.ts`.
   */
  const acceptFile = async (file: File | null | undefined) => {
    if (!file) return;

    if (!REPORT_SCREENSHOT_TYPES.includes(file.type as never)) {
      setError(t("report.errors.wrongType"));
      return;
    }
    if (file.size > REPORT_SCREENSHOT_MAX_BYTES) {
      setError(t("report.errors.tooLarge"));
      return;
    }

    setError(null);
    setPreparing(true);

    try {
      const { file: upload, compressed, originalBytes: before } = await compressImage(file);

      setScreenshot(upload);
      setOriginalBytes(compressed ? before : null);
    } catch {
      // Every failure here is the same failure from the reporter's side: this
      // particular image cannot be attached. Naming the decode step would not
      // tell them anything they can act on.
      setError(t("report.errors.unreadable"));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setPreparing(false);
    }
  };

  /** Paste anywhere in the dialog, which is where a fresh screenshot lands. */
  const handlePaste = (event: React.ClipboardEvent) => {
    const image = Array.from(event.clipboardData.files).find((file) =>
      file.type.startsWith("image/"),
    );

    if (image) {
      event.preventDefault();
      void acceptFile(image);
    }
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
    if (screenshot) form.set("screenshot", screenshot);

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
        // A Server Action can fail *as transport*, before the action body runs
        // and therefore before it can return `{ error }`. The one that mattered
        // was Vercel's edge 413 on an oversized body: its response is not the
        // action's serialised result, so React rejects here. Unhandled, the
        // rejection escaped the transition and the dialog simply sat there —
        // the exact "nothing happens when I attach an image" this fixes.
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
          // Also while an attachment is still being prepared: submitting then
          // would file the report without the screenshot the user just chose.
          submitDisabled={tooShort || sending || preparing}
          onSubmit={submit}
        />
      }
    >
      <div className="space-y-4" onPaste={handlePaste}>
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

        <div>
          <p className="mb-1.5 block text-sm font-medium text-foreground">
            {t("report.screenshotLabel")}
          </p>

          {screenshot && previewUrl ? (
            <div className="flex items-center gap-3 rounded-xl border border-border p-2">
              {/* A plain <img>: the blob URL has no known dimensions and is not
                  a candidate for next/image optimisation. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={t("report.screenshotPreviewAlt")}
                className="size-16 shrink-0 rounded-lg border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-13 font-medium text-foreground">
                  {screenshot.name || t("report.pastedImage")}
                </p>
                {/* Said, not hidden. A file the user chose arriving at a
                    different size is a change they should be able to see —
                    and it explains why an 8 MB capture uploads instantly. */}
                <p className="text-2xs text-muted-foreground">
                  {originalBytes
                    ? t("report.screenshotOptimised", {
                        from: formatBytes(originalBytes),
                        to: formatBytes(screenshot.size),
                      })
                    : formatBytes(screenshot.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("report.removeScreenshot")}
                onClick={() => {
                  setScreenshot(null);
                  setOriginalBytes(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <label
              aria-busy={preparing}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-5 text-center transition",
                "hover:border-primary/50 hover:bg-muted/50",
                preparing && "pointer-events-none border-primary/40 bg-muted/50",
              )}
            >
              {preparing ? (
                <Loader2
                  className="size-5 animate-spin text-primary motion-reduce:animate-none"
                  aria-hidden="true"
                />
              ) : (
                <ImageUp className="size-5 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="text-13 font-medium text-foreground">
                {preparing ? t("report.screenshotPreparing") : t("report.screenshotCta")}
              </span>
              <span className="type-caption text-muted-foreground">
                {t("report.screenshotHint")}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept={REPORT_SCREENSHOT_TYPES.join(",")}
                className="sr-only"
                disabled={preparing}
                onChange={(event) => void acceptFile(event.target.files?.[0])}
              />
            </label>
          )}
        </div>

        {/* Said out loud. Collecting the page URL and browser silently is the
            part that would be objectionable; collecting it is what makes the
            report answerable. */}
        <p className="flex items-start gap-2 type-caption text-muted-foreground">
          <Paperclip className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          {t("report.contextNotice", { page: pathname })}
        </p>
      </div>
    </Dialog>
  );
}

