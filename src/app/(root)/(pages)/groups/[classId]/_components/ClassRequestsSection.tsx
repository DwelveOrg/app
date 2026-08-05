"use client";

import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import ClassRequestsPanel from "./ClassRequestsPanel";

type ClassRequestsSectionProps = {
  classId: string;
  /** Admins also review requests to teach the class; teachers see students only. */
  isAdmin: boolean;
  /** Re-reads the server-rendered class after a request is approved/rejected. */
  onReviewed?: () => void;
};

/**
 * Requests, in full, on the class page itself.
 *
 * This used to be a three-row preview that linked out to the real queue, and the
 * teacher-request queue existed only on that other page — so an admin who
 * dismissed the notification had no path to a pending request from the class.
 * Both queues are handled here now; the standalone page remains for deep links.
 */
export default function ClassRequestsSection({
  classId,
  isAdmin,
  onReviewed,
}: ClassRequestsSectionProps) {
  const { t } = useTranslation();

  return (
    <section
      id="class-requests"
      aria-labelledby="class-requests-heading"
      className="flex scroll-mt-6 flex-col gap-4"
    >
      <h2
        id="class-requests-heading"
        className="inline-flex items-center gap-2 text-base font-bold text-foreground"
      >
        <Inbox className="h-4 w-4 text-muted-foreground" />
        {t("root.classDetail.requests.title")}
      </h2>

      <ClassRequestsPanel classId={classId} isAdmin={isAdmin} onReviewed={onReviewed} />
    </section>
  );
}
