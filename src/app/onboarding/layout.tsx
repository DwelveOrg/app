import ReportProblem from "@/components/Custom/ReportProblem";

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
    <div className="min-h-dvh bg-background text-foreground">
      {children}
      {/* A user stuck in onboarding is the user least able to reach a support
          page, and the most likely to have something worth reporting. */}
      <ReportProblem />
    </div>
  );
}
