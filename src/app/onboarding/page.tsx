import { redirect } from "next/navigation";

import { getSchool } from "@/app/(root)/_utils/getSchool";
import { getMyClasses } from "@/app/(root)/_utils/getMyClasses";
import { getClasses } from "@/app/(root)/_utils/getClasses";
import { getStudentOverview } from "@/app/(root)/_utils/getStudentOverview";
import { getOnboarding } from "@/app/(root)/_utils/getOnboarding";
import { getUser } from "@/app/(root)/_utils/getUser";
import OnboardingWizard from "./_components/OnboardingWizard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ replay?: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const [detail, classes, overview, onboarding, params] = await Promise.all([
    user.schoolId ? getSchool(user.schoolId) : Promise.resolve(null),
    user.schoolId
      ? user.schoolRole === "STUDENT"
        ? getMyClasses()
        : getClasses()
      : Promise.resolve([]),
    user.schoolId && user.schoolRole === "STUDENT"
      ? getStudentOverview(user.schoolId)
      : Promise.resolve(null),
    getOnboarding(),
    searchParams,
  ]);

  const replay = params.replay === "1";

  // Finished users only reach the wizard on purpose, via the "replay" link on
  // the dashboard. Deciding here rather than in a client effect means no
  // redirect flash and no skeleton on the way through.
  if (!replay && onboarding.status !== "in_progress") {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      key={user.memberId ?? "account"}
      initialStep={replay ? 0 : onboarding.step}
      user={{
        id: user.id,
        fullName: user.fullName,
        schoolId: user.schoolId ?? null,
        memberId: user.memberId ?? null,
        role: detail?.currentUserRole ?? user.schoolRole ?? null,
      }}
      schoolName={detail?.school.name ?? overview?.school.name ?? null}
      studentJoinCode={detail?.school.studentJoinCode ?? null}
      classes={classes.map((item) => ({ id: item.id, name: item.name }))}
      availableClasses={overview?.counts.availableClasses ?? 0}
    />
  );
}
