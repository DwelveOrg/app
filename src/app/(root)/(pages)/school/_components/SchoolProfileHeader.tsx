"use client";

import { useState } from "react";
import { ChevronDown, LogOut, MapPin, Pencil, Trash2, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InviteTeacherDialog from "./InviteTeacherDialog";
import AddStudentsDialog from "./AddStudentsDialog";
import EditSchoolDialog from "./EditSchoolDialog";
import DeleteSchoolDialog from "./DeleteSchoolDialog";
import LeaveSchoolDialog from "./LeaveSchoolDialog";

type SchoolProfileHeaderProps = {
  name: string;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  isActive?: boolean;
  classCount: number;
  studentCount: number;
  teacherCount: number;
  isAdmin: boolean;
  role: SchoolRole | null;
  studentJoinCode?: string | null;
};

const ROLE_LABEL_KEYS: Record<SchoolRole, string> = {
  ADMIN: "root.schoolPage.roles.admin",
  TEACHER: "root.schoolPage.roles.teacher",
  STUDENT: "root.schoolPage.roles.student",
};

export default function SchoolProfileHeader({
  name,
  description,
  country,
  city,
  logoUrl,
  location,
  isActive,
  classCount,
  studentCount,
  teacherCount,
  isAdmin,
  role,
  studentJoinCode,
}: SchoolProfileHeaderProps) {
  const { t } = useTranslation();
  const [editOpen, setEditOpen] = useState(false);
  const [inviteTeacherOpen, setInviteTeacherOpen] = useState(false);
  const [addStudentsOpen, setAddStudentsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const initial = name.charAt(0).toUpperCase() || "S";

  const stats = [
    { key: "classes", dot: "bg-[var(--primary)]", value: classCount, label: t("root.classes.stats.classes") },
    { key: "students", dot: "bg-success", value: studentCount, label: t("root.classes.stats.students") },
    { key: "teachers", dot: "bg-warning", value: teacherCount, label: t("root.classes.stats.teachers") },
  ];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-xl font-bold text-[var(--primary-foreground)]">
          {initial}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold text-[var(--foreground)] sm:text-2xl">{name}</h1>
            {isActive !== undefined && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isActive
                    ? "bg-success/12 text-success-text"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                }`}
              >
                {isActive ? t("root.schoolPage.active") : t("root.schoolPage.inactive")}
              </span>
            )}
          </div>

          {description ? (
            <p className="mt-1 max-w-prose text-sm text-[var(--muted-foreground)]">{description}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--muted-foreground)]">
            {stats.map((stat) => (
              <span key={stat.key} className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
                <span className="font-semibold text-[var(--foreground)]">{stat.value}</span>
                {stat.label}
              </span>
            ))}
            {location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
            ) : null}
          </div>
        </div>

        {/* Admins get management controls; everyone else sees a read-only chip. */}
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              {t("root.schoolPage.actions.edit")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg">
                  <UserPlus className="h-4 w-4" />
                  {t("root.schoolPage.actions.invite")}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => setInviteTeacherOpen(true)}>
                  {t("root.schoolPage.invite.menuTeacher")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setAddStudentsOpen(true)}>
                  {t("root.schoolPage.invite.menuStudents")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("root.schoolPage.actions.delete")}
              title={t("root.schoolPage.actions.delete")}
              onClick={() => setDeleteOpen(true)}
              className="text-[var(--muted-foreground)] hover:border-[color-mix(in_srgb,var(--destructive)_35%,transparent)] hover:text-[var(--destructive)]"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : role ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
              {t("root.schoolPage.viewingAs", { role: t(ROLE_LABEL_KEYS[role]) })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setLeaveOpen(true)}
              className="text-[var(--muted-foreground)] hover:border-[color-mix(in_srgb,var(--destructive)_35%,transparent)] hover:text-[var(--destructive)]"
            >
              <LogOut className="h-4 w-4" />
              {t("root.schoolPage.actions.leave")}
            </Button>
          </div>
        ) : null}
      </div>

      {isAdmin ? (
        <>
          <EditSchoolDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            school={{ name, description, country, city, logoUrl }}
          />
          <InviteTeacherDialog open={inviteTeacherOpen} onOpenChange={setInviteTeacherOpen} />
          <AddStudentsDialog
            open={addStudentsOpen}
            onOpenChange={setAddStudentsOpen}
            studentJoinCode={studentJoinCode}
          />
          <DeleteSchoolDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            schoolName={name}
          />
        </>
      ) : null}

      {!isAdmin && role ? (
        <LeaveSchoolDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          schoolName={name}
        />
      ) : null}
    </section>
  );
}
