"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { classAccent } from "../_constants";
import type { ClassItem } from "../_types";
import Surface from "@/components/ui/Surface";
import Badge from "@/components/ui/badge";

type ClassCardProps = {
  item: ClassItem;
};

/**
 * One class in the staff directory. The card does exactly one thing — open the
 * class — so it *is* the link: one target, one tab stop, no overlay.
 *
 * It used to carry a corner overflow menu with edit / add test / add exam /
 * delete, which meant the stretched link had to dodge a sibling control and
 * every one of those actions existed twice in the product. They live on the
 * class page now, as visible buttons next to the thing they act on.
 */
export default function ClassCard({ item }: ClassCardProps) {
  const { t } = useTranslation();

  const initial = item.name.charAt(0).toUpperCase();
  const isActive = item.status === "active";
  const accent = classAccent(item.id);

  return (
    <Surface
      as={Link}
      href={`/groups/${item.id}`}
      interactive
      className="group flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
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
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-15 font-semibold text-foreground">{item.name}</h3>
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
    </Surface>
  );
}
