import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Neutral loading placeholder. One source of truth for the pulse treatment so every skeleton shares
 * the same radius, tint, and motion. Purely decorative — mark the surrounding region `aria-busy`
 * instead of announcing individual blocks.
 */
export default function Skeleton({
  className,
  ...props
}: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

/**
 * A stack of identical placeholder rows.
 *
 * Four route `loading.tsx` files plus four inline `animate-pulse` blocks were each building this by
 * hand, which is how sibling files ended up rendering the same skeleton two different ways.
 */
export function SkeletonList({
  count = 3,
  className,
  itemClassName,
}: Readonly<{ count?: number; className?: string; itemClassName?: string }>) {
  return (
    // The list is the busy region — the individual blocks are `aria-hidden`, so without this a
    // screen reader is told nothing at all while the data loads.
    <div aria-busy="true" className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={cn("h-24 rounded-2xl", itemClassName)} />
      ))}
    </div>
  );
}

/**
 * The standard route-loading envelope: optional back link, optional header block, then content.
 * Matches the real page's rhythm so the swap from skeleton to content doesn't jump.
 */
export function SkeletonPage({
  backLink = false,
  header = "simple",
  actions = 2,
  children,
}: Readonly<{
  backLink?: boolean;
  header?: "none" | "simple" | "withActions";
  /** How many trailing buttons the real header has, so the swap doesn't drop a phantom one. */
  actions?: number;
  children?: React.ReactNode;
}>) {
  return (
    <section aria-busy="true" className="flex flex-col gap-6 py-6">
      {backLink ? <Skeleton className="h-5 w-32 rounded-md" /> : null}

      {header !== "none" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          {header === "withActions" ? (
            <div className="flex gap-2">
              {Array.from({ length: actions }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-28 rounded-lg" />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {children ?? <SkeletonList />}
    </section>
  );
}

export { Skeleton };
