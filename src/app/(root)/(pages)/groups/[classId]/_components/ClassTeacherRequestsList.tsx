"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import PersonRequestRow from "@/app/(root)/_components/PersonRequestRow";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { TeacherRequestItem } from "@/app/(root)/_lib/teacher-requests.schemas";
import {
  useApproveTeacherRequestMutation,
  useRejectTeacherRequestMutation,
  useTeacherRequests,
} from "@/app/(root)/_hooks/useTeacherRequests";
import Empty from "../../../_components/ui/Empty";
import RejectTeacherRequestDialog from "./RejectTeacherRequestDialog";

type ClassTeacherRequestsListProps = {
  classId: string;
  /**
   * Called after an approve or reject lands. Approving assigns the teacher, so
   * the server-rendered class page uses this to re-read its roster.
   */
  onReviewed?: () => void;
};

/**
 * Admin-only list of pending teacher requests for one class. Approving assigns
 * the teacher to the class; rejecting records an optional reason. The backend
 * restricts these actions to admins — this list is only reachable by them.
 */
export default function ClassTeacherRequestsList({
  classId,
  onReviewed,
}: ClassTeacherRequestsListProps) {
  const { t } = useTranslation();
  const [rejecting, setRejecting] = useState<TeacherRequestItem | null>(null);

  const query = useTeacherRequests({ classId, search: "" });
  const approve = useApproveTeacherRequestMutation();
  const reject = useRejectTeacherRequestMutation();

  const requests = useMemo(
    () => query.data?.pages.flatMap((page) => page.requests) ?? [],
    [query.data?.pages],
  );

  const handleApprove = (requestId: string) => {
    approve.mutate(
      { requestId },
      {
        onSuccess: () => {
          toast.success(t("root.enrollment.teacherRequests.approvedToast"));
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
    const requestId = rejecting.id;
    reject.mutate(
      { requestId, reason: reason || undefined },
      {
        onSuccess: () => {
          setRejecting(null);
          toast.success(t("root.enrollment.teacherRequests.rejectedToast"));
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
        title={t("root.enrollment.teacherRequests.errorTitle")}
        description={t("root.enrollment.teacherRequests.errorDescription")}
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
        title={t("root.enrollment.teacherRequests.emptyTitle")}
        description={t("root.enrollment.teacherRequests.emptyDescription")}
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {requests.map((request) => (
          <RequestRow
            key={request.id}
            request={request}
            onApprove={() => handleApprove(request.id)}
            onReject={() => setRejecting(request)}
            isApproving={approve.isPending && approve.variables?.requestId === request.id}
            isRejecting={reject.isPending && reject.variables?.requestId === request.id}
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

      <RejectTeacherRequestDialog
        open={rejecting !== null}
        onOpenChange={(open) => {
          if (!open) setRejecting(null);
        }}
        teacherName={rejecting?.teacher.fullName ?? ""}
        isSubmitting={reject.isPending}
        onConfirm={handleReject}
      />
    </>
  );
}

type RequestRowProps = {
  request: TeacherRequestItem;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
};

/**
 * Unwraps the teacher out of the request and supplies the teacher-side labels. Everything visual
 * lives in `PersonRequestRow`, shared with the student join-request row.
 */
function RequestRow({ request, onApprove, onReject, isApproving, isRejecting }: RequestRowProps) {
  const { t } = useTranslation();

  return (
    <PersonRequestRow
      person={request.teacher}
      message={request.message}
      requestedAt={request.requestedAt}
      approveLabel={t("root.enrollment.teacherRequests.approve")}
      rejectLabel={t("root.enrollment.teacherRequests.reject")}
      onApprove={onApprove}
      onReject={onReject}
      isApproving={isApproving}
      isRejecting={isRejecting}
    />
  );
}
