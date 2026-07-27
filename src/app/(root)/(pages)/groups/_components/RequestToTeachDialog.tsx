"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
import Textarea from "@/components/ui/textarea";
import Dialog from "@/app/(root)/_components/Dialog";

type RequestToTeachDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  isSubmitting: boolean;
  onConfirm: (message: string) => void;
};

const MESSAGE_MAX = 500;

/**
 * Optional-message dialog shown before a teacher requests to teach a class. The
 * message is optional per the backend contract, so submitting with an empty
 * field is allowed.
 */
export default function RequestToTeachDialog({
  open,
  onOpenChange,
  className,
  isSubmitting,
  onConfirm,
}: RequestToTeachDialogProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) setMessage("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.enrollment.requestToTeachDialog.title", { name: className })}
      description={t("root.enrollment.requestToTeachDialog.description")}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="teach-request-message"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {t("root.enrollment.requestToTeachDialog.messageLabel")}
          </label>
          <Textarea
            id="teach-request-message"
            rows={3}
            maxLength={MESSAGE_MAX}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("root.enrollment.requestToTeachDialog.messagePlaceholder")}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              {t("root.enrollment.requestToTeachDialog.cancel")}
            </Button>
          </DialogPrimitive.Close>
          <Button
            type="button"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            onClick={() => onConfirm(message.trim())}
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.enrollment.requestToTeachDialog.submit")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
