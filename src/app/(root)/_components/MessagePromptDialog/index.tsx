"use client";

import { useId, useState } from "react";

import Dialog, { DialogFooterActions } from "@/app/(root)/_components/Dialog";
import Field from "@/components/ui/Field";
import Textarea from "@/components/ui/textarea";

/**
 * "Confirm this, and optionally say why."
 *
 * Four dialogs — reject a join request, reject a teacher request, request to join a class, request
 * to teach a class — were the same file four times. Line for line they differed only in which name
 * they interpolated, which textarea id they used, and which translation namespace they read.
 *
 * Takes rendered strings, never translation keys, so callers keep their own `t()` calls.
 */
export type MessagePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  cancelLabel: string;
  confirmLabel: string;
  tone?: "default" | "destructive";
  maxLength?: number;
  isSubmitting?: boolean;
  /** Receives the trimmed message; empty string when the user wrote nothing. */
  onConfirm: (message: string) => void;
};

export default function MessagePromptDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  cancelLabel,
  confirmLabel,
  tone = "default",
  maxLength = 500,
  isSubmitting = false,
  onConfirm,
}: MessagePromptDialogProps) {
  const fieldId = useId();
  const [message, setMessage] = useState("");

  // Reset on close so reopening never shows the previous attempt's text.
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setMessage("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      footer={
        <DialogFooterActions
          cancelLabel={cancelLabel}
          submitLabel={confirmLabel}
          tone={tone}
          isBusy={isSubmitting}
          onSubmit={() => onConfirm(message.trim())}
        />
      }
    >
      <Field label={label} htmlFor={fieldId} hint={`${message.length}/${maxLength}`}>
        <Textarea
          id={fieldId}
          rows={3}
          maxLength={maxLength}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={placeholder}
        />
      </Field>
    </Dialog>
  );
}

export { MessagePromptDialog };
