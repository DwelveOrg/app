"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  DoorOpen,
  FileText,
  LogOut,
  Pencil,
  Trash2,
  Users,
  UserCog,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { ApiClass } from "@/app/(root)/_lib/classes.schemas";
import { Button } from "@/components/ui/Button";
import EntityHeader from "@/app/(root)/_components/EntityHeader";
import FactGrid, { Fact } from "@/app/(root)/_components/FactGrid";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { classAccent } from "../../_constants";
import { enrollmentModeLabelKeys } from "../../_lib/enrollmentLabels";
import EditClassDialog from "../../_components/EditClassDialog";
import DeleteClassDialog from "../../_components/DeleteClassDialog";
import ClassRequestsButton from "./ClassRequestsButton";
import ClassRequestsSection from "./ClassRequestsSection";
import ClassRosterSection from "./ClassRosterSection";
import LeaveClassDialog from "./LeaveClassDialog";

type ClassDetailViewProps = {
  classItem: ApiClass;
  isAdmin: boolean;
  viewerRole: SchoolRole | null;
  /** The selected school, for the caches a self-leave has to invalidate. */
  schoolId: string | undefined;
};

/**
 * The class page: identity first, then an overview of the class facts, who is
 * in it, and — for staff — the requests waiting on a decision.
 *
 * Every action the viewer is allowed is a direct, labelled control in the
 * header. There is no overflow menu: a three-dot button that hides two items
 * costs a click and a guess to reach what a visible button states outright, and
 * the actions it used to hold are either shown here or reachable from the page
 * they belong to. The backend still authorizes every mutation.
 */
export default function ClassDetailView({
  classItem,
  isAdmin,
  viewerRole,
  schoolId,
}: ClassDetailViewProps) {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // Only teachers assigned to this class can load it at all (the backend 404s
  // for the rest), so a teacher here manages its roster and student requests.
  const canManage = isAdmin || viewerRole === "TEACHER";

  // Leaving is self-service and only ever acts on the viewer's own membership.
  // Admins are not class members, so they get the roster controls instead — the
  // backend rejects the endpoint for them either way. Narrowed to the two roles
  // that can leave rather than cast at the call site, so an added role has to be
  // considered here instead of silently inheriting a leave button.
  const leaveRole =
    viewerRole === "STUDENT" || viewerRole === "TEACHER" ? viewerRole : null;

  const teacherCount = classItem.counts?.teachers ?? classItem.teachers.length;
  const studentCount = classItem.counts?.students ?? classItem.students.length;
  const leadTeacher = classItem.teachers[0]?.fullName ?? null;
  const accent = classAccent(classItem.id);
  const capacity = classItem.capacity ?? null;

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
        actions={
          // A viewer with no role at all gets no action row rather than an
          // empty flex item between the description and the fact grid.
          canManage || leaveRole ? (
            <>
              {canManage ? (
                <>
                  <ClassRequestsButton classId={classItem.id} isAdmin={isAdmin} />

                  {/* Teachers author tests too, so this is not admin-only. */}
                  <Button variant="outline" size="lg" asChild>
                    <Link href={`/groups/${classItem.id}/tests`}>
                      <FileText className="size-4" />
                      {t("root.classDetail.actions.addTest")}
                    </Link>
                  </Button>
                </>
              ) : null}

              {isAdmin ? (
                <>
                  <Button variant="outline" size="lg" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" />
                    {t("root.classDetail.actions.edit")}
                  </Button>

                  {/* Same treatment as deleting a school, so the most destructive
                      action on an entity page looks the same wherever it appears. */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t("root.classDetail.actions.delete")}
                    title={t("root.classDetail.actions.delete")}
                    onClick={() => setDeleteOpen(true)}
                    className="text-muted-foreground hover:border-[color-mix(in_srgb,var(--destructive)_35%,transparent)] hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              ) : null}

              {leaveRole ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setLeaveOpen(true)}
                  className="text-muted-foreground hover:border-[color-mix(in_srgb,var(--destructive)_35%,transparent)] hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  {t("root.classDetail.actions.leave")}
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        <h2 id="class-overview-heading" className="sr-only">
          {t("root.classDetail.overview.title")}
        </h2>
        <FactGrid className="mt-6">
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
        </FactGrid>
      </EntityHeader>

      <ClassRosterSection
        classId={classItem.id}
        teachers={classItem.teachers}
        students={classItem.students}
        teacherCount={teacherCount}
        studentCount={studentCount}
        canManageTeachers={isAdmin}
        canManageStudents={canManage}
      />

      {canManage ? (
        <ClassRequestsSection classId={classItem.id} isAdmin={isAdmin} />
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

      {leaveRole ? (
        <LeaveClassDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          classId={classItem.id}
          className={classItem.name}
          schoolId={schoolId}
          viewerRole={leaveRole}
        />
      ) : null}
    </section>
  );
}
