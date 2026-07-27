"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
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
};

/**
 * Admin-only list of pending teacher requests for one class. Approving assigns
 * the teacher to the class; rejecting records an optional reason. The backend
 * restricts these actions to admins — this list is only reachable by them.
 */
export default function ClassTeacherRequestsList({ classId }: ClassTeacherRequestsListProps) {
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
        onSuccess: () => toast.success(t("root.enrollment.teacherRequests.approvedToast")),
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
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  if (query.isLoading) {
    return (
      <div aria-busy="true" className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]"
          />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <Empty
        title={t("root.enrollment.teacherRequests.errorTitle")}
        description={t("root.enrollment.teacherRequests.errorDescription")}
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

function RequestRow({ request, onApprove, onReject, isApproving, isRejecting }: RequestRowProps) {
  const { t } = useTranslation();
  const { teacher } = request;
  const initial = teacher.fullName.trim().charAt(0).toUpperCase() || "?";
  const busy = isApproving || isRejecting;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
        {initial}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
          {teacher.fullName}
        </p>
        {teacher.email ? (
          <p className="truncate text-xs text-[var(--muted-foreground)]">{teacher.email}</p>
        ) : null}
        {request.message ? (
          <p className="mt-1.5 rounded-lg bg-[var(--muted)] px-3 py-1.5 text-xs text-[var(--foreground)]">
            {request.message}
          </p>
        ) : null}
        {request.requestedAt ? (
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            <RelativeTime date={request.requestedAt} />
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button size="lg" disabled={busy} aria-busy={isApproving} onClick={onApprove}>
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {t("root.enrollment.teacherRequests.approve")}
        </Button>
        <Button size="lg" variant="destructive" disabled={busy} onClick={onReject}>
          <X className="h-4 w-4" />
          {t("root.enrollment.teacherRequests.reject")}
        </Button>
      </div>
    </li>
  );
}
