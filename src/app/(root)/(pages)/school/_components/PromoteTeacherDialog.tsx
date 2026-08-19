"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { updateMemberRoleAction } from "@/app/(root)/_lib/school-actions";

/**
 * Promote a teacher to admin.
 *
 * The one decision on this screen is whether the new admin may promote anyone
 * themselves, and it is offered **only to the owner**. An admin who was given
 * that permission can create more admins but cannot pass the permission on, so
 * the checkbox is absent for them rather than present-and-disabled: a control
 * that can never be pressed is worse than no control, because it implies the
 * ability exists somewhere behind a setting.
 */
export default function PromoteTeacherDialog({
  open,
  onOpenChange,
  memberId,
  teacherName,
  /** Only the school's owner may hand out the promote-admins permission. */
  canDelegate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  teacherName: string;
  canDelegate: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [delegate, setDelegate] = useState(false);

  const promote = () => {
    startTransition(async () => {
      const result = await updateMemberRoleAction({
        memberId,
        role: "ADMIN",
        canManageAdmins: canDelegate ? delegate : false,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.schoolPage.access.promote.error"));
        return;
      }
      toast.success(t("root.schoolPage.access.promote.success", { name: teacherName }));
      setDelegate(false);
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setDelegate(false);
        onOpenChange(next);
      }}
      tone="default"
      icon={<ShieldCheck />}
      title={t("root.schoolPage.access.promote.title", { name: teacherName })}
      description={t("root.schoolPage.access.promote.description")}
      cancelLabel={t("root.schoolPage.access.cancel")}
      confirmLabel={t("root.schoolPage.access.promote.confirm")}
      isPending={isPending}
      onConfirm={promote}
    >
      {canDelegate ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 text-left">
          <Checkbox
            checked={delegate}
            onCheckedChange={(value) => setDelegate(value === true)}
            className="mt-0.5"
          />
          <span className="min-w-0">
            <span className="block text-13 font-medium text-foreground">
              {t("root.schoolPage.access.promote.delegateLabel")}
            </span>
            <span className="mt-0.5 block text-2xs text-muted-foreground">
              {t("root.schoolPage.access.promote.delegateHint")}
            </span>
          </span>
        </label>
      ) : (
        <p className="rounded-xl border border-border bg-muted/40 p-3 text-2xs text-muted-foreground">
          {t("root.schoolPage.access.promote.ownerOnlyNote")}
        </p>
      )}
    </ConfirmDialog>
  );
}
