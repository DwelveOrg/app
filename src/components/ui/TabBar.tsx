"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import Badge from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Every tab row in the product.
 *
 * There were four independent implementations of this control — two underline variants that were
 * near-identical apart from `<button>` vs `<Link>`, a third in the school tabs, and a pill variant
 * in notifications. They disagreed on height, weight, badge treatment, and how the active indicator
 * was drawn. This is one control that covers all four.
 *
 * The active indicator is a shared `layoutId`, so switching tabs slides rather than cuts.
 */
export type TabItem = {
  /** Stable key, and the value reported by `onSelect` for controlled tab bars. */
  value: string;
  label: ReactNode;
  /** Present for navigation tabs; omit for local state tabs. */
  href?: string;
  count?: number;
  /**
   * Renders `count` even when it is zero. A roster of zero is a fact about the
   * thing ("Students 0" — the class is empty); a pending count of zero is noise,
   * which is why hiding it stays the default.
   */
  showZeroCount?: boolean;
  disabled?: boolean;
  /** Trailing pill for locked features ("Soon"). */
  note?: string;
};

export type TabBarProps = {
  items: TabItem[];
  value: string;
  onSelect?: (value: string) => void;
  ariaLabel: string;
  variant?: "underline" | "pill";
  /** Unique per mounted TabBar so two on one page don't share a sliding indicator. */
  layoutId: string;
  className?: string;
};

export default function TabBar({
  items,
  value,
  onSelect,
  ariaLabel,
  variant = "underline",
  layoutId,
  className,
}: TabBarProps) {
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "no-scrollbar flex items-center overflow-x-auto",
        variant === "underline"
          ? "gap-1 border-b border-border"
          : "gap-1 rounded-xl border border-border bg-muted p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;

        const content = (
          <>
            <span className="truncate">{item.label}</span>
            {typeof item.count === "number" && (item.count > 0 || item.showZeroCount) ? (
              <Badge
                variant={active ? "primary" : "neutral"}
                size="xs"
                shape="count"
                aria-hidden
              >
                {item.count}
              </Badge>
            ) : null}
            {item.note ? (
              <Badge variant="neutral" size="xs" uppercase aria-hidden>
                {item.note}
              </Badge>
            ) : null}
            {variant === "underline" && active ? (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            {variant === "pill" && active ? (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 -z-10 rounded-lg bg-card shadow-elev-1"
                transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
          </>
        );

        const classes = cn(
          "interactive-flat relative inline-flex h-9 shrink-0 items-center gap-1.5 px-3 text-sm font-medium",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          variant === "underline" ? "rounded-t-lg" : "rounded-lg",
          item.disabled
            ? "cursor-not-allowed text-muted-foreground opacity-55"
            : active
              ? "cursor-pointer font-semibold text-primary"
              : "cursor-pointer text-muted-foreground hover:text-foreground",
        );

        if (item.disabled) {
          return (
            <span key={item.value} aria-disabled className={classes}>
              {content}
            </span>
          );
        }

        if (item.href) {
          return (
            <Link
              key={item.value}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={classes}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect?.(item.value)}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}

export { TabBar };
