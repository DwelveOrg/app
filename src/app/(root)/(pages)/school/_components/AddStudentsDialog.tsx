"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
import Dialog from "@/app/(root)/_components/Dialog";

type AddStudentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentJoinCode?: string | null;
};

export default function AddStudentsDialog({
  open,
  onOpenChange,
  studentJoinCode,
}: AddStudentsDialogProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) setCopied(false);
  };

  const handleCopy = async () => {
    if (!studentJoinCode) return;
    try {
      await navigator.clipboard.writeText(studentJoinCode);
      setCopied(true);
      toast.success(t("root.dashboard.school.joinCodeCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("root.dashboard.school.joinCodeCopyError"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.schoolPage.addStudents.title")}
      description={t("root.schoolPage.addStudents.description")}
    >
      <div className="space-y-4">
        {studentJoinCode ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("root.dashboard.school.joinCodeLabel")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 font-mono text-base font-semibold tracking-wide text-[var(--foreground)]">
                {studentJoinCode}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label={t("root.dashboard.school.copyJoinCode")}
              >
                {copied ? <Check className="h-4 w-4 text-success-text" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("root.schoolPage.addStudents.noCode")}
          </p>
        )}
        <p className="text-xs text-[var(--muted-foreground)]">{t("root.schoolPage.addStudents.hint")}</p>
        <div className="flex justify-end pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button">{t("root.schoolPage.addStudents.done")}</Button>
          </DialogPrimitive.Close>
        </div>
      </div>
    </Dialog>
  );
}
