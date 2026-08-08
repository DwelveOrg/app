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
import EntityHeader from "@/app/(root)/_components/EntityHeader";
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

  const stats = [
    { key: "classes", dot: "bg-primary", value: classCount, label: t("root.classes.stats.classes") },
    { key: "students", dot: "bg-success", value: studentCount, label: t("root.classes.stats.students") },
    { key: "teachers", dot: "bg-warning", value: teacherCount, label: t("root.classes.stats.teachers") },
  ];

  return (
    <EntityHeader
      name={name}
      imageUrl={logoUrl}
      tileClassName="bg-primary text-primary-foreground"
      tileSize="lg"
      headingId="school-identity-heading"
      status={
        isActive === undefined
          ? undefined
          : {
              active: isActive,
              label: isActive ? t("root.schoolPage.active") : t("root.schoolPage.inactive"),
            }
      }
      description={description}
      meta={
        <>
          {stats.map((stat) => (
            <span key={stat.key} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={`size-1.5 rounded-full ${stat.dot}`} />
              <span className="font-semibold text-foreground">{stat.value}</span>
              {stat.label}
            </span>
          ))}
          {location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-3.5" />
              {location}
            </span>
          ) : null}
        </>
      }
      actions={
        /* Admins get management controls; a teacher or student gets the one
           action they actually have here. The role is not announced back to the
           user — the controls on the page already say what they can do. */
        isAdmin ? (
          <>
            <Button type="button" variant="outline" size="lg" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              {t("root.schoolPage.actions.edit")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg">
                  <UserPlus className="size-4" />
                  {t("root.schoolPage.actions.invite")}
                  <ChevronDown className="size-4" />
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
              className="text-muted-foreground hover:border-[color-mix(in_srgb,var(--destructive)_35%,transparent)] hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        ) : role ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setLeaveOpen(true)}
            className="text-muted-foreground hover:border-[color-mix(in_srgb,var(--destructive)_35%,transparent)] hover:text-destructive"
          >
            <LogOut className="size-4" />
            {t("root.schoolPage.actions.leave")}
          </Button>
        ) : null
      }
    >
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
          <DeleteSchoolDialog open={deleteOpen} onOpenChange={setDeleteOpen} schoolName={name} />
        </>
      ) : null}

      {!isAdmin && role ? (
        <LeaveSchoolDialog open={leaveOpen} onOpenChange={setLeaveOpen} schoolName={name} />
      ) : null}
    </EntityHeader>
  );
}
