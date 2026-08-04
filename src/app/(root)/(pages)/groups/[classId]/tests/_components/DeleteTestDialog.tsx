"use client";

import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import type { TestStatus } from "@/app/(root)/_lib/tests.schemas";
import { useDeleteTestMutation } from "../_hooks/useDeleteTestMutation";

type DeleteTestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  title: string;
  /** Drafts are deleted; anything else is archived. Say which. */
  status: TestStatus;
  /** Set when deleting from the builder, which cannot stay on a dead test. */
  redirectOnSuccess?: string;
};

/**
 * Confirms removal of a test. `DELETE /tests/:testId` deletes a draft outright
 * but archives a published one, so the copy changes with the status rather than
 * promising something the backend will not do.
 */
export default function DeleteTestDialog({
  open,
  onOpenChange,
  testId,
  title,
  status,
  redirectOnSuccess,
}: DeleteTestDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const deleteTest = useDeleteTestMutation();

  const isDraft = status === "DRAFT";
  const isBusy = deleteTest.isPending;
  const scope = isDraft ? "delete" : "archive";

  const handleDelete = () => {
    deleteTest.mutate(
      { testId },
      {
        onSuccess: () => {
          toast.success(t(`root.tests.${scope}.success`, { title }));
          onOpenChange(false);
          if (redirectOnSuccess) router.push(redirectOnSuccess);
          router.refresh();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.tests.errorGeneric"),
          ),
      },
    );
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={isDraft ? <Trash2 /> : <Archive />}
      title={t(`root.tests.${scope}.title`, { title })}
      description={t(`root.tests.${scope}.description`)}
      cancelLabel={t("root.tests.actions.cancel")}
      confirmLabel={t(`root.tests.${scope}.confirm`)}
      isPending={isBusy}
      onConfirm={handleDelete}
    />
  );
}
