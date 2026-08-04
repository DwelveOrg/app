"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { NotificationFilter } from "@/app/(root)/_types";

type NotificationTabsProps = {
  active: NotificationFilter;
  onChange: (filter: NotificationFilter) => void;
  unreadCount: number;
};

const FILTERS: Array<{ value: NotificationFilter; labelKey: string }> = [
  { value: "all", labelKey: "root.notifications.tabs.all" },
  { value: "unread", labelKey: "root.notifications.tabs.unread" },
  { value: "system", labelKey: "root.notifications.tabs.system" },
  { value: "payments", labelKey: "root.notifications.tabs.payments" },
  { value: "invitations", labelKey: "root.notifications.tabs.invitations" },
];

export function NotificationTabs({ active, onChange, unreadCount }: Readonly<NotificationTabsProps>) {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t("root.notifications.title")}
      className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {FILTERS.map((filter) => {
        const isActive = active === filter.value;
        const showBadge = filter.value === "unread" && unreadCount > 0;

        return (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(filter.value)}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t(filter.labelKey)}
            {showBadge ? (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-2xs font-bold leading-none",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-destructive text-destructive-foreground",
                )}
              >
                {unreadCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
