"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import Skeleton from "@/components/ui/Skeleton";
import type { ClassEnrollmentItem } from "@/app/(root)/_lib/enrollment.schemas";
import {
  useApproveEnrollmentMutation,
  useClassJoinRequests,
  useRejectEnrollmentMutation,
} from "@/app/(root)/_hooks/useEnrollment";
import Empty from "../../../_components/ui/Empty";
import ClassJoinRequestRow from "./ClassJoinRequestRow";
import RejectRequestDialog from "./RejectRequestDialog";
import ClassTeacherRequestsList from "./ClassTeacherRequestsList";
import TabBar from "@/components/ui/TabBar";

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
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("root.enrollment.classRequests.back")}
      </Link>

      <header>
        <h1 className="type-title text-foreground">
          {t("root.enrollment.classRequests.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("root.enrollment.classRequests.subtitle", { name: className })}
        </p>
      </header>

      {/* Admins triage two request queues; teachers only see student requests. */}
      {isAdmin ? (
        <TabBar
          layoutId="class-requests-tabs"
          ariaLabel={t("root.enrollment.teacherRequests.tabsLabel")}
          value={tab}
          onSelect={(next) => setTab(next as "students" | "teachers")}
          items={[
            { value: "students", label: t("root.enrollment.teacherRequests.tabStudents") },
            { value: "teachers", label: t("root.enrollment.teacherRequests.tabTeachers") },
          ]}
        />
      ) : null}

      {isAdmin && tab === "teachers" ? (
        <ClassTeacherRequestsList classId={classId} />
      ) : query.isLoading ? (
        <div aria-busy="true" className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-24 rounded-2xl border border-border"
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

