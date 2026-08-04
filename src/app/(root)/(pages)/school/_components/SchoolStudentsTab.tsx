"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GraduationCap, UserMinus } from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import type { StudentItem } from "@/app/(root)/_lib/students.schemas";
import RowActionsMenu from "@/components/ui/RowActionsMenu";
import Empty from "../../_components/ui/Empty";
import RemoveStudentDialog from "./RemoveStudentDialog";
import Surface from "@/components/ui/Surface";

type SchoolStudentsTabProps = {
  students: StudentItem[];
};

/**
 * Renders the student roster returned by `GET /students`
 * (see `docs/features/students-page-contract.md`). Rendered only for admins;
 * teacher/student sessions never see this tab so the endpoint isn't called.
 */
export default function SchoolStudentsTab({ students }: SchoolStudentsTabProps) {
  const { t } = useTranslation();
  const [removeTarget, setRemoveTarget] = useState<StudentItem | null>(null);

  if (students.length === 0) {
    return (
      <Empty
        title={t("root.schoolPage.students.emptyTitle")}
        description={t("root.schoolPage.students.emptyDescription")}
      />
    );
  }

  return (
    <Surface padding="none" className="overflow-hidden">
      {/* Desktop / tablet: proper table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("root.schoolPage.students.columns.student")}</th>
              <th className="px-4 py-3">{t("root.schoolPage.students.columns.code")}</th>
              <th className="px-4 py-3">{t("root.schoolPage.students.columns.classes")}</th>
              <th className="px-4 py-3">{t("root.schoolPage.students.columns.joined")}</th>
              <th className="px-4 py-3">
                <span className="sr-only">{t("root.schoolPage.students.columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((student) => (
              <StudentRow
                key={student.memberId}
                student={student}
                onRemove={setRemoveTarget}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards. */}
      <ul className="divide-y divide-border md:hidden">
        {students.map((student) => (
          <StudentCard
            key={student.memberId}
            student={student}
            onRemove={setRemoveTarget}
          />
        ))}
      </ul>

      <RemoveStudentDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        memberId={removeTarget?.memberId ?? ""}
        studentName={removeTarget?.fullName ?? ""}
      />
    </Surface>
  );
}

function StudentActionsMenu({
  student,
  onRemove,
}: {
  student: StudentItem;
  onRemove: (student: StudentItem) => void;
}) {
  const { t } = useTranslation();

  return (
    <RowActionsMenu
      label={t("root.schoolPage.students.actions.menu", { name: student.fullName })}
      actions={[
        {
          label: t("root.schoolPage.students.actions.remove"),
          icon: UserMinus,
          destructive: true,
          onSelect: () => onRemove(student),
        },
      ]}
    />
  );
}

function StudentRow({
  student,
  onRemove,
}: {
  student: StudentItem;
  onRemove: (student: StudentItem) => void;
}) {
  const { t } = useTranslation();
  const classesText = summarizeClasses(student, t);
  const joinedAt = student.joinedAt ?? student.createdAt;

  return (
    <tr className="text-foreground">
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-3">
          <Avatar name={student.fullName} size="sm" tint="seeded" />
          <div className="min-w-0">
            <div className="truncate font-medium">{student.fullName}</div>
            <div className="truncate text-xs text-muted-foreground">
              {student.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        {student.studentCode ? (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
            {student.studentCode}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-top text-muted-foreground">{classesText}</td>
      <td className="px-4 py-3 align-top text-muted-foreground">
        {joinedAt ? <RelativeTime date={joinedAt} /> : "—"}
      </td>
      <td className="px-4 py-3 align-top text-right">
        <StudentActionsMenu student={student} onRemove={onRemove} />
      </td>
    </tr>
  );
}

function StudentCard({
  student,
  onRemove,
}: {
  student: StudentItem;
  onRemove: (student: StudentItem) => void;
}) {
  const { t } = useTranslation();
  const classesText = summarizeClasses(student, t);
  const joinedAt = student.joinedAt ?? student.createdAt;

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <Avatar name={student.fullName} size="sm" tint="seeded" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">
            {student.fullName}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {student.email}
          </div>
        </div>
        <StudentActionsMenu student={student} onRemove={onRemove} />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {student.studentCode ? (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-2xs text-foreground">
            {student.studentCode}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <GraduationCap className="h-3.5 w-3.5" />
          {classesText}
        </span>
        {joinedAt ? <RelativeTime date={joinedAt} /> : null}
      </div>
    </li>
  );
}

function summarizeClasses(
  student: StudentItem,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const count = student.classCount ?? student.classes.length;
  if (count === 0) {
    return t("root.schoolPage.students.noClasses");
  }
  const previewNames = student.classes
    .filter((assignment) => assignment.isActive)
    .slice(0, 2)
    .map((assignment) => assignment.name);
  const preview = previewNames.length > 0 ? previewNames.join(", ") : null;
  const label = t("root.schoolPage.students.classCount", { count });
  return preview ? `${label} · ${preview}` : label;
}
