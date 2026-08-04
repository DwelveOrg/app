"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * One confirmation dialog for every irreversible action.
 *
 * Nine dialogs — delete test, delete class, delete school, leave school, remove student, remove
 * teacher, remove class student, log out everywhere, delete account — had render bodies that were
 * identical apart from the icon and which translation keys they read. Two of them additionally
 * hand-rolled the destructive button instead of using the shared one, so the same action looked
 * different in two places.
 *
 * Takes rendered strings, never translation keys: each caller keeps its own `t()` calls, so no
 * message catalog has to change and no key namespace gets encoded into a shared component.
 */
export type ConfirmDialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Renders a trigger inside the dialog root, for callers without their own open state. */
  trigger?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel: ReactNode;
  /** `destructive` gives a solid red confirm; `default` a normal primary one. */
  tone?: "destructive" | "default";
  isPending?: boolean;
  onConfirm: () => void;
  /** Extra content between the description and the footer (a warning, a checkbox, a summary). */
  children?: ReactNode;
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "destructive",
  isPending = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const destructive = tone === "destructive";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn(
              destructive &&
                "bg-[color-mix(in_srgb,var(--destructive)_13%,transparent)] text-destructive",
            )}
          >
            {icon ?? <Trash2 />}
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive-solid" : "default"}
            // AlertDialogAction is a Radix Close, so it would dismiss the dialog the moment it is
            // clicked. Suppressing that keeps the pending state visible until the mutation settles
            // and the caller closes the dialog itself.
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            aria-busy={isPending || undefined}
          >
            {isPending ? (
              <span
                aria-hidden
                className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
              />
            ) : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ConfirmDialog };
