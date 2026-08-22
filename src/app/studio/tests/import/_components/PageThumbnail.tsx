"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { renderPageThumbnail } from "../_lib/pdf";
import { cn } from "@/lib/utils";

/**
 * One selectable page.
 *
 * Rendering is deferred until the thumbnail is near the viewport. A 300-page
 * document is a supported upload, and rendering 300 canvases on mount would
 * lock up the modest hardware this product targets — so the observer is not an
 * optimisation, it is what makes the upper limit usable at all.
 */
export default function PageThumbnail({
  document,
  pageNumber,
  selected,
  disabled,
  onToggle,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
  selected: boolean;
  /** True when the selection cap is reached and this page is not already in it. */
  disabled: boolean;
  onToggle: (pageNumber: number, shiftKey: boolean) => void;
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLButtonElement | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    void renderPageThumbnail(document, pageNumber)
      .then((dataUrl) => {
        if (!cancelled) setSource(dataUrl);
      })
      .catch(() => {
        // A page that will not render is still selectable — the server reads the
        // real PDF, not this preview.
      });

    return () => {
      cancelled = true;
    };
  }, [document, pageNumber, visible]);

  return (
    <button
      ref={containerRef}
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={t("root.tests.import.pages.pageLabel", { page: pageNumber })}
      disabled={disabled}
      onClick={(event) => onToggle(pageNumber, event.shiftKey)}
      className={cn(
        "group relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-lg border bg-muted",
        "transition-[border-color,box-shadow,transform] duration-[--dur-2] ease-[--ease-out]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        selected
          ? "border-primary shadow-elev-2 ring-1 ring-primary/30"
          : "border-border hover:border-primary/35 hover:shadow-elev-1",
        disabled && "cursor-not-allowed opacity-40 hover:border-border hover:shadow-none",
      )}
    >
      {source ? (
        // eslint-disable-next-line @next/next/no-img-element -- a canvas data URL, not a remote asset
        <img
          src={source}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}

      <span
        className={cn(
          "absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-md border text-2xs font-semibold",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card/90 text-muted-foreground",
        )}
      >
        {selected ? <Check className="size-3" strokeWidth={3} /> : pageNumber}
      </span>

      {selected ? (
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-card/90 px-1.5 py-0.5 text-2xs font-medium text-foreground">
          {pageNumber}
        </span>
      ) : null}
    </button>
  );
}
