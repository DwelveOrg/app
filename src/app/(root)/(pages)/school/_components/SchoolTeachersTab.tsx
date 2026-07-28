"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SchoolRosterMember } from "@/app/(authentication)/_lib/api.schemas";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { Button } from "@/components/ui/Button";
import Empty from "../../_components/ui/Empty";
import InviteTeacherDialog from "./InviteTeacherDialog";

type SchoolTeachersTabProps = {
  /** Already filtered to `role === "TEACHER"` by the page. */
  teachers: SchoolRosterMember[];
  /** True when `GET /schools/:schoolId/members` failed for this request. */
  hasError: boolean;
};

/**
 * Admin-only teacher roster from `GET /schools/:schoolId/members`. The backend
 * returns populated `members` rows only to ADMIN callers, so this tab is never
 * rendered for teachers or students and their `members: []` response is never
 * treated as a roster. Teachers are only ever added through the email-bound
 * invite flow — this tab never creates an account.
 */
export default function SchoolTeachersTab({ teachers, hasError }: SchoolTeachersTabProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);

  if (hasError) {
    return (
      <Empty
        title={t("root.schoolPage.teachers.errorTitle")}
        description={t("root.schoolPage.teachers.errorDescription")}
        action={
          <Button type="button" className="w-full" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4" />
            {t("root.schoolPage.teachers.retry")}
          </Button>
        }
      />
    );
  }

  if (teachers.length === 0) {
    return (
      <>
        <Empty
          title={t("root.schoolPage.teachers.emptyTitle")}
          description={t("root.schoolPage.teachers.emptyDescription")}
          action={
            <Button type="button" className="w-full" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4" />
              {t("root.schoolPage.invite.menuTeacher")}
            </Button>
          }
        />
        <InviteTeacherDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      </>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      {/* Desktop / tablet: proper table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--muted)]/40 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-3">{t("root.schoolPage.teachers.columns.teacher")}</th>
              <th className="px-4 py-3">{t("root.schoolPage.teachers.columns.email")}</th>
              <th className="px-4 py-3">{t("root.schoolPage.teachers.columns.status")}</th>
              <th className="px-4 py-3">{t("root.schoolPage.teachers.columns.joined")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {teachers.map((teacher) => (
              <tr key={teacher.memberId} className="text-[var(--foreground)]">
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-3">
                    <Avatar name={teacher.fullName} />
                    <span className="truncate font-medium">{teacher.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-[var(--muted-foreground)]">
                  {teacher.email}
                </td>
                <td className="px-4 py-3 align-top">
                  <ProfileStatus teacherProfileId={teacher.teacherProfileId} />
                </td>
                <td className="px-4 py-3 align-top text-[var(--muted-foreground)]">
                  {teacher.createdAt ? <RelativeTime date={teacher.createdAt} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards. */}
      <ul className="divide-y divide-[var(--border)] md:hidden">
        {teachers.map((teacher) => (
          <li key={teacher.memberId} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={teacher.fullName} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-[var(--foreground)]">
                  {teacher.fullName}
                </div>
                <div className="truncate text-xs text-[var(--muted-foreground)]">
                  {teacher.email}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <ProfileStatus teacherProfileId={teacher.teacherProfileId} />
              {teacher.createdAt ? <RelativeTime date={teacher.createdAt} /> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * `teacherProfileId` is the id used for class assignment (never `userId`). A
 * null one means the membership exists but the teacher profile is not set up
 * yet, so the person cannot be assigned to a class.
 */
function ProfileStatus({ teacherProfileId }: { teacherProfileId: string | null }) {
  const { t } = useTranslation();

  if (teacherProfileId) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        {t("root.schoolPage.teachers.status.ready")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
      {t("root.schoolPage.teachers.status.pending")}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
      {initial}
    </span>
  );
}
