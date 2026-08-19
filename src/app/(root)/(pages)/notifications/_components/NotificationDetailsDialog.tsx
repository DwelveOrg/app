"use client";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import type { NotificationItem } from "@/app/(root)/_types";
import { CATEGORY_TINT, getNotificationCategory } from "../_lib/notifications";
import { NotificationIcon } from "./NotificationIcon";

type NotificationDetailsDialogProps = {
  notification: NotificationItem | null;
  onClose: () => void;
};

/**
 * The note an operator wrote when they closed a problem report.
 *
 * Read off `data` rather than baked into `bodyKey`, because it is the one part
 * of the notification that is not translatable boilerplate — it is a sentence a
 * person on the Dwelve team typed about this specific report, and it is the only
 * reason the reporter opens this dialog at all.
 */
function resolutionNoteOf(notification: NotificationItem | null) {
  if (!notification?.type.startsWith("REPORT_")) return null;

  const note = (notification.data as Record<string, unknown> | null | undefined)
    ?.resolutionNote;

  return typeof note === "string" && note.trim() ? note.trim() : null;
}

export function NotificationDetailsDialog({
  notification,
  onClose,
}: Readonly<NotificationDetailsDialogProps>) {
  const { t } = useTranslation();
  const category = notification ? getNotificationCategory(notification.type) : "system";
  const resolutionNote = resolutionNoteOf(notification);

  return (
    <AlertDialog
      open={notification !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("root.notifications.close")}
        >
          <X className="h-4 w-4" />
        </button>
        <AlertDialogHeader>
          <AlertDialogMedia className={CATEGORY_TINT[category]}>
            {notification ? (
              <NotificationIcon type={notification.type} className="h-5 w-5" />
            ) : null}
          </AlertDialogMedia>
          <AlertDialogTitle>{notification ? t(notification.titleKey) : null}</AlertDialogTitle>
          <AlertDialogDescription>
            {notification ? t(notification.bodyKey) : null}
          </AlertDialogDescription>
          {notification ? (
            <RelativeTime
              date={notification.createdAt}
              className="mt-1 block text-center text-xs text-muted-foreground"
            />
          ) : null}
        </AlertDialogHeader>

        {resolutionNote ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3.5 text-left">
            <p className="type-caption mb-1.5 font-medium text-muted-foreground">
              {t("root.notifications.resolutionNote")}
            </p>
            <p className="whitespace-pre-wrap text-13 leading-relaxed text-foreground">
              {resolutionNote}
            </p>
          </div>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
