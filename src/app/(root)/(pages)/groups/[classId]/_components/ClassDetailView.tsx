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
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  UserCog,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { ApiClass } from "@/app/(root)/_lib/classes.schemas";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/badge";
import EntityHeader from "@/app/(root)/_components/EntityHeader";
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
import ClassRequestsButton from "./ClassRequestsButton";
import ClassRequestsSection from "./ClassRequestsSection";
import ClassRosterSection from "./ClassRosterSection";

type ClassDetailViewProps = {
  classItem: ApiClass;
  isAdmin: boolean;
  viewerRole: SchoolRole | null;
};

/**
 * The class page: identity first, then an overview of the class facts, who is
 * in it, and — for staff — the requests waiting on a decision. Every action the
 * viewer is allowed is reachable from here; nothing that matters hides behind a
 * single-item overflow menu, and the backend still authorizes every mutation.
 */
export default function ClassDetailView({
  classItem,
  isAdmin,
  viewerRole,
}: ClassDetailViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Only teachers assigned to this class can load it at all (the backend 404s
  // for the rest), so a teacher here manages its roster and student requests.
  const canManage = isAdmin || viewerRole === "TEACHER";

  const teacherCount = classItem.counts?.teachers ?? classItem.teachers.length;
  const studentCount = classItem.counts?.students ?? classItem.students.length;
  const leadTeacher = classItem.teachers[0]?.fullName ?? null;
  const accent = classAccent(classItem.id);
  const capacity = classItem.capacity ?? null;

  const notifySoon = (labelKey: string) =>
    toast.info(t("root.classDetail.actions.comingSoon", { action: t(labelKey) }));

  /** Roster and request changes affect this server-rendered page and the caches. */
  const refreshClassData = () => {
    router.refresh();
    void queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.all });
  };

  return (
    <section className="flex flex-col gap-6 py-6">
      <Link
        href="/groups"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("root.classDetail.back")}
      </Link>

      {/* Identity + overview: what this class is, before any action. */}
      <EntityHeader
        name={classItem.name}
        imageUrl={classItem.pictureUrl}
        tileClassName={accent}
        tileSize="xl"
        headingId="class-identity-heading"
        status={{
          active: classItem.isActive,
          label: classItem.isActive
            ? t("root.classes.status.active")
            : t("root.classes.status.archived"),
        }}
        description={classItem.description || t("root.classDetail.noDescription")}
        meta={
          viewerRole ? (
            <Badge variant="outline">
              {t("root.schoolPage.viewingAs", {
                role: t(`root.schoolPage.roles.${viewerRole.toLowerCase()}`),
              })}
            </Badge>
          ) : null
        }
        actions={
          canManage ? (
            <>
              <ClassRequestsButton classId={classItem.id} isAdmin={isAdmin} />

              {/* Teachers author tests too, so this is not admin-only. */}
              <Button variant="outline" size="lg" asChild>
                <Link href={`/groups/${classItem.id}/tests`}>
                  <FileText className="size-4" />
                  {t("root.classDetail.actions.addTest")}
                </Link>
              </Button>

              {isAdmin ? (
                <>
                  <Button variant="outline" size="lg" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" />
                    {t("root.classDetail.actions.edit")}
                  </Button>

                  {/* Two independent actions, so the menu earns its place. */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="lg" variant="ghost" aria-label={t("root.classDetail.actions.more")}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onSelect={() => notifySoon("root.classDetail.actions.addExam")}
                      >
                        <GraduationCap className="size-4" />
                        {t("root.classDetail.actions.addExam")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setDeleteOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        {t("root.classDetail.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : null}
            </>
          ) : null
        }
      >
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
      </EntityHeader>

      <ClassRosterSection
        classId={classItem.id}
        teachers={classItem.teachers}
        students={classItem.students}
        teacherCount={teacherCount}
        studentCount={studentCount}
        canManageTeachers={isAdmin}
        canManageStudents={canManage}
        onRosterChange={refreshClassData}
      />

      {canManage ? (
        <ClassRequestsSection
          classId={classItem.id}
          isAdmin={isAdmin}
          onReviewed={refreshClassData}
        />
      ) : null}

      {isAdmin ? (
        <>
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
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <dt className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-foreground">{value}</dd>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
