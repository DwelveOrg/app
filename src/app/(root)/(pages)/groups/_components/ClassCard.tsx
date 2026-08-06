"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2, FileText, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import RowActionsMenu from "@/components/ui/RowActionsMenu";
import { classAccent } from "../_constants";
import type { ClassItem } from "../_types";
import EditClassDialog from "./EditClassDialog";
import DeleteClassDialog from "./DeleteClassDialog";
import Surface from "@/components/ui/Surface";
import Badge from "@/components/ui/badge";

type ClassCardProps = {
  item: ClassItem;
  isAdmin: boolean;
};

/**
 * One class in the staff directory. The whole card opens the class: a single
 * stretched link covers it, so there is one target and one tab stop for
 * "go here", and the admin actions sit above it as siblings rather than nested
 * controls inside a link.
 */
export default function ClassCard({ item, isAdmin }: ClassCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const initial = item.name.charAt(0).toUpperCase();
  const isActive = item.status === "active";
  const accent = classAccent(item.id);
  const detailHref = `/groups/${item.id}`;

  const notifySoon = (labelKey: string) =>
    toast.info(t("root.classDetail.actions.comingSoon", { action: t(labelKey) }));

  return (
    <Surface interactive className="group flex h-full flex-col">
      {/* Stretched link: covers the card, but stops short of the actions above it. */}
      <Link
        href={detailHref}
        aria-label={item.name}
        className="absolute inset-0 z-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />

      <div className="pointer-events-none flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          {item.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.pictureUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${accent}`}
            >
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 pr-8">
              <h3 className="truncate text-15 font-semibold text-foreground">
                {item.name}
              </h3>
              {item.viewerRole ? (
                <Badge variant="primary" size="xs">
                  {item.viewerRole === "teacher"
                    ? t("root.classes.card.teaching")
                    : t("root.classes.card.enrolled")}
                </Badge>
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </div>
        </div>

        {item.teacher ? (
          <p className="mt-4 truncate text-sm text-muted-foreground">{item.teacher}</p>
        ) : (
          <p className="mt-4 truncate text-sm text-muted-foreground/60">
            {t("root.classes.card.noTeacher")}
          </p>
        )}

        <div className="mt-4 flex flex-1 items-end justify-between">
          <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {t("root.classes.card.students", { count: item.studentCount })}
          </span>
          <span
            className={`text-xs font-semibold ${
              isActive ? "text-success" : "text-muted-foreground"
            }`}
          >
            {isActive ? t("root.classes.status.active") : t("root.classes.status.archived")}
          </span>
        </div>
      </div>

      {/* Above the stretched link, and a sibling of it: managing the class never
          also opens it (the trigger stops the click either way). */}
      {isAdmin ? (
        <div className="absolute right-3 top-3 z-10">
          <RowActionsMenu
            variant="floating"
            label={t("root.classes.card.actionsLabel", { name: item.name })}
            contentClassName="w-44"
            actions={[
              {
                label: t("root.classDetail.actions.edit"),
                icon: Pencil,
                keepOpen: true,
                onSelect: () => setEditOpen(true),
              },
              {
                label: t("root.classDetail.actions.addTest"),
                icon: FileText,
                onSelect: () => router.push(`${detailHref}/tests`),
              },
              {
                label: t("root.classDetail.actions.addExam"),
                icon: GraduationCap,
                keepOpen: true,
                onSelect: () => notifySoon("root.classDetail.actions.addExam"),
              },
              {
                label: t("root.classDetail.actions.delete"),
                icon: Trash2,
                destructive: true,
                keepOpen: true,
                onSelect: () => setDeleteOpen(true),
              },
            ]}
          />
        </div>
      ) : null}

      {isAdmin ? (
        <>
          <EditClassDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            classInfo={{
              id: item.id,
              name: item.name,
              description: item.description,
              pictureUrl: item.pictureUrl,
            }}
          />
          <DeleteClassDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            classId={item.id}
            className={item.name}
          />
        </>
      ) : null}
    </Surface>
  );
}
