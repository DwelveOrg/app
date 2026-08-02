import { z } from "zod";

export const schoolRoleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT"]);

export const backendUserSchema = z
  .object({
    id: z.string(),
    fullName: z.string(),
    email: z.string(),
  })
  .passthrough();

export const backendSchoolSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    studentJoinCode: z.string().nullable().optional(),
  })
  .passthrough();

export const backendMemberSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    schoolId: z.string(),
    role: schoolRoleSchema,
  })
  .passthrough();

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const leaveSchoolResponseSchema = z.object({
  success: z.literal(true),
  tokens: authTokensSchema,
});

/** Shape returned by `/auth/logout` and `/auth/logout-all` on success. */
export const authSuccessSchema = z.object({ success: z.boolean() }).passthrough();

/**
 * Shape returned by `/auth/forgot-password`. Production returns only
 * `{ success: true }`; `resetUrl`/`expiresAt` appear solely in dev when the
 * backend enables `RESET_PASSWORD_DEBUG_TOKEN_ENABLED`.
 */
export const forgotPasswordResponseSchema = z
  .object({
    success: z.boolean(),
    resetUrl: z.string().optional(),
    expiresAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();

/** Shape returned by `GET /health`, reporting API, PostgreSQL, and Redis status. */
export const healthResponseSchema = z
  .object({
    status: z.string(),
    services: z
      .object({
        api: z.string(),
        postgres: z.string(),
        redis: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

const memberWithSchoolSchema = backendMemberSchema.extend({
  school: z
    .object({
      id: z.string(),
    })
    .passthrough()
    .optional(),
});

export const authResponseSchema = z
  .object({
    user: backendUserSchema,
    school: backendSchoolSchema.optional(),
    member: backendMemberSchema.optional(),
    memberships: z.array(memberWithSchoolSchema).optional(),
    tokens: authTokensSchema,
  })
  .passthrough();

export const createSchoolResponseSchema = z
  .object({
    school: backendSchoolSchema,
    membership: backendMemberSchema.optional(),
    member: backendMemberSchema.optional(),
    tokens: authTokensSchema,
  })
  .passthrough();

export const schoolDetailResponseSchema = z
  .object({
    school: backendSchoolSchema,
    currentUserRole: schoolRoleSchema,
    membership: backendMemberSchema,
    counts: z
      .object({
        students: z.number(),
        teachers: z.number(),
        classes: z.number(),
      })
      .optional(),
  })
  .passthrough();

export const schoolMemberCountsSchema = z
  .object({
    total: z.number(),
    admins: z.number(),
    teachers: z.number(),
    students: z.number(),
  })
  .passthrough();

export const schoolRosterMemberSchema = z
  .object({
    memberId: z.string(),
    userId: z.string(),
    role: schoolRoleSchema,
    isActive: z.boolean(),
    fullName: z.string(),
    email: z.string(),
    teacherProfileId: z.string().nullable(),
    studentProfileId: z.string().nullable(),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
  })
  .passthrough();

export const schoolMembersResponseSchema = z
  .object({
    counts: schoolMemberCountsSchema,
    members: z.array(schoolRosterMemberSchema),
  })
  .passthrough();

export const joinSchoolResponseSchema = z
  .object({
    school: backendSchoolSchema,
    membership: backendMemberSchema,
    tokens: authTokensSchema,
  })
  .passthrough();

/**
 * Shape returned by `POST /schools/invites/teacher/accept`. The backend issues a
 * `TEACHER` membership and fresh tokens carrying the new school context.
 */
export const acceptTeacherInviteResponseSchema = z
  .object({
    school: backendSchoolSchema,
    membership: backendMemberSchema,
    member: backendMemberSchema.optional(),
    tokens: authTokensSchema,
  })
  .passthrough();

export const teacherInviteResponseSchema = z
  .object({
    invite: z
      .object({
        id: z.string(),
        invitedEmail: z.string(),
        role: schoolRoleSchema,
        inviteUrl: z.string(),
        expiresAt: z.union([z.string(), z.date()]),
      })
      .passthrough(),
  })
  .passthrough();

export type BackendUser = z.infer<typeof backendUserSchema>;
export type BackendSchool = z.infer<typeof backendSchoolSchema>;
export type BackendMember = z.infer<typeof backendMemberSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
export type LeaveSchoolResponse = z.infer<typeof leaveSchoolResponseSchema>;
export type AuthSuccess = z.infer<typeof authSuccessSchema>;
export type ForgotPasswordResponse = z.infer<typeof forgotPasswordResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type CreateSchoolResponse = z.infer<typeof createSchoolResponseSchema>;
export type SchoolDetailResponse = z.infer<typeof schoolDetailResponseSchema>;
export type SchoolRosterMember = z.infer<typeof schoolRosterMemberSchema>;
export type SchoolMembersResponse = z.infer<typeof schoolMembersResponseSchema>;
export type JoinSchoolResponse = z.infer<typeof joinSchoolResponseSchema>;
export type AcceptTeacherInviteResponse = z.infer<typeof acceptTeacherInviteResponseSchema>;
export type TeacherInviteResponse = z.infer<typeof teacherInviteResponseSchema>;
