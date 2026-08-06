"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { ClassEnrollmentItem } from "@/app/(root)/_lib/enrollment.schemas";
import {
  useApproveEnrollmentMutation,
  useClassJoinRequests,
  useRejectEnrollmentMutation,
} from "@/app/(root)/_hooks/useEnrollment";
import Empty from "../../../_components/ui/Empty";
import ClassJoinRequestRow from "./ClassJoinRequestRow";
import RejectRequestDialog from "./RejectRequestDialog";

type ClassStudentRequestsListProps = {
  classId: string;
  /**
   * Called after an approve or reject lands. Approving enrols the student, so
   * the server-rendered class page uses this to re-read its roster.
   */
  onReviewed?: () => void;
};

/**
 * Pending student join requests for one class (`GET /classes/:id/join-requests`),
 * with approve and reject. Open to admins and to teachers assigned to the class;
 * the backend re-checks that on every action.
 */
export default function ClassStudentRequestsList({
  classId,
  onReviewed,
}: ClassStudentRequestsListProps) {
  const { t } = useTranslation();
  const [rejecting, setRejecting] = useState<ClassEnrollmentItem | null>(null);

  const query = useClassJoinRequests({ classId, search: "" });
  const approve = useApproveEnrollmentMutation(classId);
  const reject = useRejectEnrollmentMutation(classId);

  const requests = useMemo(
    () => query.data?.pages.flatMap((page) => page.enrollments) ?? [],
    [query.data?.pages],
  );

  const handleApprove = (enrollmentId: string) => {
    approve.mutate(
      { enrollmentId },
      {
        onSuccess: () => {
          toast.success(t("root.enrollment.classRequests.approvedToast"));
          onReviewed?.();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!rejecting) return;
    const enrollmentId = rejecting.id;
    reject.mutate(
      { enrollmentId, reason: reason || undefined },
      {
        onSuccess: () => {
          setRejecting(null);
          toast.success(t("root.enrollment.classRequests.rejectedToast"));
          onReviewed?.();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  if (query.isLoading) {
    return <SkeletonList count={2} />;
  }

  if (query.isError) {
    return (
      <Empty
        title={t("root.enrollment.classRequests.errorTitle")}
        description={t("root.enrollment.classRequests.errorDescription")}
        action={
          <Button type="button" className="w-full" onClick={() => query.refetch()}>
            {t("root.classDetail.states.retry")}
          </Button>
        }
      />
    );
  }

  if (requests.length === 0) {
    return (
      <Empty
        title={t("root.enrollment.classRequests.emptyTitle")}
        description={t("root.enrollment.classRequests.emptyDescription")}
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {requests.map((request) => (
          <ClassJoinRequestRow
            key={request.id}
            request={request}
            onApprove={() => handleApprove(request.id)}
            onReject={() => setRejecting(request)}
            isApproving={approve.isPending && approve.variables?.enrollmentId === request.id}
            isRejecting={reject.isPending && reject.variables?.enrollmentId === request.id}
          />
        ))}
      </ul>

      {query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          loading={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          {t("root.enrollment.loadMore")}
        </Button>
      ) : null}

      <RejectRequestDialog
        open={rejecting !== null}
        onOpenChange={(open) => {
          if (!open) setRejecting(null);
        }}
        studentName={rejecting?.student.fullName ?? ""}
        isSubmitting={reject.isPending}
        onConfirm={handleReject}
      />
    </>
  );
}
