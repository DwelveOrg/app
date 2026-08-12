"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useAssignableStudents, useAddClassStudentMutation } from "@/app/(root)/_hooks/useClassRoster";
import AssignMemberDialog, { type PickerPerson } from "./AssignMemberDialog";

type AssignStudentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
};

/**
 * Adds a school student to this class (`POST /classes/:classId/students` with
 * the `StudentProfile.id`). Candidates come from the class-scoped
 * `assignable-students` picker, which admins and teachers assigned to the class
 * may both read — unlike the school-wide `GET /students`, which is admin-only.
 */
export default function AssignStudentDialog({
  open,
  onOpenChange,
  classId,
}: AssignStudentDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  // The picker only runs while the dialog is open, so opening a class page does
  // not fetch a roster the user never asked for.
  const query = useAssignableStudents({ classId, search, enabled: open });
  const addStudent = useAddClassStudentMutation(classId);

  const people = useMemo<PickerPerson[]>(
    () =>
      query.data?.pages.flatMap((page) =>
        page.students.map((student) => ({
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          hint: student.studentCode,
        })),
      ) ?? [],
    [query.data?.pages],
  );

  const handleAdd = (person: PickerPerson) => {
    addStudent.mutate(
      { classId, studentId: person.id },
      {
        onSuccess: () => {
          toast.success(
            t("root.enrollment.assign.assignedToast", { name: person.fullName }),
          );
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  return (
    <AssignMemberDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("root.enrollment.assign.title")}
      description={t("root.enrollment.assign.description")}
      searchPlaceholder={t("root.enrollment.assign.searchPlaceholder")}
      addLabel={t("root.enrollment.assign.add")}
      noResultsLabel={t("root.enrollment.assign.noResults")}
      emptyLabel={t("root.enrollment.assign.allAssigned")}
      people={people}
      isLoading={query.isLoading}
      isError={query.isError}
      hasMore={Boolean(query.hasNextPage)}
      isFetchingMore={query.isFetchingNextPage}
      onLoadMore={() => query.fetchNextPage()}
      onRetry={() => query.refetch()}
      onSearchChange={setSearch}
      onAdd={handleAdd}
      addingId={addStudent.isPending ? addStudent.variables?.studentId : undefined}
    />
  );
}
