"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-1">
          <TabButton
            active={activeTab === "classes"}
            onClick={() => setActiveTab("classes")}
            label={t("root.schoolPage.tabs.classes")}
          />
          {isAdmin ? (
            <>
              <TabButton
                active={activeTab === "teachers"}
                onClick={() => setActiveTab("teachers")}
                label={t("root.schoolPage.tabs.teachers")}
                badge={teachersError ? undefined : teachers.length}
              />
              <TabButton
                active={activeTab === "students"}
                onClick={() => setActiveTab("students")}
                label={t("root.schoolPage.tabs.students")}
                badge={students.length}
              />
            </>
          ) : null}
          {softTabs.map((tab) => (
            <span
              key={tab.key}
              aria-disabled="true"
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 px-3 text-sm font-medium text-[var(--muted-foreground)] opacity-60"
            >
              {tab.label}
              <span className="rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                {t("root.schoolPage.soon")}
              </span>
            </span>
          ))}
        </div>

        {isAdmin && activeTab === "classes" ? (
          <Button size="lg" className="mb-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("root.schoolPage.actions.createClass")}
          </Button>
        ) : null}
      </div>

      {activeTab === "classes" ? (
        role === "STUDENT" ? (
          <StudentClassesView schoolId={schoolId} />
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

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
};

function TabButton({ active, onClick, label, badge }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex h-9 items-center gap-1.5 px-3 text-sm font-semibold transition-colors",
        active
          ? "text-[var(--primary)]"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
      )}
    >
      {label}
      {typeof badge === "number" ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active
              ? "bg-[var(--primary)]/10 text-[var(--primary)]"
              : "bg-[var(--muted)] text-[var(--muted-foreground)]",
          )}
        >
          {badge}
        </span>
      ) : null}
      {active ? (
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--primary)]" />
      ) : null}
    </button>
  );
}
