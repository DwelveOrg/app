"use client";

import { useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";

import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * The dialog shell for the authenticated app.
 *
 * Built on Radix `Dialog`, not `AlertDialog`: `AlertDialog` deliberately ignores overlay clicks and
 * cannot be dismissed by outside interaction, which is right for a forced confirmation
 * (`ConfirmDialog`) and wrong for everything else.
 *
 * This absorbed the separate `Modal` component, which had one consumer and duplicated ~90% of the
 * overlay and content strings — its trigger, close button, and footer are the optional props below.
 * Two dialogs that also hand-rolled their own Radix overlay now use this too.
 */
export type DialogProps = {
  /** Controlled open state. Omit both to let the dialog manage its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Renders a trigger inside the root, for callers without their own open state. */
  trigger?: ReactNode;
  title: string;
  description?: string;
  /** Renders a close affordance in the top-right corner. */
  showClose?: boolean;
  closeLabel?: string;
  /** Footer node — usually `<DialogFooterActions />`. */
  footer?: ReactNode;
  /**
   * Overrides on the content panel — width for a picker that needs more room, or a max height for
   * long lists. Everything else stays shared.
   */
  contentClassName?: string;
  children: ReactNode;
};

export default function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  showClose = false,
  closeLabel = "Close",
  footer,
  contentClassName,
  children,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const handleOpenChange = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-elev-4",
            "duration-100 outline-none",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            contentClassName,
          )}
        >
          {showClose ? (
            <DialogPrimitive.Close
              aria-label={closeLabel}
              className="interactive-flat absolute right-4 top-4 grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          ) : null}

          <DialogPrimitive.Title className="type-heading text-foreground">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          ) : null}

          <div className="mt-4">{children}</div>

          {footer ? <div className="mt-5">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The Cancel / Submit row every form dialog ends with.
 *
 * Six form dialogs plus two hand-rolled ones repeated this markup verbatim, including the inline
 * spinner — which is now `Button`'s `loading` prop.
 *
 * Rendered as a Radix `Close` for cancel, so dismissing works without the caller wiring state.
 */
export function DialogFooterActions({
  cancelLabel,
  submitLabel,
  isBusy = false,
  submitDisabled = false,
  tone = "default",
  /** Omit inside a `<form>` — the submit button submits it. Provide for non-form dialogs. */
  onSubmit,
  className,
}: Readonly<{
  cancelLabel: ReactNode;
  submitLabel: ReactNode;
  isBusy?: boolean;
  submitDisabled?: boolean;
  tone?: "default" | "destructive";
  onSubmit?: () => void;
  className?: string;
}>) {
  return (
    <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>
      <DialogPrimitive.Close asChild>
        <Button type="button" variant="outline" disabled={isBusy}>
          {cancelLabel}
        </Button>
      </DialogPrimitive.Close>
      <Button
        type={onSubmit ? "button" : "submit"}
        variant={tone === "destructive" ? "destructive-solid" : "default"}
        onClick={onSubmit}
        loading={isBusy}
        disabled={submitDisabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}

/** Re-exported so callers can add extra `Close`-bound controls without importing radix directly. */
export const DialogClose = DialogPrimitive.Close;

export { Dialog };
