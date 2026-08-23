import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Trailing actions, right-aligned on wide screens. */
  actions?: ReactNode;
  className?: string;
};

/**
 * The page title block. One treatment, everywhere.
 *
 * The app previously had four: this component (used by two pages), a hand-rolled copy in the
 * dashboard, another in notifications, and a third size on the classes and school pages — all the
 * same structure at gratuitously different sizes and gaps. Everything now routes through here, and
 * the size comes from the `type-title` scale rather than an arbitrary pixel value.
 *
 * `truncate` is deliberately not applied to the title: Russian and Uzbek headings run longer than
 * English and clipping them loses meaning. The title wraps and balances instead.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        {/* No eyebrow slot on purpose: a label above the title is a banned
            pattern in this design system — the heading carries its own weight,
            and page context belongs in the subtitle line. */}
        <h1 className="type-title text-foreground">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-[68ch] text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export { PageHeader };
