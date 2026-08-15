"use client";

import { useState } from "react";
import { GraduationCap, Inbox, Plus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import type { SchoolRosterMember } from "@/app/(authentication)/_lib/api.schemas";
import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { StudentItem } from "@/app/(root)/_lib/students.schemas";
import type { StudentClassesResponse } from "@/app/(root)/_lib/enrollment.schemas";
import type { TeacherClassesResponse } from "@/app/(root)/_lib/teacher-requests.schemas";
import PanelDialog from "@/app/(root)/_components/PanelDialog";
import Empty from "../../_components/ui/Empty";
import ClassGrid from "../../groups/_components/ClassGrid";
import type { ClassItem } from "../../groups/_types";
import CreateClassDialog from "./CreateClassDialog";
import SchoolStudentsTab from "./SchoolStudentsTab";
import SchoolTeachersTab from "./SchoolTeachersTab";
import MyClassRequestsView from "../../groups/_components/MyClassRequestsView";
import StudentClassesView from "../../groups/_components/StudentClassesView";
import TeacherClassesView from "../../groups/_components/TeacherClassesView";

type SchoolDirectorySectionProps = {
  classItems: ClassItem[];
  students: StudentItem[];
  teachers: SchoolRosterMember[];
  teachersError: boolean;
  isAdmin: boolean;
  schoolId: string | undefined;
  role: SchoolRole;
  requestCount?: number;
  studentClasses?: StudentClassesResponse;
  teacherClasses?: TeacherClassesResponse;
};

export default function SchoolDirectorySection({
  classItems,
  students,
  teachers,
  teachersError,
  isAdmin,
  schoolId,
  role,
  requestCount,
  studentClasses,
  teacherClasses,
}: SchoolDirectorySectionProps) {
  const { t } = useTranslation();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="type-section text-foreground">
          {t("root.schoolPage.tabs.classes")}
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <PanelDialog
                icon={Users}
                label={t("root.schoolPage.tabs.teachers")}
                count={teachersError ? undefined : teachers.length}
                description={t("root.schoolPage.teachers.panelDescription")}
                size="lg"
              >
                <SchoolTeachersTab teachers={teachers} hasError={teachersError} />
              </PanelDialog>

              <PanelDialog
                icon={GraduationCap}
                label={t("root.schoolPage.tabs.students")}
                count={students.length}
                description={t("root.schoolPage.students.panelDescription")}
                size="lg"
              >
                <SchoolStudentsTab students={students} />
              </PanelDialog>
            </>
          ) : null}

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

          {isAdmin ? (
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("root.schoolPage.actions.createClass")}
            </Button>
          ) : null}
        </div>
      </div>

      {role === "STUDENT" ? (
        <StudentClassesView
          schoolId={schoolId}
          initialData={studentClasses}
          variant="embedded"
        />
      ) : role === "TEACHER" ? (
        <TeacherClassesView
          schoolId={schoolId}
          initialData={teacherClasses}
          variant="embedded"
        />
      ) : classItems.length > 0 ? (
        <ClassGrid items={classItems} />
      ) : (
        <Empty
          title={t("root.schoolPage.directory.emptyTitle")}
          description={
            isAdmin
              ? t("root.schoolPage.directory.emptyAdmin")
              : t("root.schoolPage.directory.emptyMember")
          }
        />
      )}

      {isAdmin ? <CreateClassDialog open={createOpen} onOpenChange={setCreateOpen} /> : null}
    </div>
  );
}
