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

type RemoveTeacherDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  teacherName: string;
};

/** Admin removal of a teacher, including their active class assignments. */
export default function RemoveTeacherDialog({
  open,
  onOpenChange,
  memberId,
  teacherName,
}: RemoveTeacherDialogProps) {
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
        toast.error(t("root.schoolPage.teachers.remove.error"));
        return;
      }
      toast.success(t("root.schoolPage.teachers.remove.success", { name: teacherName }));
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
            {t("root.schoolPage.teachers.remove.title", { name: teacherName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("root.schoolPage.teachers.remove.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("root.schoolPage.teachers.remove.cancel")}
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
            {t("root.schoolPage.teachers.remove.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
