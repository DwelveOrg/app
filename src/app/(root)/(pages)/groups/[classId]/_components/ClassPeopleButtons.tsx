"use client";

import { GraduationCap, UserCog } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ApiClassPerson } from "@/app/(root)/_lib/classes.schemas";
import PanelDialog from "@/app/(root)/_components/PanelDialog";
import ClassRosterList from "./ClassRosterList";

export default function ClassPeopleButtons({
  classId,
  teachers,
  students,
  teacherCount,
  studentCount,
  canManageTeachers,
  canManageStudents,
}: {
  classId: string;
  teachers: ApiClassPerson[];
  students: ApiClassPerson[];
  teacherCount: number;
  studentCount: number;
  canManageTeachers: boolean;
  canManageStudents: boolean;
}) {
  const { t } = useTranslation();

  return (
    <>
      <PanelDialog
        icon={UserCog}
        label={t("root.classDetail.teachers.tab")}
        count={teacherCount}
        description={t("root.classDetail.teachers.panelDescription")}
      >
        <ClassRosterList
          classId={classId}
          people={teachers}
          kind="teachers"
          canManage={canManageTeachers}
        />
      </PanelDialog>

      <PanelDialog
        icon={GraduationCap}
        label={t("root.classDetail.students.tab")}
        count={studentCount}
        description={t("root.classDetail.students.panelDescription")}
      >
        <ClassRosterList
          classId={classId}
          people={students}
          kind="students"
          canManage={canManageStudents}
        />
      </PanelDialog>
    </>
  );
}
