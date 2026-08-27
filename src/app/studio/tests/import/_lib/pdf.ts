"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";

/**
 * The browser half of page selection.
 *
 * The PDF is parsed **in the browser**, before anything is uploaded: the page
 * count and the thumbnails are what the teacher picks from, and asking the
 * server for them would mean uploading a document the teacher might not even
 * want to import. It also means an over-long document is refused without
 * spending a byte of bandwidth.
 *
 * It is also what makes a large document importable at all. The upload rides a
 * Server Action, and the hosting platform rejects any request body over ~4.4 MB
 * at the edge — a ceiling no configuration moves. So the browser does not
 * upload the document: it extracts the pages the teacher selected and uploads
 * *those*, which is the only part the model was ever going to read. A 40 MB
 * scanned workbook becomes a 300 KB six-page slice, and the platform ceiling
 * stops being the thing that decides what a teacher may import.
 *
 * `pdfjs-dist` and `pdf-lib` are imported dynamically so their workers and font
 * data stay out of every other route's bundle — this module is only ever
 * reached from `/studio/tests/import`.
 */

type PdfJsModule = typeof import("pdfjs-dist");
type PdfLibModule = typeof import("pdf-lib");

let pdfjsPromise: Promise<PdfJsModule> | null = null;
let pdfLibPromise: Promise<PdfLibModule> | null = null;

/**
 * Loads pdf.js once per session and points it at a locally bundled worker.
 *
 * The worker URL is resolved through `new URL(..., import.meta.url)` rather
 * than a CDN string: `SECURITY.md` and the CSP govern what this app may fetch
 * at runtime, and a third-party script host is not on that list.
 */
async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/**
 * pdf.js reads PDFs; it cannot write one. Extracting pages needs a writer, and
 * `pdf-lib` is already the backend's, so the two halves of the product agree on
 * what a sliced PDF looks like.
 */
async function loadPdfLib(): Promise<PdfLibModule> {
  if (!pdfLibPromise) {
    pdfLibPromise = import("pdf-lib");
  }
  return pdfLibPromise;
}

export type LoadedPdf = {
  document: PDFDocumentProxy;
  pageCount: number;
  /**
   * Tears down the worker's copy of the document.
   *
   * Teardown lives on the *loading task* rather than the document proxy, so the
   * caller is handed a closure instead of being expected to know that — holding
   * the task itself would leak a pdf.js implementation detail into the screen.
   */
  destroy: () => Promise<void>;
};

/** Thrown for conditions the teacher can act on, so the screen can explain them. */
export class PdfLoadError extends Error {
  constructor(
    readonly code:
      | "UNREADABLE"
      | "TOO_MANY_PAGES"
      | "DOCUMENT_TOO_LARGE"
      | "SELECTION_TOO_LARGE",
    /**
     * For `SELECTION_TOO_LARGE`: how many pages of this weight *would* fit.
     *
     * A refusal that only says no leaves the teacher guessing, and the guess
     * costs another minute of re-rendering to be told no again. By the time we
     * refuse we have measured what a page of this document actually weighs, so
     * we can name the number that works and let them import in two passes.
     */
    readonly fittingPages?: number,
  ) {
    super(code);
    this.name = "PdfLoadError";
  }
}

/**
 * Opens a PDF and checks it against the limits the server serves.
 *
 * `maxDocumentBytes` — not `maxBytes` — is the gate here. The upload cap applies
 * to the slice this screen builds later, and refusing a 20 MB source document
 * against a 4 MB *transport* budget would reject files this flow handles
 * perfectly well. The page-count check is repeated server-side; this copy
 * exists to give the teacher an answer immediately rather than after a failed
 * upload.
 */
export async function loadPdf(
  file: File,
  limits: { maxDocumentPages: number; maxDocumentBytes: number },
): Promise<LoadedPdf> {
  if (file.size > limits.maxDocumentBytes) {
    throw new PdfLoadError("DOCUMENT_TOO_LARGE");
  }

  const pdfjs = await loadPdfJs();
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });

  let document: PDFDocumentProxy;
  try {
    document = await loadingTask.promise;
  } catch {
    void loadingTask.destroy();
    throw new PdfLoadError("UNREADABLE");
  }

  if (document.numPages > limits.maxDocumentPages) {
    void loadingTask.destroy();
    throw new PdfLoadError("TOO_MANY_PAGES");
  }

  return {
    document,
    pageCount: document.numPages,
    destroy: () => loadingTask.destroy(),
  };
}

/**
 * Renders one page to a data URL for use as a thumbnail.
 *
 * Deliberately small (`maxWidth` defaults to a thumbnail's worth of pixels):
 * these render on modest hardware, and a teacher picking pages needs to
 * recognise a page, not read it.
 */
export async function renderPageThumbnail(
  document: PDFDocumentProxy,
  pageNumber: number,
  maxWidth = 220,
): Promise<string | null> {
  const page = await document.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: maxWidth / base.width });

  const canvas = window.document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  const context = canvas.getContext("2d");
  if (!context) return null;

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  page.cleanup();

  return canvas.toDataURL("image/jpeg", 0.7);
}

/* -------------------------------------------------------------------------- */
/* Building the upload                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The resolution a scanned page is first measured at.
 *
 * Roughly 150 DPI on A4, and deliberately not higher: the model rasterises PDF
 * pages to around a thousand pixels on the long edge before it looks at them,
 * so pixels beyond that are bytes spent on detail nothing downstream reads.
 */
const RASTER_START_EDGE = 1800;
const RASTER_START_QUALITY = 0.82;

/**
 * The floor. Below roughly 95 DPI, small print in a scanned worksheet stops
 * being reliably legible, and an import the model cannot read is worse than an
 * honest refusal that tells the teacher to select fewer pages.
 */
const RASTER_MIN_EDGE = 1100;
const RASTER_MIN_QUALITY = 0.55;

/**
 * What a rebuilt PDF costs beyond its images: the catalogue, the page tree, one
 * page object and one XObject reference per page. Measured at a few hundred
 * bytes a page; rounded up, because underestimating it means a pass that misses
 * the budget by a hair and has to be thrown away.
 */
const RASTER_PDF_OVERHEAD_BYTES = 2_000;
const RASTER_PER_PAGE_OVERHEAD_BYTES = 600;

export type PreparedUpload = {
  /** The PDF actually sent: only the selected pages, in the order chosen. */
  file: File;
  /** The slice's own page range — always `1-N`, because the slice *is* the selection. */
  pages: string;
  /** True when the pages had to be re-rendered as images to fit the budget. */
  downsampled: boolean;
};

export type PrepareProgress = {
  step: "extracting" | "downsampling";
  done: number;
  total: number;
};

/**
 * Turns the teacher's page selection into the file that gets uploaded.
 *
 * Two strategies, in order of fidelity:
 *
 * 1. **Extract.** Copy the selected pages into a new document with `pdf-lib`.
 *    Fonts, vectors and the text layer survive intact, and only the resources
 *    those pages reference come along — a chapter out of a workbook is a few
 *    hundred kilobytes. This is what happens for almost every document.
 *
 * 2. **Downsample.** If the extracted slice is still over budget — which means
 *    the pages are scans, where each page is a full-page photograph — re-render
 *    them through pdf.js at a bounded resolution and rebuild the PDF from
 *    JPEGs.
 *
 * The second strategy is *measured*, not stepped. Re-rendering forty scanned
 * pages is tens of seconds of work, so walking a ladder of fixed resolutions
 * until one happens to fit spends that cost several times over — and the first
 * rung of such a ladder is always far too big for a large selection anyway.
 * Instead one page is rendered as a probe, its weight is multiplied by the
 * number of pages, and the resolution that fits the budget is solved for
 * directly. JPEG bytes track pixel area, so the edge that fits is the probe's
 * edge times the square root of how much smaller the pages need to be. Pages
 * vary, so a single corrective pass follows if the prediction overshoots.
 *
 * When even the floor resolution does not fit, this refuses rather than
 * uploading something illegible, and the screen asks for fewer pages — which is
 * an instruction a teacher can actually act on, unlike a 413.
 */
export async function preparePagesForUpload(input: {
  source: File;
  document: PDFDocumentProxy;
  pages: number[];
  maxBytes: number;
  onProgress?: (progress: PrepareProgress) => void;
}): Promise<PreparedUpload> {
  const { source, document, pages, maxBytes } = input;
  if (pages.length === 0) {
    throw new PdfLoadError("SELECTION_TOO_LARGE");
  }

  const name = uploadName(source.name);
  const pageRange = `1-${pages.length}`;
  const report = (step: PrepareProgress["step"], done: number) =>
    input.onProgress?.({ step, done, total: pages.length });

  // A selection whose pages are already, on average, far heavier than the whole
  // budget will not fit however it is copied. Skipping the attempt matters:
  // extraction parses the entire source document a second time, and on a 50 MB
  // scan that is the largest allocation this flow ever makes.
  const estimatedSliceBytes = (source.size * pages.length) / document.numPages;

  if (estimatedSliceBytes <= maxBytes * 2.5) {
    report("extracting", 0);
    const extracted = await extractPages(source, pages);
    if (extracted && extracted.byteLength <= maxBytes) {
      return {
        file: toPdfFile(extracted, name),
        pages: pageRange,
        downsampled: false,
      };
    }
  }

  // The budget one page may occupy, once the document's own structure is paid
  // for.
  const perPageBudget =
    (maxBytes - RASTER_PDF_OVERHEAD_BYTES) / pages.length -
    RASTER_PER_PAGE_OVERHEAD_BYTES;

  /** How many pages the last measured per-page weight would allow. */
  const fittingPages = (perPageImageBytes: number) =>
    Math.max(
      1,
      Math.floor(
        (maxBytes - RASTER_PDF_OVERHEAD_BYTES) /
          (perPageImageBytes + RASTER_PER_PAGE_OVERHEAD_BYTES),
      ),
    );

  if (perPageBudget <= 0) {
    throw new PdfLoadError("SELECTION_TOO_LARGE", 1);
  }

  report("downsampling", 0);
  const probe = await renderPageJpeg(
    document,
    pages[0],
    RASTER_START_EDGE,
    RASTER_START_QUALITY,
  );

  let settings = solveRasterSettings(probe.byteLength, perPageBudget);
  let measuredPerPage = probe.byteLength;

  // Two passes at most: the predicted one, and one correction using what that
  // pass actually weighed. A third would cost another full re-render to chase a
  // few percent, and by then the honest answer is "select fewer pages".
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const rendered = await rasterizePages({
      document,
      pages,
      ...settings,
      abortOverBytes: maxBytes,
      onProgress: (done) => report("downsampling", done),
    });

    if (rendered.fits) {
      return {
        file: toPdfFile(rendered.bytes, name),
        pages: pageRange,
        downsampled: true,
      };
    }

    measuredPerPage = rendered.imageBytes / rendered.pagesRendered;

    if (settings.maxEdge <= RASTER_MIN_EDGE && settings.quality <= RASTER_MIN_QUALITY) {
      break;
    }

    const corrected = solveRasterSettings(
      // Re-express the measurement at the probe's resolution so the same solver
      // applies: bytes scale with area, and area scales with the edge squared.
      measuredPerPage * (RASTER_START_EDGE / settings.maxEdge) ** 2,
      perPageBudget,
    );
    if (
      corrected.maxEdge >= settings.maxEdge &&
      corrected.quality >= settings.quality
    ) {
      // The correction did not ask for anything smaller, so a second pass would
      // reproduce the first. Stop rather than re-render for nothing.
      break;
    }
    settings = corrected;
  }

  throw new PdfLoadError("SELECTION_TOO_LARGE", fittingPages(measuredPerPage));
}

/**
 * Solves for the resolution at which a page of `probeBytes` (measured at
 * `RASTER_START_EDGE` / `RASTER_START_QUALITY`) would fit `budgetBytes`.
 *
 * Resolution carries the reduction first, because losing pixels degrades a scan
 * more gracefully than JPEG artefacts do. Quality is only spent once the edge
 * has hit its floor and the page still does not fit — at which point a slightly
 * blockier image is strictly better than a refusal.
 */
function solveRasterSettings(
  probeBytes: number,
  budgetBytes: number,
): { maxEdge: number; quality: number } {
  if (probeBytes <= budgetBytes) {
    return { maxEdge: RASTER_START_EDGE, quality: RASTER_START_QUALITY };
  }

  // The 0.95 absorbs the part of a JPEG that does not shrink with area: the
  // headers, the quantisation tables, and the coarsest DC coefficients.
  const ideal = RASTER_START_EDGE * Math.sqrt(budgetBytes / probeBytes) * 0.95;
  const maxEdge = Math.max(RASTER_MIN_EDGE, Math.floor(ideal));

  if (ideal >= RASTER_MIN_EDGE) {
    return { maxEdge, quality: RASTER_START_QUALITY };
  }

  const shortfall = RASTER_MIN_EDGE / ideal;
  const quality = Math.max(
    RASTER_MIN_QUALITY,
    Number((RASTER_START_QUALITY / shortfall).toFixed(2)),
  );
  return { maxEdge, quality };
}

/**
 * Copies the selected pages out of the source document.
 *
 * Returns `null` rather than throwing when `pdf-lib` cannot read the file:
 * pdf.js already opened it, so this is a disagreement between two parsers, not
 * a broken document, and the downsampling path can still produce a good import
 * from what pdf.js sees.
 *
 * The bytes are re-read from the `File` instead of being threaded down from
 * `loadPdf`, because pdf.js transfers its copy to the worker and detaches the
 * original buffer.
 */
async function extractPages(
  source: File,
  pages: number[],
): Promise<Uint8Array | null> {
  try {
    const { PDFDocument } = await loadPdfLib();
    const parsed = await PDFDocument.load(await source.arrayBuffer(), {
      updateMetadata: false,
      ignoreEncryption: true,
    });
    const output = await PDFDocument.create();
    const copied = await output.copyPages(
      parsed,
      pages.map((page) => page - 1),
    );
    copied.forEach((page) => output.addPage(page));
    return await output.save();
  } catch {
    return null;
  }
}

type RasterResult =
  | { fits: true; bytes: Uint8Array }
  /** Abandoned once the images alone passed the budget, with what was measured. */
  | { fits: false; imageBytes: number; pagesRendered: number };

/**
 * Re-renders the selected pages as JPEGs and assembles them into a PDF.
 *
 * Pages are rendered and encoded one at a time and the canvas is released
 * between them: forty full-page bitmaps held at once is how this locks up the
 * hardware it is meant to rescue.
 *
 * The running total is checked against the budget as it goes. A pass that is
 * already over at page nine has nothing to gain from rendering the other
 * thirty-one, and the pages it did render measure the real per-page cost better
 * than the single probe did.
 */
async function rasterizePages(input: {
  document: PDFDocumentProxy;
  pages: number[];
  maxEdge: number;
  quality: number;
  abortOverBytes: number;
  onProgress?: (done: number) => void;
}): Promise<RasterResult> {
  const { PDFDocument } = await loadPdfLib();
  const output = await PDFDocument.create();
  let imageBytes = 0;

  for (const [index, pageNumber] of input.pages.entries()) {
    input.onProgress?.(index);

    const jpeg = await renderPageJpeg(
      input.document,
      pageNumber,
      input.maxEdge,
      input.quality,
    );
    imageBytes += jpeg.byteLength;

    if (imageBytes > input.abortOverBytes) {
      return { fits: false, imageBytes, pagesRendered: index + 1 };
    }

    const image = await output.embedJpg(jpeg);
    const page = output.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  input.onProgress?.(input.pages.length);
  const bytes = await output.save();
  return bytes.byteLength <= input.abortOverBytes
    ? { fits: true, bytes }
    : { fits: false, imageBytes, pagesRendered: input.pages.length };
}

async function renderPageJpeg(
  document: PDFDocumentProxy,
  pageNumber: number,
  maxEdge: number,
  quality: number,
): Promise<ArrayBuffer> {
  const page = await document.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  // The rendered long edge is *exactly* `maxEdge`, and the scale is whatever
  // gets it there. Clamping the scale instead — "never render larger than 1:1"
  // — reads as prudent and is wrong: a PDF page is measured in points, not
  // pixels, so 1:1 on A4 is 842px, about 72 DPI, and an embedded 300 DPI scan
  // would be thrown away to reach it. It also quietly breaks the solver, which
  // assumes bytes track `maxEdge` squared: with the scale pinned, asking for a
  // smaller edge changed almost nothing, so the same selection could be refused
  // at twelve pages and accepted at twenty-five.
  const scale = maxEdge / Math.max(base.width, base.height);
  const viewport = page.getViewport({ scale });

  const canvas = window.document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new PdfLoadError("UNREADABLE");
  }

  // JPEG has no alpha. Without an opaque ground, anything the page leaves
  // transparent encodes as black and the scan comes out inverted.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  try {
    await page.render({ canvas, canvasContext: context, viewport }).promise;
  } finally {
    page.cleanup();
  }

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );

  // Release the backing bitmap now rather than waiting for the collector; this
  // runs once per page and the pages are full-resolution.
  canvas.width = 0;
  canvas.height = 0;

  if (!blob) {
    throw new PdfLoadError("UNREADABLE");
  }
  return blob.arrayBuffer();
}

function toPdfFile(bytes: Uint8Array, name: string): File {
  return new File([bytes as BlobPart], name, { type: "application/pdf" });
}

/** Keeps the teacher's filename recognisable in the job list and the draft title. */
function uploadName(sourceName: string): string {
  const base = sourceName.replace(/\.pdf$/i, "").trim();
  return `${(base || "import").slice(0, 180)}.pdf`;
}
