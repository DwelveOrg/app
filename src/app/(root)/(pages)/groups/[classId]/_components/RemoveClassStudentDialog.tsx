"use client";

import { LoaderCircle, UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";

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

type RemoveClassStudentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  isSubmitting: boolean;
  onConfirm: () => void;
};

/**
 * Confirms unenrolling a student from a class. Removal drops their roster
 * entry, so it is destructive enough to confirm — the caller runs the mutation
 * and refreshes the class data afterwards.
 */
export default function RemoveClassStudentDialog({
  open,
  onOpenChange,
  studentName,
  isSubmitting,
  onConfirm,
}: RemoveClassStudentDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <UserMinus />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {t("root.classDetail.removeStudent.title", { name: studentName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("root.classDetail.removeStudent.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            {t("root.classDetail.removeStudent.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.classDetail.removeStudent.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
