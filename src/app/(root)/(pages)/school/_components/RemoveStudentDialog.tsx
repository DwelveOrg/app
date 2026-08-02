"use client";

import { useTransition } from "react";
import { LoaderCircle, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { removeSchoolMemberAction } from "@/app/(root)/_lib/school-actions";

type RemoveStudentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  studentName: string;
};

/**
 * Admin-only removal of a student from the selected school. The roster is
 * server-rendered from `getStudents()`, so on success we `router.refresh()` to
 * re-fetch the roster and the overview counts.
 */
export default function RemoveStudentDialog({
  open,
  onOpenChange,
  memberId,
  studentName,
}: RemoveStudentDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeSchoolMemberAction({ memberId });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.schoolPage.students.remove.error"));
        return;
      }
      toast.success(t("root.schoolPage.students.remove.success", { name: studentName }));
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <UserMinus />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {t("root.schoolPage.students.remove.title", { name: studentName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("root.schoolPage.students.remove.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("root.schoolPage.students.remove.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              handleRemove();
            }}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.schoolPage.students.remove.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
