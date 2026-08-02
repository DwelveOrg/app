"use server";

import { actionClient, ActionError } from "@/lib/safe-action";
import {
  authedBackendJson,
  SessionExpiredError,
} from "@/app/(authentication)/_lib/backend";
import {
  createSession,
  getSession,
} from "@/app/(authentication)/_lib/session";
import {
  BackendApiError,
  BackendResponseValidationError,
} from "@/lib/api/backend";
import type {
  NotificationCategory,
  NotificationItem,
  NotificationStatusResponse,
  NotificationsListResponse,
  NotificationTab,
} from "@/app/(root)/_types";
import {
  deleteNotificationResponseSchema,
  markAllNotificationsReadResponseSchema,
  markNotificationReadResponseSchema,
  notificationStatusResponseSchema,
  notificationsListResponseSchema,
  respondToInvitationResponseSchema,
} from "@/app/(root)/_types/notification.schemas";
import {
  markAllNotificationsReadInputSchema,
  notificationIdInputSchema,
  respondToInvitationInputSchema,
} from "./notification-actions.schemas";

type ListNotificationsInput = {
  tab?: NotificationTab;
  category?: NotificationCategory;
  page?: number;
  limit?: number;
};

const EMPTY_STATUS: NotificationStatusResponse = {
  hasUnread: false,
  unreadCount: 0,
};
const GENERIC_ACTION_ERROR = "Unable to update this notification. Please try again.";
const NETWORK_ERROR = "Unable to reach Dwelve API. Please try again.";

function buildNotificationsQuery(input: ListNotificationsInput = {}) {
  return {
    tab: input.tab ?? "all",
    page: input.page ?? 1,
    limit: input.limit ?? 10,
    ...(input.category ? { category: input.category } : {}),
  };
}

function withUnread(notification: Omit<NotificationItem, "unread">): NotificationItem {
  return {
    ...notification,
    unread: notification.readAt == null,
  };
}

function getActionError(error: unknown) {
  if (error instanceof SessionExpiredError || error instanceof BackendApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return NETWORK_ERROR;
  }
  if (error instanceof BackendResponseValidationError) {
    console.error("Notification response validation error:", error);
    return GENERIC_ACTION_ERROR;
  }

  console.error("Notification action error:", error);
  return GENERIC_ACTION_ERROR;
}

/** Read action used by React Query when a notification surface mounts. */
export async function getNotificationStatusAction(): Promise<NotificationStatusResponse> {
  try {
    return await authedBackendJson("/notifications/status", {
      responseSchema: notificationStatusResponseSchema,
    });
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      return EMPTY_STATUS;
    }

    throw error;
  }
}

/** Paginated read action used by React Query's infinite notification cache. */
export async function listNotificationsAction(
  input: ListNotificationsInput = {},
): Promise<NotificationsListResponse> {
  const response = await authedBackendJson("/notifications", {
    query: buildNotificationsQuery(input),
    responseSchema: notificationsListResponseSchema,
  });

  return {
    ...response,
    data: response.data.map(withUnread),
  };
}

export const markNotificationReadAction = actionClient
  .inputSchema(notificationIdInputSchema)
  .action(async ({ parsedInput }) => {
    try {
      const response = await authedBackendJson(
        `/notifications/${parsedInput.notificationId}/read`,
        {
          method: "PATCH",
          responseSchema: markNotificationReadResponseSchema,
        },
      );

      return { notification: withUnread(response.notification) };
    } catch (error) {
      throw new ActionError(getActionError(error));
    }
  });

export const markAllNotificationsReadAction = actionClient
  .inputSchema(markAllNotificationsReadInputSchema)
  .action(async () => {
    try {
      return await authedBackendJson("/notifications/read-all", {
        method: "PATCH",
        responseSchema: markAllNotificationsReadResponseSchema,
      });
    } catch (error) {
      throw new ActionError(getActionError(error));
    }
  });

export const deleteNotificationAction = actionClient
  .inputSchema(notificationIdInputSchema)
  .action(async ({ parsedInput }) => {
    try {
      await authedBackendJson(`/notifications/${parsedInput.notificationId}`, {
        method: "DELETE",
        responseSchema: deleteNotificationResponseSchema,
      });

      return { notificationId: parsedInput.notificationId };
    } catch (error) {
      throw new ActionError(getActionError(error));
    }
  });

export const respondToInvitationAction = actionClient
  .inputSchema(respondToInvitationInputSchema)
  .action(async ({ parsedInput }) => {
    try {
      const response = await authedBackendJson(
        `/notifications/${parsedInput.notificationId}/invitation`,
        {
          method: "POST",
          body: { response: parsedInput.response },
          responseSchema: respondToInvitationResponseSchema,
        },
      );

      if (response.session) {
        const currentSession = await getSession();
        if (!currentSession?.userId || !currentSession.email || !currentSession.fullName) {
          throw new SessionExpiredError();
        }

        // The backend returns tokens scoped to the newly accepted school. Store
        // them before the client refreshes any school-scoped server components.
        await createSession({
          userId: currentSession.userId,
          email: currentSession.email,
          fullName: currentSession.fullName,
          accessToken: response.session.tokens.accessToken,
          refreshToken: response.session.tokens.refreshToken,
          schoolId: response.session.school.id,
          memberId: response.session.member.id,
          schoolRole: response.session.member.role,
          membershipCount: Math.max((currentSession.membershipCount ?? 0) + 1, 1),
        });
      }

      return {
        notification: withUnread(response.notification),
        selectedSchoolId: response.session?.school.id,
      };
    } catch (error) {
      throw new ActionError(getActionError(error));
    }
  });
