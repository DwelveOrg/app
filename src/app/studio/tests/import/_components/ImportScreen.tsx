"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { testImportErrorCodeSchema } from "@/app/(root)/_lib/test-import.schemas";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import {
  useCancelTestImportMutation,
  useCreateTestImportMutation,
  useInvalidateTestsAfterImport,
  useTestImportJobQuery,
  useTestImportLimitsQuery,
} from "@/app/(root)/_hooks/useTestImport";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import FormatMark from "@/components/tests/FormatMark";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/uploads/limits";
import StudioTopBar from "../../../_components/StudioTopBar";
import {
  loadPdf,
  PdfLoadError,
  preparePagesForUpload,
  type PrepareProgress,
} from "../_lib/pdf";
import ImportProgress from "./ImportProgress";
import PagePicker from "./PagePicker";


type Stage = "choose" | "pages" | "working";

export default function ImportScreen({
  classId,
  className,
}: {
  classId: string;
  className: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: limits } = useTestImportLimitsQuery();
  const createImport = useCreateTestImportMutation();
  const cancelImport = useCancelTestImportMutation();
  const invalidateTests = useInvalidateTestsAfterImport();

  /**
   * The values every import message interpolates.
   *
   * `size` is the *document* ceiling, because that is the number a teacher is
   * choosing a file against; the upload budget applies to the slice this screen
   * builds and is never quoted at them. Both go through `formatBytes` — writing
   * the division inline is what turned a 3.8 MB cap into "3 MB" in the copy.
   */
  const errorValues = useMemo(
    () => ({
      max: limits.maxDocumentPages,
      size: formatBytes(limits.maxDocumentBytes),
      pages: limits.maxSelectedPages,
    }),
    [limits],
  );

  const importErrorMessage = useCallback(
    (error: unknown) => {
      const message = error instanceof Error ? error.message : "";
      const code = testImportErrorCodeSchema.safeParse(message);
      return code.success
        ? t(`root.tests.import.errors.${code.data}`, errorValues)
        : message || t("root.tests.errorGeneric");
    },
    [errorValues, t],
  );

  const [stage, setStage] = useState<Stage>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  /** Teardown for the loaded document, kept so a re-pick does not leak a worker. */
  const destroyRef = useRef<(() => Promise<void>) | null>(null);
  /** Identifies the latest file-open request so two quick picks cannot race. */
  const openRequestRef = useRef(0);
  /** Stops a READY refetch from scheduling the same redirect more than once. */
  const redirectedJobRef = useRef<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [maxQuestions, setMaxQuestions] = useState<string>("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  /**
   * Where the browser is in building the upload.
   *
   * Extracting a few text pages is instantaneous, but re-rendering forty
   * scanned ones is tens of seconds of work with nothing else moving on screen.
   * A button that only spins would read as a hang.
   */
  const [preparing, setPreparing] = useState<PrepareProgress | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    data: job,
    isError: jobQueryFailed,
    isFetching: refreshingJob,
    refetch: retryJob,
  } = useTestImportJobQuery(jobId);

  /* ---------------------------------------------------------------------- */
  /* Opening a file                                                          */
  /* ---------------------------------------------------------------------- */

  const openFile = useCallback(
    async (candidate: File) => {
      const requestId = ++openRequestRef.current;
      setOpening(true);
      try {
        const loaded = await loadPdf(candidate, limits);
        if (requestId !== openRequestRef.current) {
          await loaded.destroy();
          return;
        }
        // Release the previous document before replacing it — picking three
        // files in a row should not leave three workers holding page data.
        const destroyPrevious = destroyRef.current;
        destroyRef.current = null;
        if (destroyPrevious) {
          await destroyPrevious().catch(() => undefined);
        }
        destroyRef.current = loaded.destroy;
        setFile(candidate);
        setDocument(loaded.document);
        setPageCount(loaded.pageCount);
        // Short documents are almost always the whole test, so pre-select
        // everything up to the cap. Anything longer starts empty, because
        // guessing at a chapter boundary would be worse than asking.
        setSelectedPages(
          loaded.pageCount <= limits.maxSelectedPages
            ? Array.from({ length: loaded.pageCount }, (_, index) => index + 1)
            : [],
        );
        setTitle(candidate.name.replace(/\.pdf$/i, ""));
        setStage("pages");
      } catch (error) {
        if (requestId !== openRequestRef.current) return;
        const code = error instanceof PdfLoadError ? error.code : "UNREADABLE";
        toast.error(t(`root.tests.import.errors.${code}`, errorValues));
      } finally {
        if (requestId === openRequestRef.current) setOpening(false);
      }
    },
    [errorValues, limits, t],
  );

  /** Release the pdf.js worker's copy of the document when the screen unmounts. */
  useEffect(() => {
    return () => {
      openRequestRef.current += 1;
      void destroyRef.current?.();
      destroyRef.current = null;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Finishing                                                               */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (job?.status !== "READY" || !job.testId) return;
    if (redirectedJobRef.current === job.id) return;
    redirectedJobRef.current = job.id;
    void invalidateTests();
    // The job id rides the query string so the builder can show what the import
    // left unfinished — the banner needs facts about absences (no answer set,
    // questions dropped at the cap) that the test tree itself cannot express.
    router.replace(
      `${studioRoutes.builder(job.testId)}?import=${encodeURIComponent(job.id)}`,
    );
  }, [invalidateTests, job?.id, job?.status, job?.testId, router]);

  /**
   * Builds the upload, then starts the job.
   *
   * The source document never leaves the browser. What is uploaded is a PDF of
   * exactly the selected pages, so `pages` becomes `1-N` — the slice's own
   * numbering, which is also what the model is told to treat as ordinal 1. The
   * backend re-slices that range and gets the same pages back, so nothing about
   * the API contract changes; it simply receives a document that fits.
   */
  const submit = async () => {
    if (!file || !document || selectedPages.length === 0) return;
    if (preparing || createImport.isPending) return;

    let prepared;
    try {
      prepared = await preparePagesForUpload({
        source: file,
        document,
        pages: selectedPages,
        maxBytes: limits.maxBytes,
        onProgress: setPreparing,
      });
    } catch (error) {
      const failure =
        error instanceof PdfLoadError
          ? error
          : new PdfLoadError("SELECTION_TOO_LARGE");
      toast.error(
        t(`root.tests.import.errors.${failure.code}`, {
          ...errorValues,
          // Only `SELECTION_TOO_LARGE` reads this, and only when the pages were
          // actually weighed. Falling back to the current selection keeps the
          // sentence grammatical rather than printing "about undefined pages".
          count: failure.fittingPages ?? selectedPages.length,
        }),
      );
      return;
    } finally {
      setPreparing(null);
    }

    if (prepared.downsampled) {
      // Worth saying out loud: the pages were photographs, they were re-rendered
      // smaller to fit, and that is a reason to read the draft more carefully
      // than usual.
      toast.info(t("root.tests.import.downsampled"));
    }

    const parsed = Number.parseInt(maxQuestions, 10);
    createImport.mutate(
      {
        classId,
        file: prepared.file,
        pages: prepared.pages,
        maxQuestions: Number.isInteger(parsed) ? parsed : undefined,
        title: title.trim() || undefined,
      },
      {
        onSuccess: ({ jobId: created }) => {
          setJobId(created);
          setStage("working");
        },
        onError: (error) => toast.error(importErrorMessage(error)),
      },
    );
  };

  const cancel = () => {
    if (!jobId) return;
    cancelImport.mutate(
      { jobId },
      {
        onSuccess: () => {
          setJobId(null);
          setStage("pages");
        },
        onError: (error) => toast.error(importErrorMessage(error)),
      },
    );
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  const canSubmit = Boolean(file) && selectedPages.length > 0;
  const busy = preparing !== null || createImport.isPending;
  const failed = job?.status === "FAILED";

  return (
    <>
      <StudioTopBar
        exitHref={studioRoutes.classTests(classId)}
        exitLabel={t("root.tests.import.cancel")}
        identity={
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {t("root.tests.import.title")}
            </p>
            {className ? (
              <p className="truncate text-2xs text-muted-foreground">{className}</p>
            ) : null}
          </div>
        }
        actions={
          stage === "pages" ? (
            // The button that actually starts the model. It carries the same
            // lit treatment as the entry points that lead here, so a teacher
            // recognises "this one costs a quota and takes a minute" before
            // pressing it. Disabled controls drop the glow: light on a button
            // that does nothing is a lie.
            <Button
              type="button"
              size="sm"
              onClick={() => void submit()}
              disabled={!canSubmit || busy}
              loading={busy}
              className={cn(
                canSubmit && !busy && "ai-glow ai-sheen",
                "bg-[image:var(--brand-gradient)] shadow-elev-brand hover:brightness-105",
              )}
            >
              {t("root.tests.import.submit")}
              <ArrowRight />
            </Button>
          ) : null
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-8">
          {stage === "choose" && !limits.enabled ? (
            <div className="mx-auto max-w-lg py-6">
              <Surface padding="lg">
                <p className="text-sm text-foreground">
                  {t("root.tests.import.errors.DISABLED")}
                </p>
              </Surface>
            </div>
          ) : stage === "choose" ? (
            <ChooseFile
              opening={opening}
              inputRef={fileInputRef}
              maxSize={formatBytes(limits.maxDocumentBytes)}
              maxPages={limits.maxDocumentPages}
              onPick={openFile}
            />
          ) : null}

          {stage !== "choose" && document ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
              <div className="min-w-0 space-y-6">
                <div>
                  <h1 className="type-title text-foreground">
                    {t("root.tests.import.pages.heading")}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("root.tests.import.pages.subheading", { count: pageCount })}
                  </p>
                </div>

                <PagePicker
                  document={document}
                  pageCount={pageCount}
                  limits={limits}
                  selected={selectedPages}
                  onChange={setSelectedPages}
                />
              </div>

              <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                <Surface padding="md" className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FormatMark icon={FileText} />
                    <div className="min-w-0">
                      <p className="type-label truncate text-foreground">
                        {title.trim() || t("root.tests.import.untitled")}
                      </p>
                      <p className="truncate text-2xs text-muted-foreground">
                        {file?.name}
                      </p>
                    </div>
                  </div>

                  <Field label={t("root.tests.create.nameLabel")} size="sm">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={title}
                        size="sm"
                        maxLength={TEST_LIMITS.titleChars}
                        placeholder={t("root.tests.create.namePlaceholder")}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                    )}
                  </Field>

                  <Field
                    label={t("root.tests.import.maxQuestions.label")}
                    hint={t("root.tests.import.maxQuestions.hint", {
                      max: limits.maxQuestions,
                    })}
                    size="sm"
                  >
                    {({ id }) => (
                      <Input
                        id={id}
                        value={maxQuestions}
                        size="sm"
                        inputMode="numeric"
                        placeholder={String(limits.maxQuestions)}
                        onChange={(event) =>
                          setMaxQuestions(event.target.value.replace(/[^0-9]/g, ""))
                        }
                        onBlur={() => {
                          const parsed = Number.parseInt(maxQuestions, 10);
                          if (Number.isInteger(parsed)) {
                            setMaxQuestions(
                              String(Math.min(Math.max(parsed, 1), limits.maxQuestions)),
                            );
                          }
                        }}
                      />
                    )}
                  </Field>

                  <div className="flex items-start gap-2 rounded-lg bg-muted px-2.5 py-2">
                    <Sparkles
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <p className="text-2xs leading-relaxed text-muted-foreground">
                      {t("root.tests.import.formatDetected")}
                    </p>
                  </div>
                </Surface>

                {preparing ? (
                  <Surface
                    variant="muted"
                    padding="sm"
                    elevation={0}
                    className="flex items-center gap-2.5"
                  >
                    <Loader2
                      className="size-3.5 shrink-0 animate-spin text-primary motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    <p aria-live="polite" className="text-2xs text-muted-foreground">
                      {preparing.step === "downsampling"
                        ? t("root.tests.import.preparing.downsampling", {
                            done: preparing.done,
                            total: preparing.total,
                          })
                        : t("root.tests.import.preparing.extracting")}
                    </p>
                  </Surface>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  disabled={busy}
                  onClick={() => {
                    void destroyRef.current?.();
                    destroyRef.current = null;
                    setStage("choose");
                    setFile(null);
                    setDocument(null);
                    setSelectedPages([]);
                  }}
                >
                  {t("root.tests.import.chooseAnother")}
                </Button>
              </aside>
            </div>
          ) : null}

        </div>
      </div>

      <ImportProgress
        open={stage === "working"}
        job={job}
        fileName={file?.name ?? ""}
        onCancel={failed ? undefined : cancel}
        canceling={cancelImport.isPending}
      >
        {jobQueryFailed ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm text-foreground">
              {t("root.tests.import.progress.statusError")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={refreshingJob}
              onClick={() => void retryJob()}
            >
              {t("root.tests.import.progress.retryStatus")}
            </Button>
          </div>
        ) : null}

        {failed ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm text-foreground">
              {t(
                `root.tests.import.errors.${job?.errorCode ?? "EXTRACTION_FAILED"}`,
                errorValues,
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setJobId(null);
                setStage("pages");
              }}
            >
              {t("root.tests.import.tryAgain")}
            </Button>
          </div>
        ) : null}
      </ImportProgress>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Step one                                                                    */
/* -------------------------------------------------------------------------- */

function ChooseFile({
  opening,
  inputRef,
  maxSize,
  maxPages,
  onPick,
}: {
  opening: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Already formatted — the caller owns the units so the copy cannot drift. */
  maxSize: string;
  maxPages: number;
  onPick: (file: File) => void;
}) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="text-center">
        <h1 className="type-title text-foreground">
          {t("root.tests.import.choose.heading")}
        </h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {t("root.tests.import.choose.subheading")}
        </p>
      </div>

      <Surface
        variant="dashed"
        padding="lg"
        elevation={0}
        className={cn(
          "flex flex-col items-center gap-4 py-12 text-center transition-colors duration-[--dur-2]",
          dragging && "border-primary bg-accent/40",
        )}
        onDragOver={(event: React.DragEvent) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: React.DragEvent) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files?.[0];
          if (dropped && !opening) onPick(dropped);
        }}
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FileText className="size-6" />
        </span>

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t("root.tests.import.choose.dropzone")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("root.tests.import.choose.constraints", {
              size: maxSize,
              pages: maxPages,
            })}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={opening}
          disabled={opening}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {t("root.tests.import.choose.browse")}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          disabled={opening}
          className="sr-only"
          onChange={(event) => {
            const picked = event.target.files?.[0];
            // Reset so re-picking the same file after an error still fires.
            event.target.value = "";
            if (picked) onPick(picked);
          }}
        />
      </Surface>

      <Surface variant="muted" padding="sm" elevation={0} className="flex gap-2.5">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("root.tests.import.choose.explainer")}
        </p>
      </Surface>
    </div>
  );
}
