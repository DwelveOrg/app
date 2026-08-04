"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

import Badge from "@/components/ui/badge";
import { surfaceVariants } from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

/**
 * Icon + title + description + trailing control. The workhorse row of the product.
 *
 * This merges two components that were the same concept at two nesting levels: a `Row` that drew
 * its own border and sat loose on the page, and a `SettingsRow` that sat flush inside a divided
 * surface. They disagreed on icon size, chip radius, and description size while rendering the same
 * information, so a settings row and a profile row looked like different products.
 *
 * - `variant="flush"` — inside a `<Surface divided>`; the surface draws the edges.
 * - `variant="boxed"` — standalone; the row draws its own.
 */
export type ListRowProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Navigational row: the whole row links here and shows a chevron. */
  href?: string;
  /** Trailing control for rows that perform an action. */
  action?: ReactNode;
  /** Full-width control below the label (a segmented switch, a slider). */
  control?: ReactNode;
  /** Not-yet-available: dimmed, non-interactive, with a note pill. */
  soon?: boolean;
  soonLabel?: string;
  danger?: boolean;
  variant?: "flush" | "boxed";
  className?: string;
};

export default function ListRow({
  icon: Icon,
  title,
  description,
  href,
  action,
  control,
  soon = false,
  soonLabel,
  danger = false,
  variant = "flush",
  className,
}: Readonly<ListRowProps>) {
  const head = (
    <div className="flex items-start gap-3.5">
      {Icon ? (
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg transition-colors duration-[var(--dur-1)]",
            danger
              ? "bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] text-destructive"
              : "bg-muted text-muted-foreground group-hover:text-primary",
          )}
        >
          <Icon className="size-[18px]" />
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "type-label font-semibold",
            danger ? "text-destructive" : "text-foreground",
          )}
        >
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {href ? (
        <ChevronRight
          aria-hidden
          className="mt-1.5 size-[18px] shrink-0 text-muted-foreground transition-transform duration-[var(--dur-2)] group-hover:translate-x-0.5"
        />
      ) : soon && soonLabel ? (
        <Badge variant="neutral" size="md" className="mt-0.5 shrink-0">
          {soonLabel}
        </Badge>
      ) : action ? (
        <div className="mt-0.5 shrink-0">{action}</div>
      ) : null}
    </div>
  );

  const padding = variant === "boxed" ? "p-4 sm:p-5" : "px-4 py-4 sm:px-5";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "interactive-flat group block outline-none",
          variant === "boxed"
            ? surfaceVariants({ radius: "md", padding: "none", interactive: true })
            : "hover:bg-muted",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
          padding,
          className,
        )}
      >
        {head}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "group",
        variant === "boxed" &&
          (danger
            ? surfaceVariants({ variant: "danger", radius: "md", padding: "none", elevation: 0 })
            : surfaceVariants({ radius: "md", padding: "none" })),
        soon && "opacity-70",
        padding,
        className,
      )}
    >
      {head}
      {control ? <div className="mt-3.5 sm:pl-[3.125rem]">{control}</div> : null}
    </div>
  );
}

export { ListRow };
