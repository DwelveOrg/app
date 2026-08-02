import { z } from "zod";

export const notificationInvitationDataSchema = z
  .object({
    invitationId: z.string().optional(),
    status: z.enum(["pending", "accepted", "declined"]).optional(),
  })
  .catchall(z.unknown());

export const backendNotificationItemSchema = z
  .object({
    id: z.string(),
    schoolId: z.string().nullable().optional(),
    type: z.string(),
    category: z.enum(["system", "payments", "invitations"]).optional(),
    titleKey: z.string(),
    bodyKey: z.string(),
    data: z
      .union([notificationInvitationDataSchema, z.record(z.string(), z.unknown())])
      .nullable()
      .optional(),
    createdAt: z.string(),
    readAt: z.string().nullable().optional(),
  })
  .passthrough();

export const notificationStatusResponseSchema = z
  .object({
    hasUnread: z.boolean(),
    unreadCount: z.number(),
  })
  .passthrough();

export const notificationsListResponseSchema = z
  .object({
    data: z.array(backendNotificationItemSchema),
    meta: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasMore: z.boolean(),
        unreadCount: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

export const markNotificationReadResponseSchema = z
  .object({
    notification: backendNotificationItemSchema,
  })
  .passthrough();

export const markAllNotificationsReadResponseSchema = z
  .object({
    updated: z.number(),
    unreadCount: z.number(),
  })
  .passthrough();

export const deleteNotificationResponseSchema = z
  .object({
    success: z.literal(true),
  })
  .passthrough();

export const respondToInvitationResponseSchema = markNotificationReadResponseSchema.extend({
  session: z
    .object({
      school: z
        .object({
          id: z.string(),
        })
        .passthrough(),
      member: z
        .object({
          id: z.string(),
          schoolId: z.string(),
          role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
        })
        .passthrough(),
      tokens: z
        .object({
          accessToken: z.string(),
          refreshToken: z.string(),
        })
        .passthrough(),
    })
    .optional(),
});
