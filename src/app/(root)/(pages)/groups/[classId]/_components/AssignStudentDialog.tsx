"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import type { StudentItem } from "@/app/(root)/_lib/students.schemas";
import { useAssignStudentMutation } from "@/app/(root)/_hooks/useEnrollment";
import Dialog from "@/app/(root)/_components/Dialog";

type AssignStudentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  students: StudentItem[];
  enrolledStudentIds: string[];
  onAssigned: () => void;
};

/**
 * Admin picker to directly assign a school student to a class
 * (`POST /classes/:classId/students`). `studentId` is the `StudentProfile.id`.
 * Students already on the roster are filtered out; assignment is idempotent on
 * the backend, so a just-assigned student is removed from the list immediately.
 */
export default function AssignStudentDialog({
  open,
  onOpenChange,
  classId,
  students,
  enrolledStudentIds,
  onAssigned,
}: AssignStudentDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [assignedIds, setAssignedIds] = useState<Set<string>>(() => new Set());
  const assignStudent = useAssignStudentMutation();

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      setSearch("");
      setAssignedIds(new Set());
    }
  };

  const assignable = useMemo(() => {
    const enrolled = new Set(enrolledStudentIds);
    const term = search.trim().toLowerCase();
    return students.filter((student) => {
      if (enrolled.has(student.id) || assignedIds.has(student.id)) return false;
      if (!term) return true;
      return (
        student.fullName.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term)
      );
    });
  }, [students, enrolledStudentIds, assignedIds, search]);

  const handleAssign = (student: StudentItem) => {
    assignStudent.mutate(
      { classId, studentId: student.id },
      {
        onSuccess: () => {
          setAssignedIds((current) => new Set(current).add(student.id));
          toast.success(
            t("root.enrollment.assign.assignedToast", { name: student.fullName }),
          );
          onAssigned();
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t("root.enrollment.errorGeneric")),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.enrollment.assign.title")}
      description={t("root.enrollment.assign.description")}
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("root.enrollment.assign.searchPlaceholder")}
            aria-label={t("root.enrollment.assign.searchPlaceholder")}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {assignable.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {search
              ? t("root.enrollment.assign.noResults")
              : t("root.enrollment.assign.allAssigned")}
          </p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {assignable.map((student) => {
              const isAssigning =
                assignStudent.isPending && assignStudent.variables?.studentId === student.id;
              return (
                <li
                  key={student.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted"
                >
                  <Avatar name={student.fullName} size="sm" tint="seeded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {student.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={isAssigning}
                    onClick={() => handleAssign(student)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {t("root.enrollment.assign.add")}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
