"use client";

import { useTransition } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
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
import { leaveSchoolAction } from "@/app/(root)/_lib/school-actions";

type LeaveSchoolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName: string;
};

/** Teachers and students can safely revoke their own school membership. */
export default function LeaveSchoolDialog({
  open,
  onOpenChange,
  schoolName,
}: LeaveSchoolDialogProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveSchoolAction({});
      // Successful actions redirect to the dashboard; reaching this branch
      // means the backend rejected the request or a network call failed.
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.error(t("root.schoolPage.leave.error"));
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <LogOut />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {t("root.schoolPage.leave.title", { name: schoolName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("root.schoolPage.leave.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("root.schoolPage.leave.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              handleLeave();
            }}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.schoolPage.leave.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
