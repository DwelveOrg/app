"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import type { DiscoverableClass } from "@/app/(root)/_lib/enrollment.schemas";
import {
  useCancelJoinRequestMutation,
  useRequestJoinClassMutation,
} from "@/app/(root)/_hooks/useEnrollment";
import { classAccent } from "../_constants";
import { enrollmentModeLabelKeys } from "../_lib/enrollmentLabels";
import ClassEntityCard, {
  ClassCardChip,
  ClassCardLockedAction,
  ClassCardPendingAction,
} from "./ClassEntityCard";
import RequestJoinDialog from "./RequestJoinDialog";

type StudentClassCardProps = {
  item: DiscoverableClass;
  schoolId: string | undefined;
};

/**
 * One class in the student directory. Every call to action is driven by the
 * backend-provided `canEnter`, `canRequest`, `studentEnrollmentStatus`,
 * `enrollmentMode`, `capacity`, and `activeStudentCount` fields — the UI never
 * reconstructs authorization rules.
 */
export default function StudentClassCard({ item, schoolId }: StudentClassCardProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const requestJoin = useRequestJoinClassMutation(schoolId);
  const cancelRequest = useCancelJoinRequestMutation(schoolId);

  const isPending = item.studentEnrollmentStatus === "PENDING";
  const isEnrolled = item.studentEnrollmentStatus === "ACTIVE";
  const isFull = item.capacity != null && item.activeStudentCount >= item.capacity;

  const handleRequest = (message: string) => {
    requestJoin.mutate(
      { classId: item.id, message: message || undefined },
      {
        onSuccess: (result) => {
          setDialogOpen(false);
          toast.success(
            result.status === "ACTIVE"
              ? t("root.enrollment.directory.joinedToast", { name: item.name })
              : t("root.enrollment.directory.requestedToast", { name: item.name }),
          );
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("root.enrollment.errorGeneric"));
        },
      },
    );
  };

  const handleCancel = () => {
    cancelRequest.mutate(
      { classId: item.id },
      {
        onSuccess: () => toast.success(t("root.enrollment.directory.cancelledToast")),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t("root.enrollment.errorGeneric")),
      },
    );
  };

  return (
    <ClassEntityCard
      name={item.name}
      pictureUrl={item.pictureUrl}
      accentClassName={classAccent(item.id)}
      subtitle={item.teacher?.name ?? t("root.enrollment.directory.noTeacher")}
      description={item.description}
      badge={isEnrolled ? t("root.classes.card.enrolled") : undefined}
      chips={
        <>
          <ClassCardChip>
            {item.capacity != null
              ? t("root.enrollment.directory.seats", {
                  count: item.activeStudentCount,
                  capacity: item.capacity,
                })
              : t("root.enrollment.directory.enrolledCount", {
                  count: item.activeStudentCount,
                })}
          </ClassCardChip>
          <ClassCardChip variant="outline" showIcon={false}>
            {t(enrollmentModeLabelKeys[item.enrollmentMode])}
          </ClassCardChip>
        </>
      }
      action={renderAction()}
    >
      <RequestJoinDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        className={item.name}
        isSubmitting={requestJoin.isPending}
        onConfirm={handleRequest}
      />
    </ClassEntityCard>
  );

  // The four states a class can be in for this student, in the order they are
  // decided: enter it, wait on it, ask for it, or be told why not.
  function renderAction() {
    // `canEnter` is the backend's authority for entry, so enrolled classes lead
    // straight into the class instead of offering a request.
    if (item.canEnter) {
      return (
        <Button asChild variant={isEnrolled ? "default" : "outline"} className="w-full">
          <Link href={`/groups/${item.id}`}>
            {t("root.enrollment.directory.open")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      );
    }

    if (isPending) {
      return (
        <ClassCardPendingAction
          label={t("root.enrollment.directory.requestPending")}
          cancelLabel={t("root.enrollment.directory.cancelRequest")}
          isCancelling={cancelRequest.isPending}
          onCancel={handleCancel}
        />
      );
    }

    if (item.canRequest) {
      return (
        <Button className="w-full" onClick={() => setDialogOpen(true)}>
          {t("root.enrollment.directory.requestToJoin")}
        </Button>
      );
    }

    // Not requestable: explain why, so a disabled state is never a dead end.
    const reasonKey = isFull
      ? "root.enrollment.directory.classFull"
      : item.enrollmentMode === "DIRECT_ASSIGNMENT"
        ? "root.enrollment.directory.assignmentRequired"
        : "root.enrollment.directory.unavailable";

    return <ClassCardLockedAction label={t(reasonKey)} />;
  }
}
