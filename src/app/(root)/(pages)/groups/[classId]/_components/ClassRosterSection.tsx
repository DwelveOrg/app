"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { ApiClassPerson } from "@/app/(root)/_lib/classes.schemas";
import {
  useRemoveClassStudentMutation,
  useRemoveClassTeacherMutation,
} from "@/app/(root)/_hooks/useClassRoster";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import TabBar from "@/components/ui/TabBar";
import AssignStudentDialog from "./AssignStudentDialog";
import AssignTeacherDialog from "./AssignTeacherDialog";
import RemoveClassStudentDialog from "./RemoveClassStudentDialog";
import RemoveClassTeacherDialog from "./RemoveClassTeacherDialog";

type RosterTab = "teachers" | "students";

type ClassRosterSectionProps = {
  classId: string;
  teachers: ApiClassPerson[];
  students: ApiClassPerson[];
  /** `class.counts` from the backend — never derived from the rendered list. */
  teacherCount: number;
  studentCount: number;
  /** Admins only: the teaching roster is theirs to change. */
  canManageTeachers: boolean;
  /** Admins and teachers assigned to this class. */
  canManageStudents: boolean;
  /** Re-reads the server-rendered class after a roster change. */
  onRosterChange: () => void;
};

/**
 * Who is in this class. Teachers and students were two cards side by side, which
 * gave a long roster half the width and no room for its own actions; they are
 * one tabbed panel now, with the counts coming from `class.counts` so a
 * truncated list can never disagree with the label.
 *
 * Which controls render follows the viewer's role, but the backend is the
 * authorization boundary — it re-checks every add and remove.
 */
export default function ClassRosterSection({
  classId,
  teachers,
  students,
  teacherCount,
  studentCount,
  canManageTeachers,
  canManageStudents,
  onRosterChange,
}: ClassRosterSectionProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<RosterTab>("students");
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [removeTeacher, setRemoveTeacher] = useState<ApiClassPerson | null>(null);
  const [removeStudent, setRemoveStudent] = useState<ApiClassPerson | null>(null);

  const removeTeacherMutation = useRemoveClassTeacherMutation(classId);
  const removeStudentMutation = useRemoveClassStudentMutation(classId);

  const handleRemoveTeacher = () => {
    if (!removeTeacher) return;
    const { id: teacherProfileId, fullName } = removeTeacher;
    removeTeacherMutation.mutate(
      { classId, teacherId: teacherProfileId },
      {
        onSuccess: () => {
          setRemoveTeacher(null);
          toast.success(t("root.enrollment.assignTeacher.removedToast", { name: fullName }));
          onRosterChange();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  const handleRemoveStudent = () => {
    if (!removeStudent) return;
    const { id: studentProfileId, fullName } = removeStudent;
    removeStudentMutation.mutate(
      { classId, studentId: studentProfileId },
      {
        onSuccess: () => {
          setRemoveStudent(null);
          toast.success(t("root.enrollment.assign.removedToast", { name: fullName }));
          onRosterChange();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  const onTeachers = tab === "teachers";

  return (
    <section aria-labelledby="class-people-heading" className="flex flex-col gap-4">
      <h2 id="class-people-heading" className="sr-only">
        {t("root.classDetail.people.title")}
      </h2>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <TabBar
          layoutId="class-roster-tabs"
          ariaLabel={t("root.classDetail.people.title")}
          value={tab}
          onSelect={(next) => setTab(next as RosterTab)}
          className="flex-1"
          items={[
            {
              value: "teachers",
              label: t("root.classDetail.teachers.tab"),
              count: teacherCount,
              showZeroCount: true,
            },
            {
              value: "students",
              label: t("root.classDetail.students.tab"),
              count: studentCount,
              showZeroCount: true,
            },
          ]}
        />

        {onTeachers && canManageTeachers ? (
          <Button size="sm" variant="outline" onClick={() => setAddTeacherOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            {t("root.enrollment.assignTeacher.add")}
          </Button>
        ) : null}
        {!onTeachers && canManageStudents ? (
          <Button size="sm" variant="outline" onClick={() => setAddStudentOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            {t("root.enrollment.assign.addStudent")}
          </Button>
        ) : null}
      </div>

      {onTeachers ? (
        <RosterList
          people={teachers}
          emptyLabel={t("root.classDetail.teachers.empty")}
          onRemove={canManageTeachers ? setRemoveTeacher : undefined}
          removingId={
            removeTeacherMutation.isPending
              ? removeTeacherMutation.variables?.teacherId
              : undefined
          }
        />
      ) : (
        <RosterList
          people={students}
          emptyLabel={t("root.classDetail.students.empty")}
          onRemove={canManageStudents ? setRemoveStudent : undefined}
          removingId={
            removeStudentMutation.isPending
              ? removeStudentMutation.variables?.studentId
              : undefined
          }
        />
      )}

      {canManageTeachers ? (
        <>
          <AssignTeacherDialog
            open={addTeacherOpen}
            onOpenChange={setAddTeacherOpen}
            classId={classId}
            onAssigned={onRosterChange}
          />
          <RemoveClassTeacherDialog
            open={removeTeacher !== null}
            onOpenChange={(open) => {
              if (!open) setRemoveTeacher(null);
            }}
            teacherName={removeTeacher?.fullName ?? ""}
            isSubmitting={removeTeacherMutation.isPending}
            onConfirm={handleRemoveTeacher}
          />
        </>
      ) : null}

      {canManageStudents ? (
        <>
          <AssignStudentDialog
            open={addStudentOpen}
            onOpenChange={setAddStudentOpen}
            classId={classId}
            onAssigned={onRosterChange}
          />
          <RemoveClassStudentDialog
            open={removeStudent !== null}
            onOpenChange={(open) => {
              if (!open) setRemoveStudent(null);
            }}
            studentName={removeStudent?.fullName ?? ""}
            isSubmitting={removeStudentMutation.isPending}
            onConfirm={handleRemoveStudent}
          />
        </>
      ) : null}
    </section>
  );
}

type RosterListProps = {
  people: ApiClassPerson[];
  emptyLabel: string;
  /** Omitted for viewers who cannot change this roster. */
  onRemove?: (person: ApiClassPerson) => void;
  /** Profile id currently being removed, for the row spinner. */
  removingId?: string;
};

/** One roster: a person per row, with Remove rendered as a visible action. */
function RosterList({ people, emptyLabel, onRemove, removingId }: RosterListProps) {
  const { t } = useTranslation();

  if (people.length === 0) {
    return (
      <Surface variant="dashed" elevation={0} className="text-sm text-muted-foreground">
        {emptyLabel}
      </Surface>
    );
  }

  return (
    <Surface padding="none" className="overflow-hidden">
      <ul className="divide-y divide-border">
        {people.map((person) => (
          <li key={person.id} className="flex items-center gap-3 px-5 py-3">
            <Avatar name={person.fullName} size="sm" tint="seeded" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {person.fullName}
              </div>
              {person.email ? (
                <div className="truncate text-xs text-muted-foreground">{person.email}</div>
              ) : null}
            </div>
            {onRemove ? (
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                loading={removingId === person.id}
                aria-label={`${t("root.enrollment.assign.remove")} ${person.fullName}`}
                onClick={() => onRemove(person)}
              >
                {t("root.enrollment.assign.remove")}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Surface>
  );
}
