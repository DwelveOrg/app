"use client";

import { Check, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { cn } from "@/lib/utils";
import type { InvitationResponse, NotificationItem } from "@/app/(root)/_types";
import { CATEGORY_TINT, categoryForItem, isPendingInvitation } from "../_lib/notifications";
import { NotificationIcon } from "./NotificationIcon";

type NotificationCardProps = {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onRespond: (id: string, response: InvitationResponse) => void;
};

export function NotificationCard({
  item,
  onOpen,
  onDelete,
  onMarkRead,
  onRespond,
}: Readonly<NotificationCardProps>) {
  const { t } = useTranslation();
  const unread = item.unread;
  const category = categoryForItem(item);
  const showInvite = isPendingInvitation(item);

  return (
    <article
      className={cn(
        "group relative flex items-start gap-3.5 px-4 py-4 transition-colors sm:px-5",
        unread
          ? "bg-[color-mix(in_srgb,var(--primary)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_9%,transparent)]"
          : "hover:bg-muted",
      )}
    >
      {/* Full-row click target sits behind the interactive controls. */}
      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={t(item.titleKey)}
        className="absolute inset-0 cursor-pointer focus-visible:outline-none focus-visible:-outline-offset-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />

      {/* Unread accent rail. */}
      {unread ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary"
        />
      ) : null}

      <span
        className={cn(
          "pointer-events-none relative mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl",
          unread ? CATEGORY_TINT[category] : "bg-muted text-muted-foreground",
        )}
      >
        <NotificationIcon type={item.type} className="h-[18px] w-[18px]" />
      </span>

      <div className="pointer-events-none relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "truncate text-sm text-foreground",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {t(item.titleKey)}
          </h3>
          {unread ? (
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
          ) : null}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted-foreground">
          {t(item.bodyKey)}
        </p>

        {showInvite ? (
          <div className="pointer-events-auto relative mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRespond(item.id, "accept")}
              className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {t("root.notifications.actions.accept")}
            </button>
            <button
              type="button"
              onClick={() => onRespond(item.id, "decline")}
              className="cursor-pointer rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-elev-1"
            >
              {t("root.notifications.actions.decline")}
            </button>
          </div>
        ) : null}

        <RelativeTime
          date={item.createdAt}
          className="mt-2 block text-xs text-muted-foreground sm:hidden"
        />
      </div>

      <div className="pointer-events-auto relative flex shrink-0 flex-col items-end gap-2">
        <RelativeTime
          date={item.createdAt}
          className="hidden whitespace-nowrap text-xs text-muted-foreground sm:block"
        />
        <div className="flex items-center gap-1">
          {unread ? (
            <button
              type="button"
              onClick={() => onMarkRead(item.id)}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground opacity-0 transition-all hover:border-primary hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 max-sm:opacity-100"
              aria-label={t("root.notifications.actions.markRead")}
              title={t("root.notifications.actions.markRead")}
            >
              <Check className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 max-sm:opacity-100"
            aria-label={t("root.notifications.delete")}
            title={t("root.notifications.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
