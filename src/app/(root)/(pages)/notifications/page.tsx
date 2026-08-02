"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Empty from "../_components/ui/Empty";
import type {
  InvitationResponse,
  NotificationCategory,
  NotificationFilter,
  NotificationItem,
  NotificationTab,
} from "@/app/(root)/_types";
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationStatus,
  useNotificationsList,
  useRespondToInvitationMutation,
} from "@/app/(root)/_hooks/useNotifications";
import { NotificationDetailsDialog } from "./_components/NotificationDetailsDialog";
import { NotificationSection } from "./_components/NotificationSection";
import { NotificationTabs } from "./_components/NotificationTabs";
import { NotificationsHeader } from "./_components/NotificationsHeader";
import { groupNotificationsByDate, resolveNotificationHref } from "./_lib/notifications";

const PAGE_SIZE = 10;
const CATEGORY_FILTERS: NotificationCategory[] = ["system", "payments", "invitations"];

const Page = () => {
  const { i18n, t } = useTranslation();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // `all`/`unread` map to the backend `tab`; the category pills map to the
  // backend `category` param (server-side filtering) — each its own query cache.
  const tab: NotificationTab = activeFilter === "unread" ? "unread" : "all";
  const category = CATEGORY_FILTERS.includes(activeFilter as NotificationCategory)
    ? (activeFilter as NotificationCategory)
    : undefined;
  const notificationsQuery = useNotificationsList({ tab, category, limit: PAGE_SIZE });
  const statusQuery = useNotificationStatus();

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteNotificationMutation = useDeleteNotificationMutation();
  const respondMutation = useRespondToInvitationMutation();

  const unreadCount = statusQuery.data?.unreadCount ?? 0;

  const allItems = useMemo<NotificationItem[]>(
    () => notificationsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [notificationsQuery.data?.pages],
  );

  const visibleItems = useMemo(
    () =>
      // Category filtering is server-side. Cache updates mark items read before
      // the network request settles, so the Unread tab changes immediately.
      allItems.filter((item) => activeFilter !== "unread" || item.unread),
    [activeFilter, allItems],
  );

  const groupedItems = useMemo(
    () => groupNotificationsByDate(visibleItems, t, i18n.language),
    [i18n.language, t, visibleItems],
  );

  const markReadOptimistic = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation],
  );

  const handleOpenNotification = useCallback(
    (item: NotificationItem) => {
      if (item.unread) markReadOptimistic(item.id);

      // Deep-link to the related entity when one exists; otherwise fall back to
      // the read-only details dialog (e.g. greetings, resolved invitations).
      const href = resolveNotificationHref(item);
      if (href) {
        router.push(href);
        return;
      }

      setSelectedNotification({
        ...item,
        unread: false,
        readAt: item.readAt ?? new Date().toISOString(),
      });
    },
    [markReadOptimistic, router],
  );

  const handleMarkRead = useCallback(
    (id: string) => {
      markReadOptimistic(id);
    },
    [markReadOptimistic],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setSelectedNotification((current) => (current?.id === id ? null : current));
      deleteNotificationMutation.mutate(id);
    },
    [deleteNotificationMutation],
  );

  const handleRespond = useCallback(
    (id: string, response: InvitationResponse) => {
      respondMutation.mutate(
        { id, response },
        {
          onSuccess: ({ selectedSchoolId }) => {
            if (selectedSchoolId) router.refresh();
          },
        },
      );
    },
    [respondMutation, router],
  );

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount > 0) markAllReadMutation.mutate();
  }, [markAllReadMutation, unreadCount]);

  const hasItems = visibleItems.length > 0;

  const loadMore = notificationsQuery.hasNextPage ? (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={() => void notificationsQuery.fetchNextPage()}
        disabled={notificationsQuery.isFetchingNextPage}
        className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {notificationsQuery.isFetchingNextPage
          ? t("root.notifications.loading")
          : t("root.notifications.loadMore")}
      </button>
    </div>
  ) : null;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[70vh] w-full flex-col gap-6"
    >
      <NotificationsHeader
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        isMarkingAll={markAllReadMutation.isPending}
      />

      <NotificationTabs active={activeFilter} onChange={setActiveFilter} unreadCount={unreadCount} />

      <AnimatePresence mode="wait">
        {notificationsQuery.isLoading ? (
          <motion.section
            key="notifications-loading"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3.5 px-5 py-4">
                <div className="size-10 shrink-0 animate-pulse rounded-xl bg-[var(--muted)]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-3 w-full animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--muted)]" />
                </div>
                <div className="h-3 w-14 shrink-0 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            ))}
          </motion.section>
        ) : notificationsQuery.isError ? (
          <motion.section
            key="notifications-error"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="flex flex-1 items-center justify-center"
          >
            <Empty
              title={t("root.notifications.errorTitle")}
              description={t("root.notifications.errorDescription")}
            />
          </motion.section>
        ) : hasItems ? (
          <motion.section
            key="notifications-list"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.24 }}
            className="space-y-4"
          >
            <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              {groupedItems.map((group) => (
                <NotificationSection
                  key={group.key}
                  items={group.items}
                  label={group.label}
                  onOpen={handleOpenNotification}
                  onDelete={handleDelete}
                  onMarkRead={handleMarkRead}
                  onRespond={handleRespond}
                />
              ))}
            </div>
            {loadMore}
          </motion.section>
        ) : (
          <motion.section
            key="notifications-empty"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="flex flex-1 flex-col items-center justify-center gap-4"
          >
            <Empty
              title={t("root.notifications.emptyTitle")}
              description={t("root.notifications.emptyDescription")}
            />
            {loadMore}
          </motion.section>
        )}
      </AnimatePresence>

      <NotificationDetailsDialog
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </motion.div>
  );
};

export default Page;
