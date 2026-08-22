import type { Metadata } from "next";

import ReportProblem from "@/components/Custom/ReportProblem";
import ShellBackdrop from "@/components/Custom/ShellBackdrop";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

/**
 * Onboarding owns the whole viewport.
 *
 * It used to render a fixed-width card centred in a flex container, which left
 * most of a desktop screen empty and forced every step to compete for one
 * column. The wizard now lays out its own two-pane shell, so this layout only
 * establishes the full-height canvas and gets out of the way.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-dvh bg-background text-foreground">
      {/* Onboarding is the first authenticated thing a new account sees, and it
          is by definition the emptiest — one question at a time on a full
          screen. `viewport` because this shell's own box scrolls: the field
          should stay under the wizard, not slide out from beneath it. */}
      <ShellBackdrop anchor="viewport" />

      <div className="relative z-10">{children}</div>
      {/* A user stuck in onboarding is the user least able to reach a support
          page, and the most likely to have something worth reporting. */}
      <ReportProblem />
    </div>
  );
}
