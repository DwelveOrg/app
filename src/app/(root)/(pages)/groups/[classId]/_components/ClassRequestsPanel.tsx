"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useClassJoinRequests } from "@/app/(root)/_hooks/useEnrollment";
import { useTeacherRequests } from "@/app/(root)/_hooks/useTeacherRequests";
import TabBar from "@/components/ui/TabBar";
import { queryKeys } from "@/lib/query/keys";
import ClassStudentRequestsList from "./ClassStudentRequestsList";
import ClassTeacherRequestsList from "./ClassTeacherRequestsList";

export type RequestsTab = "students" | "teachers";

type ClassRequestsPanelProps = {
  classId: string;
  /** Admins review both queues; assigned teachers only see student requests. */
  isAdmin: boolean;
  /** Which queue opens first — teacher-request notifications deep-link here. */
  initialTab?: RequestsTab;
  /** Re-reads the server-rendered class after a request is approved/rejected. */
  onReviewed?: () => void;
};

/**
 * The two request queues for one class, in one control.
 *
 * This is the primary place requests are handled: reachable from the class
 * itself, so a dismissed notification never strands a pending request. The
 * standalone `/groups/:classId/requests` page renders the same panel, which is
 * what notification deep links open.
 */
export default function ClassRequestsPanel({
  classId,
  isAdmin,
  initialTab = "students",
  onReviewed,
}: ClassRequestsPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<RequestsTab>(
    isAdmin && initialTab === "teachers" ? "teachers" : "students",
  );

  // Counts only — each list owns its own copy of the query, and React Query
  // serves both from one cache entry because the keys match.
  const studentRequests = useClassJoinRequests({ classId, search: "" });
  const teacherRequests = useTeacherRequests({
    classId,
    search: "",
    enabled: isAdmin,
  });
  const studentCount = studentRequests.data?.pages[0]?.meta.total ?? 0;
  const teacherCount = teacherRequests.data?.pages[0]?.meta.total ?? 0;

  const onTeachers = isAdmin && tab === "teachers";

  /**
   * Either tab re-reads both queues, not just the one being opened.
   *
   * The switch used to fetch nothing at all — both queries are already mounted
   * here for the counts, so React Query had no reason to go back to the server
   * and a request that arrived after page load stayed invisible until a reload.
   * Refreshing only the opened queue would fix half of it and introduce the
   * other half: both counts sit in this one row, so the badge for the queue we
   * skipped would sit next to freshly-loaded data still showing its old number.
   */
  const requestsRefresh = {
    queryKeys: [
      queryKeys.enrollment.classRequestsAll(classId),
      queryKeys.enrollment.teacherRequestsAll(classId),
    ],
  };

  return (
    <div className="flex flex-col gap-4">
      {isAdmin ? (
        <TabBar
          layoutId="class-requests-tabs"
          ariaLabel={t("root.enrollment.teacherRequests.tabsLabel")}
          value={tab}
          onSelect={(next) => setTab(next as RequestsTab)}
          items={[
            {
              value: "students",
              label: t("root.enrollment.teacherRequests.tabStudents"),
              count: studentCount,
              refresh: requestsRefresh,
            },
            {
              value: "teachers",
              label: t("root.enrollment.teacherRequests.tabTeachers"),
              count: teacherCount,
              refresh: requestsRefresh,
            },
          ]}
        />
      ) : null}

      {onTeachers ? (
        <ClassTeacherRequestsList classId={classId} onReviewed={onReviewed} />
      ) : (
        <ClassStudentRequestsList classId={classId} onReviewed={onReviewed} />
      )}
    </div>
  );
}
