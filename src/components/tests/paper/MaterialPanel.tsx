"use client";

import Image from "next/image";
import { Info } from "lucide-react";

import { paragraphLabels } from "@/app/(root)/_lib/test-form";
import type { PaperMaterial } from "@/lib/tests/paper.schemas";
import { cn } from "@/lib/utils";

/**
 * The shared passage, image and instructions a run of questions refers to.
 *
 * Rendered once, above the first question that depends on it, and — in the
 * scrolling layout — sticky, so it stays beside question 19 the way a printed
 * paper keeps the passage on the facing page. Reading a passage that scrolls
 * away while you answer the sixth question about it is the specific failure
 * this exists to avoid.
 *
 * Paragraph labels are derived here exactly as they are in the builder
 * (`paragraphLabels`), so the "Paragraph C" a matching-headings question refers
 * to is the paragraph the student can see marked C.
 */
export default function MaterialPanel({
  material,
  className,
  labelled,
}: {
  material: PaperMaterial;
  className?: string;
  /** Show A/B/C markers. Only worth it when a question actually references them. */
  labelled?: boolean;
}) {
  const passage = material.passage ?? "";
  const paragraphs = paragraphLabels(passage);

  return (
    <section
      aria-label={material.title || undefined}
      className={cn("space-y-3 rounded-xl border border-border bg-card p-4", className)}
    >
      {material.instructions ? (
        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-13 text-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          {material.instructions}
        </p>
      ) : null}

      {material.imageUrl ? (
        <Image
          src={material.imageUrl}
          alt={material.title || ""}
          width={1200}
          height={800}
          className="h-auto w-full rounded-lg border border-border"
          // Unoptimised: the URL comes from the school's own storage and is not
          // in the Next image allow-list. Adding a remote pattern per school is
          // configuration nobody can maintain.
          unoptimized
        />
      ) : null}

      {passage ? (
        <div className="exam-prose max-w-[68ch] space-y-3 text-15 leading-relaxed text-foreground">
          {paragraphs.map(({ label, text }) => (
            <p key={label} className="flex gap-3">
              {labelled && paragraphs.length > 1 ? (
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-muted text-2xs font-semibold text-muted-foreground"
                >
                  {label}
                </span>
              ) : null}
              <span className="min-w-0">{text}</span>
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
