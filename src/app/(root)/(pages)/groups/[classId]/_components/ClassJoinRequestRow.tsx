"use client";

import { useTranslation } from "react-i18next";

import PersonRequestRow from "@/app/(root)/_components/PersonRequestRow";
import type { ClassEnrollmentItem } from "@/app/(root)/_lib/enrollment.schemas";

type ClassJoinRequestRowProps = {
  request: ClassEnrollmentItem;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
};

/**
 * One pending student join request. Shared by the class detail Requests section
 * and the full requests page so both read identically; the backend decides
 * whether approve/reject actually succeed.
 *
 * The row itself is `PersonRequestRow` — this only unwraps the student out of the enrollment and
 * supplies the student-side labels, which is the whole of what makes it different from the
 * teacher-request row.
 */
export default function ClassJoinRequestRow({
  request,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ClassJoinRequestRowProps) {
  const { t } = useTranslation();

  return (
    <PersonRequestRow
      person={request.student}
      message={request.message}
      requestedAt={request.requestedAt}
      approveLabel={t("root.enrollment.classRequests.approve")}
      rejectLabel={t("root.enrollment.classRequests.reject")}
      onApprove={onApprove}
      onReject={onReject}
      isApproving={isApproving}
      isRejecting={isRejecting}
    />
  );
}
