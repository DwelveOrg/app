"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Inbox, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import type { ClassEnrollmentItem } from "@/app/(root)/_lib/enrollment.schemas";
import {
  useApproveEnrollmentMutation,
  useClassJoinRequests,
  useRejectEnrollmentMutation,
} from "@/app/(root)/_hooks/useEnrollment";
import ClassJoinRequestRow from "./ClassJoinRequestRow";
import RejectRequestDialog from "./RejectRequestDialog";

type ClassRequestsSectionProps = {
  classId: string;
};

/** How many pending requests are triaged inline before linking to the queue. */
const PREVIEW_LIMIT = 3;

/**
 * Pending join requests inline on the class page, so approving someone does not
 * require a detour. Rendered only for viewers the backend lets manage the class
 * — and the backend still authorizes every approve/reject. The full queue
 * (including the admin-only teacher requests) stays at `/groups/:id/requests`.
 */
export default function ClassRequestsSection({ classId }: ClassRequestsSectionProps) {
  const { t } = useTranslation();
  const [rejecting, setRejecting] = useState<ClassEnrollmentItem | null>(null);

  const query = useClassJoinRequests({ classId, search: "" });
  const approve = useApproveEnrollmentMutation(classId);
  const reject = useRejectEnrollmentMutation(classId);

  const requests = useMemo(
    () => query.data?.pages.flatMap((page) => page.enrollments) ?? [],
    [query.data?.pages],
  );
  const total = query.data?.pages[0]?.meta.total ?? requests.length;

  const handleApprove = (enrollmentId: string) => {
    approve.mutate(
      { enrollmentId },
      {
        onSuccess: () => toast.success(t("root.enrollment.classRequests.approvedToast")),
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
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  return (
    <section aria-labelledby="class-requests-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="class-requests-heading"
          className="inline-flex items-center gap-2 text-base font-bold text-[var(--foreground)]"
        >
          <Inbox className="h-4 w-4 text-[var(--muted-foreground)]" />
          {t("root.classDetail.requests.title")}
          {total > 0 ? (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">
              {total}
            </span>
          ) : null}
        </h2>

        <Button variant="outline" size="sm" asChild>
          <Link href={`/groups/${classId}/requests`}>
            {t("root.classDetail.requests.viewAll")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {query.isLoading ? (
        <div aria-busy="true" className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl border border-[var(--border)]" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("root.enrollment.classRequests.errorDescription")}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => query.refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t("root.classDetail.states.retry")}
          </Button>
        </div>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] px-5 py-6 text-sm text-[var(--muted-foreground)]">
          {t("root.enrollment.classRequests.emptyDescription")}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {requests.slice(0, PREVIEW_LIMIT).map((request) => (
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
          {total > PREVIEW_LIMIT ? (
            <Link
              href={`/groups/${classId}/requests`}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              {t("root.classDetail.requests.more", { count: total - PREVIEW_LIMIT })}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </>
      )}

      <RejectRequestDialog
        open={rejecting !== null}
        onOpenChange={(open) => {
          if (!open) setRejecting(null);
        }}
        studentName={rejecting?.student.fullName ?? ""}
        isSubmitting={reject.isPending}
        onConfirm={handleReject}
      />
    </section>
  );
}
