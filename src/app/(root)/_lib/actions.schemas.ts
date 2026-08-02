import { z } from "zod";

/**
 * Input schemas for the dashboard server actions. Kept in a plain module (not a
 * `"use server"` file, which may only export async functions) so both the
 * actions and the client forms/react-hook-form resolvers can import them.
 */

const IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Reusable image-file validator for logos and class pictures.
 * `File` is a global in Node 20+ (Next.js requirement) and in every browser.
 */
export const imageFileSchema = z
  .instanceof(File, { message: "Please choose an image file." })
  .refine((file) => file.size > 0, "Please choose an image file.")
  .refine(
    (file) => (IMAGE_MIME_TYPES as readonly string[]).includes(file.type),
    "Only PNG, JPEG, or WebP images are allowed.",
  )
  .refine(
    (file) => file.size <= MAX_IMAGE_BYTES,
    "Image must be under 5 MB.",
  );

/** Mirrors the backend `CreateClassDto` limits; `gradeLevel` removed per plan. */
export const createClassSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  picture: imageFileSchema.optional(),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

/** `PATCH /classes/:id` payload. Any subset of fields may be changed. */
export const updateClassSchema = z.object({
  classId: z.string().min(1),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  picture: imageFileSchema.optional(),
  removePicture: z.boolean().optional(),
});

export type UpdateClassInput = z.infer<typeof updateClassSchema>;

export const deleteClassSchema = z.object({
  classId: z.string().min(1),
});

export type DeleteClassInput = z.infer<typeof deleteClassSchema>;

export const inviteTeacherSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export type InviteTeacherInput = z.infer<typeof inviteTeacherSchema>;

/**
 * `DELETE /schools/:schoolId`. The schoolId is read from the trusted session in
 * the action, so this only needs to satisfy the safe-action input boundary.
 */
export const deleteSchoolSchema = z.object({});

export type DeleteSchoolInput = z.infer<typeof deleteSchoolSchema>;

/**
 * `DELETE /students/:studentId`. `studentId` is the `StudentProfile.id`. This is
 * a school-level removal, distinct from the class-level `removeStudentSchema`
 * in `enrollment.schemas.ts`.
 */
export const removeSchoolStudentSchema = z.object({
  studentId: z.string().min(1),
});

export type RemoveSchoolStudentInput = z.infer<typeof removeSchoolStudentSchema>;

/** Removes a non-admin school membership (`SchoolMember.id`). */
export const removeSchoolMemberSchema = z.object({
  memberId: z.string().min(1),
});

export type RemoveSchoolMemberInput = z.infer<typeof removeSchoolMemberSchema>;

/** Teachers and students leave their currently selected school. */
export const leaveSchoolSchema = z.object({});

export const updateSchoolSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  logo: imageFileSchema.optional(),
  removeLogo: z.boolean().optional(),
});

export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
