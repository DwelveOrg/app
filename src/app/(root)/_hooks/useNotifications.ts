"use client";

import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteNotificationAction,
  getNotificationStatusAction,
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  respondToInvitationAction,
} from "@/app/(root)/_lib/notification-actions";
import type {
  InvitationResponse,
  NotificationCategory,
  NotificationItem,
  NotificationStatusResponse,
  NotificationsListResponse,
  NotificationTab,
} from "@/app/(root)/_types";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";
import { queryKeys } from "@/lib/query/keys";
import { POLL_AMBIENT_MS, pollingOptions } from "@/lib/query/polling";

type UseNotificationsListOptions = {
  tab: NotificationTab;
  category?: NotificationCategory;
  limit?: number;
  enabled?: boolean;
};

type NotificationsListCache = InfiniteData<NotificationsListResponse>;
type CachedItemUpdate = NotificationItem | null;

const ACTION_ERROR = "Unable to update this notification. Please try again.";

/** Applies an item-level change to every loaded notification-list variant. */
function updateCachedNotifications(
  queryClient: QueryClient,
  updateItem: (item: NotificationItem) => CachedItemUpdate,
) {
  let changed = false;

  queryClient.setQueriesData<NotificationsListCache>(
    { queryKey: queryKeys.notifications.lists() },
    (current) => {
      if (!current) return current;

      let queryChanged = false;
      const pages = current.pages.map((page) => {
        const data: NotificationItem[] = [];
        let pageChanged = false;

        for (const item of page.data) {
          const updatedItem = updateItem(item);
          if (updatedItem !== item) {
            pageChanged = true;
            queryChanged = true;
            changed = true;
          }
          if (updatedItem) data.push(updatedItem);
        }

        return pageChanged ? { ...page, data } : page;
      });

      return queryChanged ? { ...current, pages } : current;
    },
  );

  return changed;
}

function updateCachedStatus(
  queryClient: QueryClient,
  update: (status: NotificationStatusResponse) => NotificationStatusResponse,
) {
  queryClient.setQueryData<NotificationStatusResponse>(queryKeys.notifications.status(), (current) =>
    current ? update(current) : current,
  );
}

function decrementUnreadStatus(queryClient: QueryClient) {
  updateCachedStatus(queryClient, (current) => {
    const unreadCount = Math.max(0, current.unreadCount - 1);
    return { unreadCount, hasUnread: unreadCount > 0 };
  });
}

function refreshNotificationCaches(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.status() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() }),
  ]);
}

function markItemRead(item: NotificationItem): NotificationItem {
  return item.unread
    ? { ...item, unread: false, readAt: item.readAt ?? new Date().toISOString() }
    : item;
}

/**
 * The unread count behind the sidebar badge.
 *
 * Polled, because it is the one number in the shell that changes without the
 * viewer doing anything — a teacher approving a request, a test being
 * published, an invitation arriving. It used to be read once per mount, so a
 * user who left a tab open saw the count they had on arrival for as long as
 * they stayed on it.
 */
export function useNotificationStatus() {
  return useQuery({
    queryKey: queryKeys.notifications.status(),
    queryFn: getNotificationStatusAction,
    ...pollingOptions(POLL_AMBIENT_MS),
  });
}

export function useNotificationsList({
  tab,
  category,
  limit = 10,
  enabled = true,
}: UseNotificationsListOptions) {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(tab, limit, category),
    queryFn: ({ pageParam }) =>
      listNotificationsAction({ tab, category, limit, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    enabled,
  });
}

/**
 * Read state is written directly into the React Query cache. The request runs
 * in the background, so opening a notification never waits for a list reload.
 */
export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) =>
      readSafeActionData(
        await markNotificationReadAction({ notificationId }),
        ACTION_ERROR,
      ),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.status() });

      const changed = updateCachedNotifications(queryClient, (item) =>
        item.id === notificationId ? markItemRead(item) : item,
      );
      if (changed) decrementUnreadStatus(queryClient);

      return { changed };
    },
    onSuccess: ({ notification }) => {
      updateCachedNotifications(queryClient, (item) =>
        item.id === notification.id ? notification : item,
      );
    },
    onError: () => refreshNotificationCaches(queryClient),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      readSafeActionData(await markAllNotificationsReadAction({}), ACTION_ERROR),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.status() });

      updateCachedNotifications(queryClient, markItemRead);
      updateCachedStatus(queryClient, () => ({ hasUnread: false, unreadCount: 0 }));
    },
    onSuccess: ({ unreadCount }) => {
      updateCachedStatus(queryClient, () => ({
        hasUnread: unreadCount > 0,
        unreadCount,
      }));
    },
    onError: () => refreshNotificationCaches(queryClient),
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) =>
      readSafeActionData(
        await deleteNotificationAction({ notificationId }),
        ACTION_ERROR,
      ),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.status() });

      let removedUnread = false;
      updateCachedNotifications(queryClient, (item) => {
        if (item.id !== notificationId) return item;
        removedUnread ||= item.unread;
        return null;
      });
      if (removedUnread) decrementUnreadStatus(queryClient);
    },
    onError: () => refreshNotificationCaches(queryClient),
  });
}

/**
 * Invitation responses update the cached card immediately. Only this mutation
 * invalidates school-dependent data because accepting can change membership.
 */
export function useRespondToInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: InvitationResponse }) =>
      readSafeActionData(
        await respondToInvitationAction({ notificationId: id, response }),
        ACTION_ERROR,
      ),
    onMutate: async ({ id, response }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.status() });

      let respondedToUnread = false;
      updateCachedNotifications(queryClient, (item) => {
        if (item.id !== id) return item;
        respondedToUnread ||= item.unread;
        const data = {
          ...(item.data as Record<string, unknown> | null),
          status: response === "accept" ? "accepted" : "declined",
        };
        return { ...markItemRead(item), data };
      });
      if (respondedToUnread) decrementUnreadStatus(queryClient);
    },
    onSuccess: async ({ notification }) => {
      updateCachedNotifications(queryClient, (item) =>
        item.id === notification.id ? notification : item,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.schools.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.all }),
      ]);
    },
    onError: () => refreshNotificationCaches(queryClient),
  });
}
