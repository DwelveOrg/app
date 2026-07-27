"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import type { ClassEnrollmentItem } from "@/app/(root)/_lib/enrollment.schemas";
import {
  useApproveEnrollmentMutation,
  useClassJoinRequests,
  useRejectEnrollmentMutation,
} from "@/app/(root)/_hooks/useEnrollment";
import Empty from "../../../_components/ui/Empty";
import RejectRequestDialog from "./RejectRequestDialog";
import ClassTeacherRequestsList from "./ClassTeacherRequestsList";

type RequestsTab = "students" | "teachers";

type ClassRequestsViewProps = {
  classId: string;
  className: string;
  /** Admins also review teacher requests to teach; teachers see students only. */
  isAdmin: boolean;
  /** Which queue to open first — teacher-request notifications deep-link here. */
  initialTab?: RequestsTab;
};

/**
 * Teacher/admin view of pending requests for one class. The Students tab lists
 * join requests (approve activates the enrollment). Admins get a second Teachers
 * tab listing requests to teach the class (approve assigns the teacher). The
 * backend enforces that teachers may only manage classes assigned to them and
 * that teacher requests are admin-only.
 */
export default function ClassRequestsView({
  classId,
  className,
  isAdmin,
  initialTab = "students",
}: ClassRequestsViewProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<RequestsTab>(
    isAdmin && initialTab === "teachers" ? "teachers" : "students",
  );
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
        onSuccess: () => toast.success(t("root.enrollment.classRequests.approvedToast")),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t("root.enrollment.errorGeneric")),
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
          toast.error(error instanceof Error ? error.message : t("root.enrollment.errorGeneric")),
      },
    );
  };

  return (
    <section className="flex flex-col gap-6 py-6">
      <Link
        href={`/groups/${classId}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("root.enrollment.classRequests.back")}
      </Link>

      <header>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {t("root.enrollment.classRequests.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {t("root.enrollment.classRequests.subtitle", { name: className })}
        </p>
      </header>

      {/* Admins triage two request queues; teachers only see student requests. */}
      {isAdmin ? (
        <div
          role="tablist"
          aria-label={t("root.enrollment.teacherRequests.tabsLabel")}
          className="flex flex-wrap items-center gap-1 border-b border-[var(--border)]"
        >
          {(["students", "teachers"] as const).map((value) => {
            const isActive = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(value)}
                className={`relative inline-flex h-9 cursor-pointer items-center px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {value === "students"
                  ? t("root.enrollment.teacherRequests.tabStudents")
                  : t("root.enrollment.teacherRequests.tabTeachers")}
                {isActive ? (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--primary)]" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {isAdmin && tab === "teachers" ? (
        <ClassTeacherRequestsList classId={classId} />
      ) : query.isLoading ? (
        <div aria-busy="true" className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--muted)]"
            />
          ))}
        </div>
      ) : query.isError ? (
        <Empty
          title={t("root.enrollment.classRequests.errorTitle")}
          description={t("root.enrollment.classRequests.errorDescription")}
        />
      ) : requests.length === 0 ? (
        <Empty
          title={t("root.enrollment.classRequests.emptyTitle")}
          description={t("root.enrollment.classRequests.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              onApprove={() => handleApprove(request.id)}
              onReject={() => setRejecting(request)}
              isApproving={approve.isPending && approve.variables?.enrollmentId === request.id}
              isRejecting={reject.isPending && reject.variables?.enrollmentId === request.id}
            />
          ))}
        </ul>
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

type RequestRowProps = {
  request: ClassEnrollmentItem;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
};

function RequestRow({ request, onApprove, onReject, isApproving, isRejecting }: RequestRowProps) {
  const { t } = useTranslation();
  const { student } = request;
  const initial = student.fullName.trim().charAt(0).toUpperCase() || "?";
  const busy = isApproving || isRejecting;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
        {initial}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
          {student.fullName}
        </p>
        {student.email ? (
          <p className="truncate text-xs text-[var(--muted-foreground)]">{student.email}</p>
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
        <Button
          size="lg"
          disabled={busy}
          aria-busy={isApproving}
          onClick={onApprove}
        >
          {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {t("root.enrollment.classRequests.approve")}
        </Button>
        <Button
          size="lg"
          variant="destructive"
          disabled={busy}
          onClick={onReject}
        >
          <X className="h-4 w-4" />
          {t("root.enrollment.classRequests.reject")}
        </Button>
      </div>
    </li>
  );
}
