import { z } from "zod";

export const notificationIdInputSchema = z.object({
  notificationId: z.string().uuid(),
});

export const respondToInvitationInputSchema = notificationIdInputSchema.extend({
  response: z.enum(["accept", "decline"]),
});

export const markAllNotificationsReadInputSchema = z.object({});
