"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useAddClassTeacherMutation, useAssignableTeachers } from "@/app/(root)/_hooks/useClassRoster";
import AssignMemberDialog, { type PickerPerson } from "./AssignMemberDialog";

type AssignTeacherDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  /** Refreshes the server-rendered class after the roster changes. */
  onAssigned: () => void;
};

/**
 * Assigns a school teacher to this class (`POST /classes/:classId/teachers`
 * with the `TeacherProfile.id`). Admin-only on both ends: the picker endpoint
 * and the assignment itself are refused for anyone else.
 */
export default function AssignTeacherDialog({
  open,
  onOpenChange,
  classId,
  onAssigned,
}: AssignTeacherDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const query = useAssignableTeachers({ classId, search, enabled: open });
  const addTeacher = useAddClassTeacherMutation(classId);

  const people = useMemo<PickerPerson[]>(
    () =>
      query.data?.pages.flatMap((page) =>
        page.teachers.map((teacher) => ({
          id: teacher.id,
          fullName: teacher.fullName,
          email: teacher.email,
        })),
      ) ?? [],
    [query.data?.pages],
  );

  const handleAdd = (person: PickerPerson) => {
    addTeacher.mutate(
      { classId, teacherId: person.id },
      {
        onSuccess: () => {
          toast.success(
            t("root.enrollment.assignTeacher.assignedToast", { name: person.fullName }),
          );
          onAssigned();
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
      title={t("root.enrollment.assignTeacher.title")}
      description={t("root.enrollment.assignTeacher.description")}
      searchPlaceholder={t("root.enrollment.assignTeacher.searchPlaceholder")}
      addLabel={t("root.enrollment.assign.add")}
      noResultsLabel={t("root.enrollment.assignTeacher.noResults")}
      emptyLabel={t("root.enrollment.assignTeacher.allAssigned")}
      people={people}
      isLoading={query.isLoading}
      isError={query.isError}
      hasMore={Boolean(query.hasNextPage)}
      isFetchingMore={query.isFetchingNextPage}
      onLoadMore={() => query.fetchNextPage()}
      onRetry={() => query.refetch()}
      onSearchChange={setSearch}
      onAdd={handleAdd}
      addingId={addTeacher.isPending ? addTeacher.variables?.teacherId : undefined}
    />
  );
}
