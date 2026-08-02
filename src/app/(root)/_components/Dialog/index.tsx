"use client";

import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /**
   * Overrides on the content panel — width for a picker that needs more room,
   * or a max height for long lists. Everything else stays shared.
   */
  contentClassName?: string;
  children: ReactNode;
};

/**
 * Controlled, themed dialog shell for the dashboard. Wraps the Radix Dialog
 * primitive with design-system tokens so every dashboard modal (create class,
 * invite, ...) shares one look instead of repeating overlay/content markup.
 */
export default function Dialog({
  open,
  onOpenChange,
  title,
  description,
  contentClassName,
  children,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 dark:bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]",
            contentClassName,
          )}
        >
          <DialogPrimitive.Title className="text-base font-semibold text-[var(--foreground)]">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-sm text-[var(--muted-foreground)]">
              {description}
            </DialogPrimitive.Description>
          ) : null}
          <div className="mt-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
