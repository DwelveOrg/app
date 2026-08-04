"use client";

import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
import CopyButton from "@/components/ui/CopyButton";
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

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("root.schoolPage.addStudents.title")}
      description={t("root.schoolPage.addStudents.description")}
    >
      <div className="space-y-4">
        {studentJoinCode ? (
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t("root.dashboard.school.joinCodeLabel")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 font-mono text-base font-semibold tracking-wide text-foreground">
                {studentJoinCode}
              </code>
              <CopyButton
                value={studentJoinCode}
                label={t("root.dashboard.school.copyJoinCode")}
                copiedLabel={t("root.dashboard.school.joinCodeCopied")}
                onCopied={() => toast.success(t("root.dashboard.school.joinCodeCopied"))}
                onError={() => toast.error(t("root.dashboard.school.joinCodeCopyError"))}
                className="shrink-0"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("root.schoolPage.addStudents.noCode")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t("root.schoolPage.addStudents.hint")}</p>
        <div className="flex justify-end pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button">{t("root.schoolPage.addStudents.done")}</Button>
          </DialogPrimitive.Close>
        </div>
      </div>
    </Dialog>
  );
}
