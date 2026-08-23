"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PDFDocumentProxy } from "pdfjs-dist";

import {
  formatPageRange,
  parsePageRange,
} from "@/app/(root)/_lib/test-import.actions.schemas";
import type { TestImportLimits } from "@/app/(root)/_lib/test-import.schemas";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/utils";
import PageThumbnail from "./PageThumbnail";

/**
 * "Tell which pages" — the half of the flow that turns a book chapter, a
 * bundled past paper, or a workbook into something importable.
 *
 * Selection is visual first, because a teacher knows the test as *the pages
 * with the questions on them*, not as "12 through 18". The text field is the
 * same selection in the notation the backend takes, and the two stay in sync
 * both ways: clicking rewrites the text, typing re-selects the grid.
 *
 * The cap is enforced by disabling further pages rather than silently ignoring
 * clicks — a teacher who cannot tell whether a click registered will click
 * again, and conclude the feature is broken.
 */
export default function PagePicker({
  document,
  pageCount,
  limits,
  selected,
  onChange,
}: {
  document: PDFDocumentProxy;
  pageCount: number;
  limits: TestImportLimits;
  selected: number[];
  onChange: (pages: number[]) => void;
}) {
  const { t } = useTranslation();
  const rangeFieldId = useId();
  const lastToggledRef = useRef<number | null>(null);

  /** Local text state so a half-typed range does not fight the grid. */
  const [rangeDraft, setRangeDraft] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const atCap = selected.length >= limits.maxSelectedPages;
  const rangeText = rangeDraft ?? formatPageRange(selected);

  const commit = useCallback(
    (pages: number[]) => {
      setRangeDraft(null);
      onChange(pages.slice(0, limits.maxSelectedPages));
    },
    [limits.maxSelectedPages, onChange],
  );

  /**
   * Shift-click selects the run between the last toggled page and this one,
   * which is how a teacher picks "pages 12 to 18" without eighteen clicks.
   */
  const togglePage = useCallback(
    (pageNumber: number, shiftKey: boolean) => {
      const anchor = lastToggledRef.current;
      lastToggledRef.current = pageNumber;

      if (shiftKey && anchor !== null) {
        const from = Math.min(anchor, pageNumber);
        const to = Math.max(anchor, pageNumber);
        const run = Array.from({ length: to - from + 1 }, (_, index) => from + index);
        commit([...new Set([...selected, ...run])].sort((a, b) => a - b));
        return;
      }

      if (selectedSet.has(pageNumber)) {
        commit(selected.filter((page) => page !== pageNumber));
        return;
      }

      if (atCap) return;
      commit([...selected, pageNumber].sort((a, b) => a - b));
    },
    [atCap, commit, selected, selectedSet],
  );

  const selectAll = () =>
    commit(
      Array.from(
        { length: Math.min(pageCount, limits.maxSelectedPages) },
        (_, index) => index + 1,
      ),
    );

  const countLabel = t("root.tests.import.pages.count", {
    count: selected.length,
    max: limits.maxSelectedPages,
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <label htmlFor={rangeFieldId} className="text-xs font-medium text-foreground">
            {t("root.tests.import.pages.label")}
          </label>

          <div className="-my-1 flex items-center gap-1">
            <Button type="button" variant="ghost" size="xs" onClick={selectAll}>
              {pageCount > limits.maxSelectedPages
                ? t("root.tests.import.pages.selectFirst", {
                    max: limits.maxSelectedPages,
                  })
                : t("root.tests.import.pages.selectAll")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => commit([])}
              disabled={selected.length === 0}
            >
              {t("root.tests.import.pages.clear")}
            </Button>
          </div>
        </div>

        <Input
          id={rangeFieldId}
          value={rangeText}
          inputMode="numeric"
          placeholder="1-4, 7, 11-13"
          aria-describedby={`${rangeFieldId}-hint`}
          onChange={(event) => {
            const next = event.target.value;
            setRangeDraft(next);
            onChange(parsePageRange(next, pageCount).slice(0, limits.maxSelectedPages));
          }}
          onBlur={() => setRangeDraft(null)}
        />

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p id={`${rangeFieldId}-hint`} className="text-2xs text-muted-foreground">
            {t("root.tests.import.pages.hint")}
          </p>
          <p
            className={cn(
              "text-2xs font-medium numeric",
              atCap ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {countLabel}
            {atCap
              ? ` · ${t("root.tests.import.pages.atCap", { max: limits.maxSelectedPages })}`
              : null}
          </p>
        </div>
      </div>

      {/*
        The answer rule, placed where it is actionable. A teacher who reads this
        before selecting will include the key page; one who reads it in a help
        article afterwards will not.
      */}
      <Surface variant="muted" padding="sm" elevation={0} className="flex gap-2.5">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("root.tests.import.answerRule")}
        </p>
      </Surface>

      <div
        className="grid max-h-[28rem] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
        role="group"
        aria-label={t("root.tests.import.pages.gridLabel")}
      >
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
          <PageThumbnail
            key={pageNumber}
            document={document}
            pageNumber={pageNumber}
            selected={selectedSet.has(pageNumber)}
            disabled={atCap && !selectedSet.has(pageNumber)}
            onToggle={togglePage}
          />
        ))}
      </div>
    </div>
  );
}
