"use client";

import { useRouter } from "next/navigation";
import { DoorOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import { useLeaveClassMutation as useStudentLeaveClassMutation } from "@/app/(root)/_hooks/useEnrollment";
import { useLeaveClassMutation as useTeacherLeaveClassMutation } from "@/app/(root)/_hooks/useTeacherRequests";

type LeaveClassDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  schoolId: string | undefined;
  /** The viewer's real membership role. Admins never reach this dialog. */
  viewerRole: "STUDENT" | "TEACHER";
};

/**
 * Students and teachers revoking their own place in a class.
 *
 * One endpoint serves both — the backend resolves *who* is leaving from the
 * session — but the caches they invalidate differ, so the two role hooks are
 * both instantiated and the role picks which one runs. Hooks cannot be called
 * conditionally, and a `useMutation` that never fires costs nothing.
 *
 * Leaving revokes the viewer's own access, so the class detail becomes
 * unopenable the moment it succeeds: this always ends at `/groups`.
 */
export default function LeaveClassDialog({
  open,
  onOpenChange,
  classId,
  className,
  schoolId,
  viewerRole,
}: LeaveClassDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const studentLeave = useStudentLeaveClassMutation(schoolId);
  const teacherLeave = useTeacherLeaveClassMutation(schoolId);
  const leave = viewerRole === "TEACHER" ? teacherLeave : studentLeave;

  const isTeacher = viewerRole === "TEACHER";

  const handleLeave = () => {
    leave.mutate(
      { classId },
      {
        onSuccess: (result) => {
          // `alreadyLeft` is the backend's "no membership to remove" 404. The
          // user asked to be out and is out, so this lands on the same screen
          // as a fresh leave — only the wording changes.
          toast[result.alreadyLeft ? "info" : "success"](
            result.alreadyLeft
              ? t("root.classDetail.leave.alreadyLeft", { name: className })
              : t("root.classDetail.leave.success", { name: className }),
          );
          onOpenChange(false);
          router.push("/groups");
          router.refresh();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("root.classDetail.leave.error"),
          );
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={<DoorOpen />}
      title={t("root.classDetail.leave.title", { name: className })}
      description={
        isTeacher
          ? t("root.classDetail.leave.descriptionTeacher")
          : t("root.classDetail.leave.descriptionStudent")
      }
      cancelLabel={t("root.classDetail.leave.cancel")}
      confirmLabel={t("root.classDetail.leave.confirm")}
      isPending={leave.isPending}
      onConfirm={handleLeave}
    />
  );
}
