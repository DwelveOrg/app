"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
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
          "border border-primary/25 bg-[color-mix(in_srgb,var(--primary)_7%,var(--card))]",
          "hover:border-primary/45 hover:bg-[color-mix(in_srgb,var(--primary)_11%,var(--card))]",
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

        <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  /*
    The hero, as a banner rather than a column.

    The panel fills whatever grid cell it lands in, and on a wide dashboard that
    is the full 12 columns — at which point a stacked layout gave a one-sentence
    pitch a 1200px measure and pushed the button and the class picker onto a line
    of their own underneath. Text is capped at a readable measure and the actions
    sit beside it from `md` up, so the card gets wider without getting emptier.
    The short blurb carries the promise; the long version of the explanation
    belongs on the importer screen, where the user has already said yes.
  */
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/25 p-4 sm:p-5",
        "bg-[color-mix(in_srgb,var(--primary)_8%,var(--card))]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_26%,transparent),transparent_70%)] blur-xl"
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
          </div>
        </div>

        {/* `shrink-0` keeps the picker at its own width instead of stretching
            across the card the way a block-level select did. */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild size="lg" className="shadow-elev-brand">
            <Link href={href}>
              <Wand2 className="size-4" />
              {t("root.tests.import.cta.action")}
            </Link>
          </Button>
          {secondaryAction}
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
      <Wand2 />
      <Sparkles
        className={cn(
          "absolute text-primary-foreground/90",
          size === "sm" ? "-top-0.5 -right-0.5 !size-2.5" : "-top-1 -right-1 !size-3",
        )}
      />
    </span>
  );
}

export { AiImportCta };
