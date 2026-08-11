import { z } from "zod";

import { schoolRoleSchema } from "@/app/(authentication)/_lib/api.schemas";

/**
 * Zod schemas for the `/profile` endpoints. Shapes mirror the fields documented
 * in `docs/features/profile-page-contract.md`. `.passthrough()` keeps
 * forward-compatible fields from failing validation.
 */

const isoTimestamp = z.union([z.string(), z.date()]);

export const profileAccountSchema = z
  .object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullable().optional(),
    globalRole: z.string().optional(),
    isActive: z.boolean().optional(),
    authMethods: z
      .object({
        password: z.boolean(),
        google: z.boolean(),
      })
      .passthrough()
      .optional(),
    createdAt: isoTimestamp.optional(),
    updatedAt: isoTimestamp.optional(),
  })
  .passthrough();

export const profileSchoolSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    createdAt: isoTimestamp.optional(),
    updatedAt: isoTimestamp.optional(),
  })
  .passthrough();

export const profileMembershipSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    schoolId: z.string(),
    role: schoolRoleSchema,
    isActive: z.boolean().optional(),
    createdAt: isoTimestamp.optional(),
    updatedAt: isoTimestamp.optional(),
  })
  .passthrough();

export const profileRoleClassSchema = z
  .object({
    assignmentId: z.string(),
    classId: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    pictureUrl: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    createdAt: isoTimestamp.optional(),
    updatedAt: isoTimestamp.optional(),
  })
  .passthrough();

const adminRoleProfileSchema = z
  .object({
    type: z.literal("ADMIN"),
  })
  .passthrough();

const teacherRoleProfileSchema = z
  .object({
    type: z.literal("TEACHER"),
    teacherId: z.string(),
    phone: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    classes: z.array(profileRoleClassSchema).default([]),
    classCount: z.number().optional(),
  })
  .passthrough();

const studentRoleProfileSchema = z
  .object({
    type: z.literal("STUDENT"),
    studentId: z.string(),
    studentCode: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    classes: z.array(profileRoleClassSchema).default([]),
    classCount: z.number().optional(),
  })
  .passthrough();

export const profileRoleProfileSchema = z.discriminatedUnion("type", [
  adminRoleProfileSchema,
  teacherRoleProfileSchema,
  studentRoleProfileSchema,
]);

export const profileSelectedSchoolSchema = z
  .object({
    school: profileSchoolSchema,
    member: profileMembershipSchema,
    roleProfile: profileRoleProfileSchema,
  })
  .passthrough();

export const profileMembershipEntrySchema = z
  .object({
    membership: profileMembershipSchema,
    school: profileSchoolSchema,
  })
  .passthrough();

export const profileNotificationStatusSchema = z
  .object({
    hasUnread: z.boolean(),
    unreadCount: z.number(),
  })
  .passthrough();

export const profileResponseSchema = z
  .object({
    account: profileAccountSchema,
    selectedSchool: profileSelectedSchoolSchema.nullable(),
    memberships: z.array(profileMembershipEntrySchema).default([]),
    notificationStatus: profileNotificationStatusSchema.optional(),
  })
  .passthrough();

export const profileSessionSchema = z
  .object({
    sessionId: z.string(),
    userAgent: z.string().nullable().optional(),
    ipAddress: z.string().nullable().optional(),
    createdAt: isoTimestamp,
    expiresAt: isoTimestamp.optional(),
    isCurrent: z.boolean().optional(),
  })
  .passthrough();

export const profileSessionsResponseSchema = z
  .object({
    sessions: z.array(profileSessionSchema),
    count: z.number().optional(),
  })
  .passthrough();

export const changePasswordResponseSchema = z
  .object({
    success: z.boolean(),
    tokens: z
      .object({
        accessToken: z.string(),
        refreshToken: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

export const revokeSessionResponseSchema = z
  .object({
    success: z.boolean(),
    revokedCurrent: z.boolean().optional(),
  })
  .passthrough();

/** `DELETE /profile` — `{ "success": true }`. */
export const deleteAccountResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .passthrough();

export type ProfileAccount = z.infer<typeof profileAccountSchema>;
export type ProfileSchool = z.infer<typeof profileSchoolSchema>;
export type ProfileMembership = z.infer<typeof profileMembershipSchema>;
export type ProfileRoleClass = z.infer<typeof profileRoleClassSchema>;
export type ProfileRoleProfile = z.infer<typeof profileRoleProfileSchema>;
export type ProfileSelectedSchool = z.infer<typeof profileSelectedSchoolSchema>;
export type ProfileMembershipEntry = z.infer<typeof profileMembershipEntrySchema>;
export type ProfileNotificationStatus = z.infer<typeof profileNotificationStatusSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type ProfileSession = z.infer<typeof profileSessionSchema>;
export type ProfileSessionsResponse = z.infer<typeof profileSessionsResponseSchema>;
export type ChangePasswordResponse = z.infer<typeof changePasswordResponseSchema>;
export type RevokeSessionResponse = z.infer<typeof revokeSessionResponseSchema>;
export type DeleteAccountResponse = z.infer<typeof deleteAccountResponseSchema>;
