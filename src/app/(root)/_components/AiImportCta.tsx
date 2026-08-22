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
          "relative h-full overflow-hidden rounded-2xl border border-primary/25 p-4 @md:p-5",
          "bg-[color-mix(in_srgb,var(--primary)_8%,var(--card))]",
        )}
      >

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
            </div>
          </div>

          {/* Narrow panel: the actions stack and go full width, which is a better
              target than two half-width controls squeezed onto one line. Wide
              panel: `shrink-0` keeps them at their own width instead of stretching
              across the card the way a block-level select did. */}
          <div className="flex flex-col gap-2 @md:flex-row @md:flex-wrap @md:items-center @2xl:shrink-0">
            <Button asChild size="lg" className="w-full shadow-elev-brand @md:w-auto">
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
