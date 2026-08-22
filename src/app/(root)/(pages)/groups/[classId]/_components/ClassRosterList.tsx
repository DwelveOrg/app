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
import AssignStudentDialog from "./AssignStudentDialog";
import AssignTeacherDialog from "./AssignTeacherDialog";
import RemoveClassStudentDialog from "./RemoveClassStudentDialog";
import RemoveClassTeacherDialog from "./RemoveClassTeacherDialog";

export default function ClassRosterList({
  classId,
  people,
  kind,
  canManage,
}: {
  classId: string;
  people: ApiClassPerson[];
  kind: "teachers" | "students";
  canManage: boolean;
}) {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ApiClassPerson | null>(null);

  const removeTeacher = useRemoveClassTeacherMutation(classId);
  const removeStudent = useRemoveClassStudentMutation(classId);
  const onTeachers = kind === "teachers";
  const removing = onTeachers ? removeTeacher.isPending : removeStudent.isPending;

  const confirmRemove = () => {
    if (!removeTarget) return;
    const { id, fullName } = removeTarget;

    const onSuccess = () => {
      setRemoveTarget(null);
      toast.success(
        t(
          onTeachers
            ? "root.enrollment.assignTeacher.removedToast"
            : "root.enrollment.assign.removedToast",
          { name: fullName },
        ),
      );
    };
    const onError = (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
      );

    if (onTeachers) {
      removeTeacher.mutate({ classId, teacherId: id }, { onSuccess, onError });
    } else {
      removeStudent.mutate({ classId, studentId: id }, { onSuccess, onError });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {canManage ? (
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() => setAddOpen(true)}
        >
          <UserPlus className="size-3.5" />
          {t(
            onTeachers
              ? "root.enrollment.assignTeacher.add"
              : "root.enrollment.assign.addStudent",
          )}
        </Button>
      ) : null}

      {people.length === 0 ? (
        <Surface variant="dashed" elevation={0} className="text-sm text-muted-foreground">
          {t(onTeachers ? "root.classDetail.teachers.empty" : "root.classDetail.students.empty")}
        </Surface>
      ) : (
        <Surface padding="none" divided>
          {people.map((person) => (
            <div key={person.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={person.fullName} size="sm" tint="seeded" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {person.fullName}
                </div>
                {person.email ? (
                  <div className="truncate text-xs text-muted-foreground">
                    {person.email}
                  </div>
                ) : null}
              </div>
              {canManage ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  loading={removing && removeTarget?.id === person.id}
                  aria-label={`${t("root.enrollment.assign.remove")} ${person.fullName}`}
                  onClick={() => setRemoveTarget(person)}
                >
                  {t("root.enrollment.assign.remove")}
                </Button>
              ) : null}
            </div>
          ))}
        </Surface>
      )}

      {canManage && onTeachers ? (
        <>
          <AssignTeacherDialog open={addOpen} onOpenChange={setAddOpen} classId={classId} />
          <RemoveClassTeacherDialog
            open={removeTarget !== null}
            onOpenChange={(open) => {
              if (!open) setRemoveTarget(null);
            }}
            teacherName={removeTarget?.fullName ?? ""}
            isSubmitting={removing}
            onConfirm={confirmRemove}
          />
        </>
      ) : null}

      {canManage && !onTeachers ? (
        <>
          <AssignStudentDialog open={addOpen} onOpenChange={setAddOpen} classId={classId} />
          <RemoveClassStudentDialog
            open={removeTarget !== null}
            onOpenChange={(open) => {
              if (!open) setRemoveTarget(null);
            }}
            studentName={removeTarget?.fullName ?? ""}
            isSubmitting={removing}
            onConfirm={confirmRemove}
          />
        </>
      ) : null}
    </div>
  );
}
