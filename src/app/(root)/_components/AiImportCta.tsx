"use client";

import Link from "next/link";
import { ArrowRight, FileText, ListChecks, Sparkles, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { studioRoutes } from "@/app/(root)/_constants/tests";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function AiImportCta({
  classId,
  variant = "hero",
  className,
  secondaryAction,
}: {
  classId: string;
  variant?: "hero" | "strip";
  className?: string;
  secondaryAction?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const href = studioRoutes.importTest(classId);

  if (variant === "strip") {
    return (
      <Link
        href={href}
        className={cn(
          "group interactive-flat relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3",
          "border border-brand/30 bg-[linear-gradient(105deg,color-mix(in_srgb,var(--brand)_15%,var(--card)),color-mix(in_srgb,var(--brand)_5%,var(--card)))]",
          "before:pointer-events-none before:absolute before:-left-10 before:-top-12 before:size-32 before:rounded-full before:bg-brand/20 before:blur-3xl",
          "hover:border-brand/55 hover:bg-[linear-gradient(105deg,color-mix(in_srgb,var(--brand)_20%,var(--card)),color-mix(in_srgb,var(--brand)_7%,var(--card)))]",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}
      >
        <SparkTile size="sm" />

        <div className="min-w-0 flex-1">
          <p className="text-13 font-semibold text-foreground">
            {t("root.tests.import.cta.title")}
          </p>
          <p className="truncate text-2xs text-muted-foreground">
            {t("root.tests.import.cta.strip")}
          </p>
        </div>

        <ArrowRight className="relative size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  /*
    The hero, as a banner rather than a column.

    Every breakpoint here is a *container* query, not a viewport one, and that is
    the whole point. The panel fills whatever grid cell it lands in: the full
    twelve columns on a class page, four of twelve on the dashboard. Viewport
    breakpoints cannot tell those apart, so `md:flex-row` turned on for a 350px
    dashboard cell too — the `shrink-0` action column took its ~350px and left
    the text a sliver, which set Uzbek and Russian one word per line. Sizing off
    the panel's own width means the banner lays out from what it actually has.

    Text is capped at a readable measure and the actions sit beside it once the
    panel is wide enough to hold both. The short blurb carries the promise; the
    long version belongs on the importer screen, where the user has said yes.

    `@container` sits on a bare wrapper rather than on the panel itself, and it
    has to: a container cannot query *itself*, only its descendants can query
    it. With both on one element the panel's own `@md:p-5` resolved against an
    ancestor container that does not exist and silently never applied — the
    padding measured 16px at every width. Splitting them also makes every
    threshold below read the cell's full width instead of the width minus this
    panel's own padding, which is the number worth reasoning about.
  */
  return (
    <div className={cn("@container", className)}>
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-2xl border border-brand/35 p-4 shadow-elev-2 @md:p-5",
          "bg-[linear-gradient(115deg,color-mix(in_srgb,var(--brand)_17%,var(--card)),color-mix(in_srgb,var(--brand)_6%,var(--card))_52%,var(--card))]",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-20 size-48 rounded-full bg-brand/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 right-8 size-44 rounded-full bg-brand/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <SparkTile size="md" />

            <div className="min-w-0">
              <p className="type-micro text-primary">{t("root.tests.import.cta.eyebrow")}</p>
              <h3 className="type-heading mt-0.5 text-foreground">
                {t("root.tests.import.cta.title")}
              </h3>
              <p className="mt-1 max-w-[46ch] text-13 leading-relaxed text-muted-foreground">
                {t("root.tests.import.cta.short")}
              </p>
              <PdfToTestPreview />
            </div>
          </div>

          {/* Narrow panel: the actions stack and go full width, which is a better
              target than two half-width controls squeezed onto one line. Wide
              panel: `shrink-0` keeps them at their own width instead of stretching
              across the card the way a block-level select did. */}
          <div className="flex flex-col gap-2 @md:flex-row @md:flex-wrap @md:items-center @2xl:shrink-0">
            <Button
              asChild
              size="lg"
              className="w-full bg-[image:var(--brand-gradient)] shadow-elev-brand hover:brightness-105 @md:w-auto"
            >
              <Link href={href}>
                <Wand2 className="size-4" />
                {t("root.tests.import.cta.action")}
              </Link>
            </Button>
            {secondaryAction}
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkTile({ size }: { size: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center rounded-xl text-primary-foreground",
        "bg-[image:var(--brand-gradient)] shadow-elev-brand",
        size === "sm" ? "size-9 [&_svg]:size-4" : "size-12 [&_svg]:size-5",
      )}
    >
      <FileText className={cn(size === "sm" ? "size-4" : "size-5")} />
      <Sparkles
        className={cn(
          "absolute text-primary-foreground/90",
          size === "sm" ? "-top-0.5 -right-0.5 !size-2.5" : "-top-1 -right-1 !size-3",
        )}
      />
    </span>
  );
}

/** A compact, non-interactive trace of the result a teacher will get. */
function PdfToTestPreview() {
  const { t } = useTranslation();

  return (
    <div aria-hidden="true" className="mt-3 hidden items-center gap-2.5 text-2xs @xl:flex">
      <span className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-card/70 px-2 py-1 text-muted-foreground shadow-elev-1">
        <FileText className="size-3 text-brand" />
        PDF
      </span>
      <ArrowRight className="size-3 text-brand/70" />
      <span className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-card/70 px-2 py-1 font-medium text-foreground shadow-elev-1">
        <ListChecks className="size-3 text-brand" />
        12
      </span>
      <span className="text-muted-foreground">{t("root.tests.import.cta.draft")}</span>
    </div>
  );
}

export { AiImportCta };
