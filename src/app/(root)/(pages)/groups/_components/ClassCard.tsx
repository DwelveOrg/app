"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreVertical, Pencil, Trash2, FileText, GraduationCap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { classAccent } from "../_constants";
import type { ClassItem } from "../_types";
import EditClassDialog from "./EditClassDialog";
import DeleteClassDialog from "./DeleteClassDialog";

type ClassCardProps = {
  item: ClassItem;
  isAdmin: boolean;
};

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
    <div className="group relative flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[color-mix(in_srgb,var(--primary)_45%,transparent)] hover:shadow-sm">
      <Link href={detailHref} className="flex flex-1 flex-col" aria-label={item.name}>
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
              <h3 className="truncate text-[15px] font-semibold text-[var(--foreground)]">
                {item.name}
              </h3>
              {item.viewerRole ? (
                <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                  {item.viewerRole === "teacher"
                    ? t("root.classes.card.teaching")
                    : t("root.classes.card.enrolled")}
                </span>
              ) : null}
            </div>
            {item.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted-foreground)]">
                {item.description}
              </p>
            ) : null}
          </div>
        </div>

        {item.teacher ? (
          <p className="mt-4 truncate text-sm text-[var(--muted-foreground)]">{item.teacher}</p>
        ) : (
          <p className="mt-4 truncate text-sm text-[var(--muted-foreground)]/60">
            {t("root.classes.card.noTeacher")}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center rounded-lg bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            {t("root.classes.card.students", { count: item.studentCount })}
          </span>
          <span
            className={`text-xs font-semibold ${
              isActive
                ? "text-success-text"
                : "text-[var(--muted-foreground)]"
            }`}
          >
            {isActive ? t("root.classes.status.active") : t("root.classes.status.archived")}
          </span>
        </div>
      </Link>

      {isAdmin ? (
        <div className="absolute right-3 top-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-[var(--card)]/80 backdrop-blur"
                aria-label={t("root.classDetail.actions.more")}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  router.push(detailHref);
                }}
              >
                {t("root.classDetail.actions.open")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                {t("root.classDetail.actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  notifySoon("root.classDetail.actions.addTest");
                }}
              >
                <FileText className="h-4 w-4" />
                {t("root.classDetail.actions.addTest")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  notifySoon("root.classDetail.actions.addExam");
                }}
              >
                <GraduationCap className="h-4 w-4" />
                {t("root.classDetail.actions.addExam")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setDeleteOpen(true);
                }}
                className="text-[var(--destructive)] focus:text-[var(--destructive)]"
              >
                <Trash2 className="h-4 w-4" />
                {t("root.classDetail.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
    </div>
  );
}
