"use client";

import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useClassJoinRequests } from "@/app/(root)/_hooks/useEnrollment";
import { useTeacherRequests } from "@/app/(root)/_hooks/useTeacherRequests";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";

type ClassRequestsButtonProps = {
  classId: string;
  /** Admins also have a teacher-request queue, so their total covers both. */
  isAdmin: boolean;
};

/**
 * The class header's way into the request queues, with the number waiting.
 *
 * It jumps to the Requests section on this same page — requests are reviewed
 * where the class is, not only from a notification. The counts come from the
 * same queries the section uses, so React Query serves both from one fetch.
 */
export default function ClassRequestsButton({
  classId,
  isAdmin,
}: ClassRequestsButtonProps) {
  const { t } = useTranslation();

  const studentRequests = useClassJoinRequests({ classId, search: "" });
  const teacherRequests = useTeacherRequests({ classId, search: "", enabled: isAdmin });

  const pending =
    (studentRequests.data?.pages[0]?.meta.total ?? 0) +
    (teacherRequests.data?.pages[0]?.meta.total ?? 0);

  return (
    <Button variant="outline" size="lg" asChild>
      <a href="#class-requests">
        <Inbox className="size-4" />
        {t("root.classDetail.requests.title")}
        {pending > 0 ? (
          <Badge variant="primary" size="xs" shape="count">
            {pending}
          </Badge>
        ) : null}
      </a>
    </Button>
  );
}
