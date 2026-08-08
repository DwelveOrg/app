"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, UserMinus, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SchoolRosterMember } from "@/app/(authentication)/_lib/api.schemas";
import Avatar from "@/components/ui/Avatar";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { Button } from "@/components/ui/Button";
import RowActionsMenu from "@/components/ui/RowActionsMenu";
import Empty from "../../_components/ui/Empty";
import InviteTeacherDialog from "./InviteTeacherDialog";
import RemoveTeacherDialog from "./RemoveTeacherDialog";
import Surface from "@/components/ui/Surface";

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
  const [removeTarget, setRemoveTarget] = useState<SchoolRosterMember | null>(null);

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
    <Surface padding="none" className="overflow-hidden">
      {/* Desktop / tablet: proper table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("root.schoolPage.teachers.columns.teacher")}</th>
              <th className="px-4 py-3">{t("root.schoolPage.teachers.columns.email")}</th>
              <th className="px-4 py-3">{t("root.schoolPage.teachers.columns.joined")}</th>
              <th className="px-4 py-3">
                <span className="sr-only">{t("root.schoolPage.teachers.columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teachers.map((teacher) => (
              <tr key={teacher.memberId} className="text-foreground">
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-3">
                    <Avatar name={teacher.fullName} size="sm" tint="seeded" />
                    <span className="truncate font-medium">{teacher.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">
                  {teacher.email}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">
                  {teacher.createdAt ? <RelativeTime date={teacher.createdAt} /> : "—"}
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <TeacherActionsMenu teacher={teacher} onRemove={setRemoveTarget} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards. */}
      <ul className="divide-y divide-border md:hidden">
        {teachers.map((teacher) => (
          <li key={teacher.memberId} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar name={teacher.fullName} size="sm" tint="seeded" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-foreground">
                  {teacher.fullName}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {teacher.email}
                </div>
              </div>
              <TeacherActionsMenu teacher={teacher} onRemove={setRemoveTarget} />
            </div>
            {teacher.createdAt ? (
              <div className="text-xs text-muted-foreground">
                <RelativeTime date={teacher.createdAt} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <RemoveTeacherDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        memberId={removeTarget?.memberId ?? ""}
        teacherName={removeTarget?.fullName ?? ""}
      />
    </Surface>
  );
}

function TeacherActionsMenu({
  teacher,
  onRemove,
}: {
  teacher: SchoolRosterMember;
  onRemove: (teacher: SchoolRosterMember) => void;
}) {
  const { t } = useTranslation();

  return (
    <RowActionsMenu
      label={t("root.schoolPage.teachers.actions.menu", { name: teacher.fullName })}
      contentClassName="w-52"
      actions={[
        {
          label: t("root.schoolPage.teachers.actions.remove"),
          icon: UserMinus,
          destructive: true,
          onSelect: () => onRemove(teacher),
        },
      ]}
    />
  );
}
