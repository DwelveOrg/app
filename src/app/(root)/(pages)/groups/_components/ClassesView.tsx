"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import { Button } from "@/components/ui/Button";
import Empty from "../../_components/ui/Empty";
import CreateClassDialog from "../../school/_components/CreateClassDialog";
import { classFilterLabelKeys, classFilters } from "../_constants";
import type { ClassFilter, ClassItem } from "../_types";
import ClassGrid from "./ClassGrid";
import TabBar from "@/components/ui/TabBar";

type ClassesViewProps = {
  items: ClassItem[];
  role: SchoolRole | null;
};

/** How the count subtitle reads depends on why these classes are visible:
 * admins see the whole directory, teachers see what they lead, students what
 * they're enrolled in. */
function subtitleKeyForRole(role: SchoolRole | null): string {
  if (role === "ADMIN") {
    return "root.classes.subtitleAdmin";
  }
  if (role === "TEACHER") {
    return "root.classes.subtitleTeacher";
  }
  return "root.classes.subtitleStudent";
}

export default function ClassesView({ items, role }: ClassesViewProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<ClassFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const isAdmin = role === "ADMIN";

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="type-title text-foreground">
            {t("root.classes.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length > 0
              ? t(subtitleKeyForRole(role), { count: items.length })
              : t("root.classes.subtitleEmpty")}
          </p>
        </div>
        {isAdmin ? (
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("root.schoolPage.actions.createClass")}
          </Button>
        ) : null}
      </header>

      {items.length > 0 ? (
        <>
          <TabBar
            layoutId="classes-filter"
            ariaLabel={t("root.classes.filters.all")}
            value={filter}
            onSelect={(next) => setFilter(next as ClassFilter)}
            items={classFilters.map((value) => ({
              value,
              label: t(classFilterLabelKeys[value]),
            }))}
          />

          {visible.length > 0 ? (
            <ClassGrid key={filter} items={visible} isAdmin={isAdmin} />
          ) : (
            <Empty
              title={t("root.classes.empty.title")}
              description={t("root.classes.empty.description")}
            />
          )}
        </>
      ) : (
        <Empty
          title={t("root.classes.noneTitle")}
          description={t("root.classes.noneDescription")}
        />
      )}

      {isAdmin ? (
        <CreateClassDialog open={createOpen} onOpenChange={setCreateOpen} />
      ) : null}
    </div>
  );
}
