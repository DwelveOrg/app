import { z } from "zod";

/**
 * Zod schemas for `GET|PATCH /profile/onboarding`.
 *
 * Onboarding state is server-owned. It used to live in `localStorage`, which
 * meant a cleared browser or a second device silently skipped the flow, and the
 * dashboard had to render behind a client-side gate to find out. Keeping it on
 * the session lets the server decide before the first byte of HTML.
 */
export const onboardingStatusSchema = z.enum([
  "in_progress",
  "completed",
  "skipped",
]);

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export const onboardingStateSchema = z
  .object({
    /**
     * `account` while the user has no membership (the access-setup step);
     * `membership` once a school is selected and the role tour applies.
     */
    scope: z.enum(["account", "membership"]),
    memberId: z.string().nullable(),
    role: z.enum(["ADMIN", "TEACHER", "STUDENT"]).nullable(),
    step: z.number().int().min(0),
    status: onboardingStatusSchema,
  })
  .passthrough();

export type OnboardingState = z.infer<typeof onboardingStateSchema>;
