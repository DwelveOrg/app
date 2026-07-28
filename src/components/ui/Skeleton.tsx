import { cn } from "@/lib/utils";

/**
 * Neutral loading placeholder. One source of truth for the pulse treatment so
 * every skeleton across the app shares the same radius, tint, and motion.
 * Purely decorative — mark the surrounding region `aria-busy` instead of
 * announcing individual blocks.
 */
export default function Skeleton({
  className,
  ...props
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-[var(--muted)]", className)}
      {...props}
    />
  );
}
