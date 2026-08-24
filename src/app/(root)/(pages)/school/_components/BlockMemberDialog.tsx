"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import Field from "@/components/ui/Field";
import Textarea from "@/components/ui/textarea";
import { blockFromSchoolAction } from "@/app/(root)/_lib/school-actions";
import { useRefreshSchoolDirectory } from "../_hooks/useSchoolDirectory";

const REASON_MAX = 500;

/**
 * Bar a member from the school.
 *
 * Blocking removes the membership in the same action, so the copy says so
 * rather than leaving an admin to discover it. The reason is optional and is
 * for the school's own record — it is never shown to the person blocked, which
 * is why the field says nothing about them reading it.
 */
export default function BlockMemberDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
}) {
  const { t } = useTranslation();
  const refreshDirectory = useRefreshSchoolDirectory();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  const close = (next: boolean) => {
    if (!next) setReason("");
    onOpenChange(next);
  };

  const block = () => {
    startTransition(async () => {
      const result = await blockFromSchoolAction({
        memberId,
        reason: reason.trim() || undefined,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.schoolPage.access.block.error"));
        return;
      }
      toast.success(t("root.schoolPage.access.block.success", { name: memberName }));
      close(false);
      void refreshDirectory();
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={close}
      icon={<Ban />}
      title={t("root.schoolPage.access.block.title", { name: memberName })}
      description={t("root.schoolPage.access.block.description")}
      cancelLabel={t("root.schoolPage.access.cancel")}
      confirmLabel={t("root.schoolPage.access.block.confirm")}
      isPending={isPending}
      onConfirm={block}
    >
      <Field label={t("root.schoolPage.access.block.reasonLabel")}>
        {(field) => (
          <Textarea
            {...field}
            value={reason}
            maxLength={REASON_MAX}
            rows={3}
            placeholder={t("root.schoolPage.access.block.reasonPlaceholder")}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
      </Field>
    </ConfirmDialog>
  );
}
