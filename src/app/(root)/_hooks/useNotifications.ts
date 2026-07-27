"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  NotificationTab,
} from "@/app/(root)/_types";
import { queryKeys } from "@/lib/query/keys";

type UseNotificationsListOptions = {
  tab: NotificationTab;
  category?: NotificationCategory;
  limit?: number;
  enabled?: boolean;
};

export function useNotificationStatus() {
  return useQuery({
    queryKey: queryKeys.notifications.status(),
    queryFn: getNotificationStatusAction,
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
 * Invalidates every notification surface (status + all list variants), plus the
 * class/enrollment caches: acting on a class or teacher-request notification can
 * change what those lists show (e.g. an approved teacher request), so they
 * refresh together (see `docs/features/teacher-class-requests.md`).
 */
function useInvalidateNotifications() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.status() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollment.all }),
    ]);
}

export function useMarkNotificationReadMutation() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: markNotificationReadAction,
    onSettled: invalidate,
  });
}

export function useMarkAllNotificationsReadMutation() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: (ids: string[]) => markAllNotificationsReadAction(ids),
    onSettled: invalidate,
  });
}

export function useDeleteNotificationMutation() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: deleteNotificationAction,
    onSettled: invalidate,
  });
}

export function useRespondToInvitationMutation() {
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: InvitationResponse }) =>
      respondToInvitationAction(id, response),
    onSettled: invalidate,
  });
}
