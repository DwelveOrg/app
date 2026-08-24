"use client";

import { GraduationCap, Inbox, ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { StudentClassesResponse } from "@/app/(root)/_lib/enrollment.schemas";
import type { TeacherClassesResponse } from "@/app/(root)/_lib/teacher-requests.schemas";
import PanelDialog from "@/app/(root)/_components/PanelDialog";
import SchoolAccessTab from "./SchoolAccessTab";
import SchoolStudentsTab from "./SchoolStudentsTab";
import SchoolTeachersTab from "./SchoolTeachersTab";
import MyClassRequestsView from "../../groups/_components/MyClassRequestsView";
import StudentClassesView from "../../groups/_components/StudentClassesView";
import TeacherClassesView from "../../groups/_components/TeacherClassesView";

type SchoolDirectorySectionProps = {
  isAdmin: boolean;
  schoolId: string | undefined;
  role: SchoolRole;
  studentCount: number;
  teacherCount: number;
  requestCount?: number;
  studentClasses?: StudentClassesResponse;
  teacherClasses?: TeacherClassesResponse;
  viewerMemberId: string;
  viewerIsOwner: boolean;
  viewerCanManageAdmins: boolean;
};

export default function SchoolDirectorySection({
  isAdmin,
  schoolId,
  role,
  studentCount,
  teacherCount,
  requestCount,
  studentClasses,
  teacherClasses,
  viewerMemberId,
  viewerIsOwner,
  viewerCanManageAdmins,
}: SchoolDirectorySectionProps) {
  const { t } = useTranslation();

  /*
    The admin view used to end in a full copy of the Classes page — the same
    card grid, the same create button — one sidebar item away from the page
    that owns them. The duplicate is gone (owner's call): this page is the
    school itself — profile, people, invites, access — and the three
    management panels are its content, laid out as entry tiles rather than
    squeezed into a heading's toolbar.
  */
  if (isAdmin) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="type-section text-foreground">
          {t("root.schoolPage.people.title")}
        </h2>

        <div className="grid gap-2 sm:grid-cols-3">
          <PanelDialog
            icon={Users}
            label={t("root.schoolPage.tabs.teachers")}
            count={teacherCount}
            description={t("root.schoolPage.teachers.panelDescription")}
            size="lg"
            triggerClassName="w-full justify-start"
          >
            <SchoolTeachersTab schoolId={schoolId} />
          </PanelDialog>

          <PanelDialog
            icon={GraduationCap}
            label={t("root.schoolPage.tabs.students")}
            count={studentCount}
            description={t("root.schoolPage.students.panelDescription")}
            size="lg"
            triggerClassName="w-full justify-start"
          >
            <SchoolStudentsTab schoolId={schoolId} />
          </PanelDialog>

          {/* Who can do what, plus the two lists that decide who gets in:
              outstanding teacher invites and the blocklist. */}
          <PanelDialog
            icon={ShieldCheck}
            label={t("root.schoolPage.access.title")}
            description={t("root.schoolPage.access.panelDescription")}
            size="lg"
            triggerClassName="w-full justify-start"
          >
            <SchoolAccessTab
              schoolId={schoolId}
              viewerMemberId={viewerMemberId}
              viewerIsOwner={viewerIsOwner}
              viewerCanManageAdmins={viewerCanManageAdmins}
            />
          </PanelDialog>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="type-section text-foreground">
          {t("root.schoolPage.tabs.classes")}
        </h2>

        {role === "STUDENT" ? (
          <PanelDialog
            icon={Inbox}
            label={t("root.enrollment.requests.title")}
            count={requestCount}
            emphasis
            description={t("root.enrollment.requests.subtitle")}
            size="lg"
          >
            <MyClassRequestsView schoolId={schoolId} variant="embedded" />
          </PanelDialog>
        ) : null}
      </div>

      {role === "STUDENT" ? (
        <StudentClassesView
          schoolId={schoolId}
          initialData={studentClasses}
          variant="embedded"
        />
      ) : (
        <TeacherClassesView
          schoolId={schoolId}
          initialData={teacherClasses}
          variant="embedded"
        />
      )}
    </div>
  );
}
