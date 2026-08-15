"use client";

import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useClassJoinRequests } from "@/app/(root)/_hooks/useEnrollment";
import { useTeacherRequests } from "@/app/(root)/_hooks/useTeacherRequests";
import PanelDialog from "@/app/(root)/_components/PanelDialog";
import ClassRequestsPanel from "./ClassRequestsPanel";

type ClassRequestsButtonProps = {
  classId: string;
  /** Admins also have a teacher-request queue, so their total covers both. */
  isAdmin: boolean;
};

export default function ClassRequestsButton({
  classId,
  isAdmin,
}: ClassRequestsButtonProps) {
  const { t } = useTranslation();

  const studentRequests = useClassJoinRequests({ classId, search: "" });
  const teacherRequests = useTeacherRequests({ classId, search: "", enabled: isAdmin });

  const pending =
    (studentRequests.data?.pages[0]?.meta.total ?? 0) +
    (isAdmin ? (teacherRequests.data?.pages[0]?.meta.total ?? 0) : 0);

  return (
    <PanelDialog
      icon={Inbox}
      label={t("root.classDetail.requests.title")}
      count={pending}
      emphasis
      description={t("root.classDetail.requests.panelDescription")}
      size="lg"
    >
      <ClassRequestsPanel classId={classId} isAdmin={isAdmin} />
    </PanelDialog>
  );
}
