"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  DoorOpen,
  FileText,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  UserCog,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { ApiClass, ApiClassPerson } from "@/app/(root)/_lib/classes.schemas";
import type { StudentItem } from "@/app/(root)/_lib/students.schemas";
import { useRemoveStudentMutation } from "@/app/(root)/_hooks/useEnrollment";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryKeys } from "@/lib/query/keys";
import { classAccent } from "../../_constants";
import { enrollmentModeLabelKeys } from "../../_lib/enrollmentLabels";
import EditClassDialog from "../../_components/EditClassDialog";
import DeleteClassDialog from "../../_components/DeleteClassDialog";
import AssignStudentDialog from "./AssignStudentDialog";
import ClassRequestsSection from "./ClassRequestsSection";
import RemoveClassStudentDialog from "./RemoveClassStudentDialog";

type ClassDetailViewProps = {
  classItem: ApiClass;
  isAdmin: boolean;
  viewerRole: SchoolRole | null;
  /** Assignable school students, admin-only; empty for teachers/students. */
  students: StudentItem[];
};

/**
 * The class page: identity first, then an overview of the class facts, the
 * people in it, and (for staff) the pending join requests. Which controls
 * render follows the viewer's role, but the backend remains the authorization
 * boundary — every mutation is enforced there.
 */
export default function ClassDetailView({
  classItem,
  isAdmin,
  viewerRole,
  students,
}: ClassDetailViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ApiClassPerson | null>(null);
  const removeStudent = useRemoveStudentMutation();

  // Teachers may manage rosters/requests for their assigned classes too, but
  // the school-wide student picker relies on the admin-only `GET /students`.
  const canManage = isAdmin || viewerRole === "TEACHER";

  const teacherCount = classItem.counts?.teachers ?? classItem.teachers.length;
  const studentCount = classItem.counts?.students ?? classItem.students.length;
  const leadTeacher = classItem.teachers[0]?.fullName ?? null;
  const initial = classItem.name.charAt(0).toUpperCase();
  const accent = classAccent(classItem.id);
  const capacity = classItem.capacity ?? null;

  const notifySoon = (labelKey: string) =>
    toast.info(t("root.classDetail.actions.comingSoon", { action: t(labelKey) }));

  /** Roster changes affect the server-rendered class and the cached lists. */
  const refreshClassData = () => {
    router.refresh();
    void queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.all });
  };

  const handleRemoveStudent = () => {
    if (!removeTarget) return;
    const { id: studentProfileId, fullName } = removeTarget;
    removeStudent.mutate(
      { classId: classItem.id, studentId: studentProfileId },
      {
        onSuccess: () => {
          setRemoveTarget(null);
          toast.success(t("root.enrollment.assign.removedToast", { name: fullName }));
          refreshClassData();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
      },
    );
  };

  return (
    <section className="flex flex-col gap-6 py-6">
      <Link
        href="/groups"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("root.classDetail.back")}
      </Link>

      {/* Identity + overview: what this class is, before any action. */}
      <section
        aria-labelledby="class-identity-heading"
        className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-start gap-4">
          {classItem.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={classItem.pictureUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span
              className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold ${accent}`}
            >
              {initial}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                id="class-identity-heading"
                className="truncate text-xl font-bold text-[var(--foreground)] sm:text-2xl"
              >
                {classItem.name}
              </h1>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  classItem.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                {classItem.isActive
                  ? t("root.classes.status.active")
                  : t("root.classes.status.archived")}
              </span>
            </div>

            <p className="mt-1 max-w-prose text-sm text-[var(--muted-foreground)]">
              {classItem.description || t("root.classDetail.noDescription")}
            </p>

            {viewerRole ? (
              <p className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                {t("root.schoolPage.viewingAs", {
                  role: t(`root.schoolPage.roles.${viewerRole.toLowerCase()}`),
                })}
              </p>
            ) : null}
          </div>

          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <>
                  <Button variant="outline" size="lg" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4" />
                    {t("root.classDetail.actions.edit")}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="lg">
                        <MoreHorizontal className="h-4 w-4" />
                        {t("root.classDetail.actions.more")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onSelect={() => notifySoon("root.classDetail.actions.addTest")}
                      >
                        <FileText className="h-4 w-4" />
                        {t("root.classDetail.actions.addTest")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => notifySoon("root.classDetail.actions.addExam")}
                      >
                        <GraduationCap className="h-4 w-4" />
                        {t("root.classDetail.actions.addExam")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setDeleteOpen(true)}
                        className="text-[var(--destructive)] focus:text-[var(--destructive)]"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("root.classDetail.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <h2 id="class-overview-heading" className="sr-only">
          {t("root.classDetail.overview.title")}
        </h2>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact
            icon={<UserCog className="h-4 w-4" />}
            label={t("root.classDetail.overview.teacher")}
            value={leadTeacher ?? t("root.classes.card.noTeacher")}
            hint={
              teacherCount > 1
                ? t("root.classDetail.overview.moreTeachers", { count: teacherCount - 1 })
                : undefined
            }
          />
          <Fact
            icon={<Users className="h-4 w-4" />}
            label={t("root.classDetail.overview.participants")}
            value={
              capacity != null
                ? t("root.enrollment.directory.seats", {
                    count: studentCount,
                    capacity,
                  })
                : t("root.enrollment.directory.enrolledCount", { count: studentCount })
            }
            hint={
              capacity != null && studentCount >= capacity
                ? t("root.enrollment.directory.classFull")
                : undefined
            }
          />
          <Fact
            icon={<DoorOpen className="h-4 w-4" />}
            label={t("root.classDetail.overview.enrollment")}
            value={
              classItem.enrollmentMode
                ? t(enrollmentModeLabelKeys[classItem.enrollmentMode])
                : "—"
            }
          />
          <Fact
            icon={<CalendarDays className="h-4 w-4" />}
            label={t("root.classDetail.overview.created")}
            value={classItem.createdAt ? <RelativeTime date={classItem.createdAt} /> : "—"}
          />
        </dl>
      </section>

      <section aria-labelledby="class-people-heading" className="flex flex-col gap-4">
        <h2 id="class-people-heading" className="sr-only">
          {t("root.classDetail.people.title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PeopleCard
            title={t("root.classDetail.teachers.title", { count: teacherCount })}
            emptyLabel={t("root.classDetail.teachers.empty")}
            icon={<UserCog className="h-4 w-4" />}
            people={classItem.teachers}
          />
          <PeopleCard
            title={t("root.classDetail.students.title", { count: studentCount })}
            emptyLabel={t("root.classDetail.students.empty")}
            icon={<Users className="h-4 w-4" />}
            people={classItem.students}
            headerAction={
              isAdmin ? (
                <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" />
                  {t("root.enrollment.assign.add")}
                </Button>
              ) : null
            }
            onRemove={canManage ? (person) => setRemoveTarget(person) : undefined}
            removingId={
              removeStudent.isPending ? removeStudent.variables?.studentId : undefined
            }
            removeLabel={t("root.enrollment.assign.remove")}
          />
        </div>
      </section>

      {canManage ? <ClassRequestsSection classId={classItem.id} /> : null}

      {canManage ? (
        <RemoveClassStudentDialog
          open={removeTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRemoveTarget(null);
          }}
          studentName={removeTarget?.fullName ?? ""}
          isSubmitting={removeStudent.isPending}
          onConfirm={handleRemoveStudent}
        />
      ) : null}

      {isAdmin ? (
        <>
          <AssignStudentDialog
            open={assignOpen}
            onOpenChange={setAssignOpen}
            classId={classItem.id}
            students={students}
            enrolledStudentIds={classItem.students.map((person) => person.id)}
            onAssigned={refreshClassData}
          />
          <EditClassDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            classInfo={{
              id: classItem.id,
              name: classItem.name,
              description: classItem.description ?? null,
              pictureUrl: classItem.pictureUrl ?? null,
            }}
          />
          <DeleteClassDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            classId={classItem.id}
            className={classItem.name}
            redirectOnSuccess="/groups"
          />
        </>
      ) : null}
    </section>
  );
}

type FactProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
};

/** One labelled class fact in the overview grid. */
function Fact({ icon, label, value, hint }: FactProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
      <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
        <span className="text-[var(--muted-foreground)]">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">{value}</dd>
      {hint ? <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{hint}</p> : null}
    </div>
  );
}

type PeopleCardProps = {
  title: string;
  emptyLabel: string;
  icon: React.ReactNode;
  people: ApiClassPerson[];
  /** Optional control rendered on the right of the card header (e.g. Add). */
  headerAction?: React.ReactNode;
  /** When provided, each row gets a Remove button that calls this. */
  onRemove?: (person: ApiClassPerson) => void;
  /** `StudentProfile.id` currently being removed, for the row spinner. */
  removingId?: string;
  removeLabel?: string;
};

function PeopleCard({
  title,
  emptyLabel,
  icon,
  people,
  headerAction,
  onRemove,
  removingId,
  removeLabel,
}: PeopleCardProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)]">
        <span className="text-[var(--muted-foreground)]">{icon}</span>
        {title}
        {headerAction ? <div className="ml-auto">{headerAction}</div> : null}
      </div>
      {people.length === 0 ? (
        <div className="px-5 py-6 text-sm text-[var(--muted-foreground)]">{emptyLabel}</div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {people.map((person) => {
            const isRemoving = removingId === person.id;
            return (
              <li key={person.id} className="flex items-center gap-3 px-5 py-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
                  {person.fullName.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[var(--foreground)]">
                    {person.fullName}
                  </div>
                  {person.email ? (
                    <div className="truncate text-xs text-[var(--muted-foreground)]">
                      {person.email}
                    </div>
                  ) : null}
                </div>
                {onRemove ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                    disabled={isRemoving}
                    aria-busy={isRemoving}
                    aria-label={`${removeLabel ?? t("root.enrollment.assign.remove")} ${person.fullName}`}
                    onClick={() => onRemove(person)}
                  >
                    {isRemoving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      (removeLabel ?? t("root.enrollment.assign.remove"))
                    )}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
