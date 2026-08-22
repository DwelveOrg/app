import type { Metadata } from "next";

import ReportProblem from "@/components/Custom/ReportProblem";
import { PRIVATE_ROBOTS } from "@/lib/seo";

/**
 * The exam room — a separate environment, not another dashboard page.
 *
 * The same argument as the studio, from the other side. Authoring is a long
 * single-document task and the dashboard shell fights it; **sitting** a test is
 * the same shape of task with a stricter requirement attached — there must be
 * nothing else to click. A sidebar offering Notifications during a proctored
 * exam is an invitation to leave the screen, and on a delivery with
 * `detectLeaveScreen` set to `SUBMIT` that invitation ends the attempt.
 *
 * So: no sidebar, no breadcrumb, no nav. One way out, and it is deliberate.
 * The canvas is `--sidebar` rather than `--background` for the same reason the
 * studio's is — the surface changes the moment the route does, so the student
 * can see they are somewhere with different rules.
 *
 * `force-dynamic` because every render depends on a live attempt and a server
 * clock. A cached exam page is a cached deadline.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Test · Dwelve",
  robots: PRIVATE_ROBOTS,
};

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sidebar text-foreground">
      {children}
      {/* Present on the cover, the submitted screen and the result — and absent
          on a live attempt, which `ReportProblem` enforces itself. A floating
          control that opens a modal is exactly the invitation to leave the
          screen that a `detectLeaveScreen: SUBMIT` delivery punishes. */}
      <ReportProblem />
    </div>
  );
}
