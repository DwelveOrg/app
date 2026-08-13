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
 * `pdfjs-dist` is imported dynamically so its worker and font data stay out of
 * every other route's bundle — this module is only ever reached from
 * `/studio/tests/import`.
 */

type PdfJsModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJsModule> | null = null;

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
  constructor(readonly code: "UNREADABLE" | "TOO_MANY_PAGES" | "TOO_LARGE") {
    super(code);
    this.name = "PdfLoadError";
  }
}

/**
 * Opens a PDF and checks it against the limits the server serves.
 *
 * Both checks are repeated server-side — this copy exists to give the teacher
 * an answer immediately rather than after a failed upload.
 */
export async function loadPdf(
  file: File,
  limits: { maxDocumentPages: number; maxBytes: number },
): Promise<LoadedPdf> {
  if (file.size > limits.maxBytes) {
    throw new PdfLoadError("TOO_LARGE");
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
