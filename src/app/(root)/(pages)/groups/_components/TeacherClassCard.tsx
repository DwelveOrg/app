"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import type { TeacherClass } from "@/app/(root)/_lib/teacher-requests.schemas";
import {
  useCancelTeacherRequestMutation,
  useRequestToTeachMutation,
} from "@/app/(root)/_hooks/useTeacherRequests";
import { classAccent } from "../_constants";
import ClassEntityCard, {
  ClassCardChip,
  ClassCardLockedAction,
  ClassCardPendingAction,
  ClassCardRejectedNotice,
} from "./ClassEntityCard";
import RequestToTeachDialog from "./RequestToTeachDialog";

type TeacherClassCardProps = {
  item: TeacherClass;
  schoolId: string | undefined;
};

/**
 * A single class in the teacher browse list. The call to action is driven
 * entirely by the backend flags (`canEnter`, `canRequest`, `teacherRequestStatus`)
 * — the UI never reconstructs authorization rules.
 */
export default function TeacherClassCard({ item, schoolId }: TeacherClassCardProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const requestToTeach = useRequestToTeachMutation(schoolId);
  const cancelRequest = useCancelTeacherRequestMutation(schoolId);

  const leadTeacher = item.teachers[0]?.fullName ?? "";
  const studentCount = item.counts?.students ?? item.students.length;
  const isRejected = item.teacherRequestStatus === "REJECTED";

  const handleRequest = (message: string) => {
    requestToTeach.mutate(
      { classId: item.id, message: message || undefined },
      {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success(t("root.enrollment.teacher.requestedToast", { name: item.name }));
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          );
        },
      },
    );
  };

  const handleCancel = () => {
    cancelRequest.mutate(
      { classId: item.id },
      {
        onSuccess: () => toast.success(t("root.enrollment.teacher.cancelledToast")),
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  return (
    <ClassEntityCard
      name={item.name}
      pictureUrl={item.pictureUrl}
      accentClassName={classAccent(item.id)}
      subtitle={leadTeacher || t("root.enrollment.teacher.noTeacher")}
      description={item.description}
      badge={item.canEnter ? t("root.classes.card.teaching") : undefined}
      chips={
        <ClassCardChip>
          {t("root.enrollment.teacher.studentCount", { count: studentCount })}
        </ClassCardChip>
      }
      action={renderAction()}
    >
      <RequestToTeachDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        className={item.name}
        isSubmitting={requestToTeach.isPending}
        onConfirm={handleRequest}
      />
    </ClassEntityCard>
  );

  function renderAction() {
    // Assigned: let the teacher open and manage the class.
    if (item.canEnter) {
      return (
        <Button asChild variant="outline" className="w-full">
          <Link href={`/groups/${item.id}`}>
            {t("root.enrollment.teacher.open")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      );
    }

    // Awaiting an admin decision: show the pending state and allow cancellation.
    if (item.teacherRequestStatus === "PENDING") {
      return (
        <ClassCardPendingAction
          label={t("root.enrollment.teacher.requestPending")}
          cancelLabel={t("root.enrollment.teacher.cancelRequest")}
          isCancelling={cancelRequest.isPending}
          onCancel={handleCancel}
        />
      );
    }

    // Requestable — including after a rejection, where a fresh request is allowed.
    if (item.canRequest) {
      return (
        <div className="flex flex-col gap-2">
          {isRejected ? (
            <ClassCardRejectedNotice label={t("root.enrollment.teacher.rejected")} />
          ) : null}
          <Button className="w-full" onClick={() => setDialogOpen(true)}>
            {isRejected
              ? t("root.enrollment.teacher.requestAgain")
              : t("root.enrollment.teacher.requestToTeach")}
          </Button>
        </div>
      );
    }

    // Not requestable and not assigned: explain, so it's never a dead end.
    return <ClassCardLockedAction label={t("root.enrollment.teacher.unavailable")} />;
  }
}
