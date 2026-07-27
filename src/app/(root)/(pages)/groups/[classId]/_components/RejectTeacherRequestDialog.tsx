"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
import Textarea from "@/components/ui/textarea";
import Dialog from "@/app/(root)/_components/Dialog";

type RejectTeacherRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherName: string;
  isSubmitting: boolean;
  onConfirm: (reason: string) => void;
};

const REASON_MAX = 500;

/** Confirms rejecting a teacher's request, with an optional reason for them. */
export default function RejectTeacherRequestDialog({
  open,
  onOpenChange,
  teacherName,
  isSubmitting,
  onConfirm,
}: RejectTeacherRequestDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) setReason("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.enrollment.teacherRequests.rejectTitle", { name: teacherName })}
      description={t("root.enrollment.teacherRequests.rejectDescription")}
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="reject-teacher-reason"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            {t("root.enrollment.teacherRequests.reasonLabel")}
          </label>
          <Textarea
            id="reject-teacher-reason"
            rows={3}
            maxLength={REASON_MAX}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("root.enrollment.teacherRequests.reasonPlaceholder")}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              {t("root.enrollment.teacherRequests.cancel")}
            </Button>
          </DialogPrimitive.Close>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            onClick={() => onConfirm(reason.trim())}
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.enrollment.teacherRequests.confirmReject")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
