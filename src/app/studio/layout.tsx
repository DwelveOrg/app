import type { Metadata } from "next";

import ReportProblem from "@/components/Custom/ReportProblem";

/**
 * The test studio — a separate environment, not another dashboard page.
 *
 * Authoring a forty-question IELTS paper is a long, single-document task, and
 * the dashboard shell is built for the opposite: a persistent sidebar, a
 * centred 1180px column, and eight other places to go. The studio drops all of
 * it. There is one way out (the exit control in the top bar), the canvas runs
 * the full width, and the chrome belongs to the test rather than to the app.
 *
 * The canvas is `--sidebar` rather than `--background`, so the moment the route
 * changes the surface changes with it. It is a small difference on purpose —
 * enough to register as "somewhere else", not so much that it reads as a
 * different product.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Test studio · Dwelve",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-sidebar text-foreground">
      {children}
      {/* The studio drops the dashboard chrome, but a broken editor is exactly
          what a maintainer needs a screenshot of. */}
      <ReportProblem />
    </div>
  );
}
