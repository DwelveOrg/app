"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import type { SchoolRosterMember } from "@/app/(authentication)/_lib/api.schemas";
import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { StudentItem } from "@/app/(root)/_lib/students.schemas";
import Empty from "../../_components/ui/Empty";
import ClassGrid from "../../groups/_components/ClassGrid";
import type { ClassItem } from "../../groups/_types";
import CreateClassDialog from "./CreateClassDialog";
import SchoolStudentsTab from "./SchoolStudentsTab";
import SchoolTeachersTab from "./SchoolTeachersTab";
import StudentClassesView from "../../groups/_components/StudentClassesView";
import TeacherClassesView from "../../groups/_components/TeacherClassesView";
import TabBar from "@/components/ui/TabBar";

type TabKey = "classes" | "teachers" | "students";

type SchoolTabsSectionProps = {
  classItems: ClassItem[];
  students: StudentItem[];
  /** School members with `role === "TEACHER"`; admin-only, empty otherwise. */
  teachers: SchoolRosterMember[];
  /** True when the members request failed, so the roster shows a retry state. */
  teachersError: boolean;
  isAdmin: boolean;
  schoolId: string | undefined;
  role: SchoolRole;
};

/**
 * Tab row for the School page. "Classes" and (for admins) "Teachers" and
 * "Students" are real tabs; "Courses" and "Groups" stay as disabled "soon"
 * placeholders. The Teachers tab reads `GET /schools/:schoolId/members` and the
 * Students tab `GET /students` — both admin-only, so teachers and students
 * never see the tabs and no roster row is rendered for them.
 */
export default function SchoolTabsSection({
  classItems,
  students,
  teachers,
  teachersError,
  isAdmin,
  schoolId,
  role,
}: SchoolTabsSectionProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("classes");
  const [createOpen, setCreateOpen] = useState(false);

  const softTabs = [
    { key: "courses", label: t("root.schoolPage.tabs.courses") },
    { key: "groups", label: t("root.schoolPage.tabs.groups") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <TabBar
          layoutId="school-tabs"
          ariaLabel={t("root.schoolPage.tabs.classes")}
          value={activeTab}
          onSelect={(next) => setActiveTab(next as typeof activeTab)}
          className="border-b-0"
          items={[
            { value: "classes", label: t("root.schoolPage.tabs.classes") },
            ...(isAdmin
              ? [
                  {
                    value: "teachers",
                    label: t("root.schoolPage.tabs.teachers"),
                    count: teachersError ? undefined : teachers.length,
                  },
                  {
                    value: "students",
                    label: t("root.schoolPage.tabs.students"),
                    count: students.length,
                  },
                ]
              : []),
            ...softTabs.map((tab) => ({
              value: tab.key,
              label: tab.label,
              disabled: true,
              note: t("root.schoolPage.soon"),
            })),
          ]}
        />

        {isAdmin && activeTab === "classes" ? (
          <Button size="lg" className="mb-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("root.schoolPage.actions.createClass")}
          </Button>
        ) : null}
      </div>

      {activeTab === "classes" ? (
        role === "STUDENT" ? (
          // The School page supplies its own title and tabs, so the directory
          // renders without its page header here.
          <StudentClassesView schoolId={schoolId} variant="embedded" />
        ) : role === "TEACHER" ? (
          <TeacherClassesView schoolId={schoolId} />
        ) : classItems.length > 0 ? (
          <ClassGrid items={classItems} isAdmin={isAdmin} />
        ) : (
          <Empty
            title={t("root.schoolPage.directory.emptyTitle")}
            description={
              isAdmin
                ? t("root.schoolPage.directory.emptyAdmin")
                : t("root.schoolPage.directory.emptyMember")
            }
          />
        )
      ) : activeTab === "teachers" ? (
        <SchoolTeachersTab teachers={teachers} hasError={teachersError} />
      ) : (
        <SchoolStudentsTab students={students} />
      )}

      {isAdmin ? <CreateClassDialog open={createOpen} onOpenChange={setCreateOpen} /> : null}
    </div>
  );
}

