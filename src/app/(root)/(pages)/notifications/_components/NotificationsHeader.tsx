"use client";

import { CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import PageHeader from "@/app/(root)/_components/PageHeader";

type NotificationsHeaderProps = {
  unreadCount: number;
  onMarkAllRead: () => void;
  isMarkingAll: boolean;
};

export function NotificationsHeader({
  unreadCount,
  onMarkAllRead,
  isMarkingAll,
}: Readonly<NotificationsHeaderProps>) {
  const { t } = useTranslation();
  const hasUnread = unreadCount > 0;

  return (
    <PageHeader
      title={t("root.notifications.title")}
      subtitle={
        hasUnread
          ? t("root.notifications.summary.some", { count: unreadCount })
          : t("root.notifications.summary.none")
      }
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={onMarkAllRead}
          disabled={!hasUnread || isMarkingAll}
        >
          <CheckCheck aria-hidden className="size-4" />
          {t("root.notifications.markAllRead")}
        </Button>
      }
    />
  );
}
