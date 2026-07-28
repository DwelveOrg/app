"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface ModalProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    description?: string;
    trigger: React.ReactNode;
    isSubmit?: boolean;
    closeLabel?: string;
    submitLabel?: string;
    /** Controlled open state. Omit both to let the modal manage its own state. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /**
     * Runs when the footer button is pressed. With a handler the button performs
     * the action and leaves closing to the caller; without one it only closes.
     */
    onSubmit?: () => void;
    submitDisabled?: boolean;
}

/**
 * Generic modal built on Radix `Dialog` (not `AlertDialog`).
 *
 * `AlertDialog` intentionally ignores background/overlay clicks and cannot be
 * made to dismiss on outside interaction — it is meant for forced confirmations.
 * `Dialog` closes on overlay click and Escape by default, which is what a
 * general-purpose modal needs.
 */
export function Modal({
    children,
    className,
    title,
    description,
    trigger,
    isSubmit = false,
    closeLabel = "Close modal",
    submitLabel = "Submit",
    open,
    onOpenChange,
    onSubmit,
    submitDisabled = false,
}: Readonly<ModalProps>) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : uncontrolledOpen;

    const handleOpenChange = (next: boolean) => {
        if (!isControlled) setUncontrolledOpen(next);
        onOpenChange?.(next);
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
            <DialogPrimitive.Trigger asChild>
                <button type="button" className={className}>
                    {trigger}
                </button>
            </DialogPrimitive.Trigger>

            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 dark:bg-black/50" />
                <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-[var(--border)] bg-[var(--popover)] p-4 text-[var(--popover-foreground)] shadow-[0_20px_60px_rgba(15,23,42,0.18)] duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    <DialogPrimitive.Close
                        aria-label={closeLabel}
                        className="absolute right-4 top-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-transparent text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                        <X className="h-4 w-4" />
                    </DialogPrimitive.Close>

                    <div className="grid gap-1.5">
                        <DialogPrimitive.Title className="text-lg font-semibold text-[var(--foreground)]">
                            {title}
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description className="text-sm text-[var(--muted-foreground)]">
                            {description}
                        </DialogPrimitive.Description>
                    </div>

                    {children}

                    {isSubmit && (
                        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            {onSubmit ? (
                                <Button
                                    onClick={onSubmit}
                                    disabled={submitDisabled}
                                    className="h-12 w-full cursor-pointer text-base font-semibold transition active:scale-[0.99] active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitLabel}
                                </Button>
                            ) : (
                                <DialogPrimitive.Close asChild>
                                    <Button className="h-12 w-full cursor-pointer text-base font-semibold transition active:scale-[0.99] active:opacity-90">
                                        {submitLabel}
                                    </Button>
                                </DialogPrimitive.Close>
                            )}
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
