"use client";

import { useRouter } from "next/navigation";
import { Archive, LoaderCircle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

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
} from "@/components/ui/alert-dialog";
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>{isDraft ? <Trash2 /> : <Archive />}</AlertDialogMedia>
          <AlertDialogTitle>
            {t(`root.tests.${scope}.title`, { title })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(`root.tests.${scope}.description`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>
            {t("root.tests.actions.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
            disabled={isBusy}
          >
            {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t(`root.tests.${scope}.confirm`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
