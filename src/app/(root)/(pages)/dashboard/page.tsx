import { getUser } from "../../_utils/getUser";
import { getSchool } from "../../_utils/getSchool";
import { getStudentOverview } from "../../_utils/getStudentOverview";
import { getMyClasses } from "../../_utils/getMyClasses";
import { getDashboard } from "../../_utils/getDashboard";
import NoMembershipState from "./_components/NoMembershipState";
import DashboardComposer from "./_components/composer/DashboardComposer";
import OnboardingGate from "./_components/OnboardingGate";

export default async function Dashboard() {
  const user = await getUser();

  if (!user?.membershipCount) {
    return (
      <OnboardingGate userId={user?.id ?? "unknown"} memberId={user?.memberId}>
        <NoMembershipState />
      </OnboardingGate>
    );
  }

  // Fails soft: if the school fetch errors we still render the dashboard using
  // the role carried in the session, rather than blanking the whole page.
  const detail = user.schoolId ? await getSchool(user.schoolId) : null;
  const role = detail?.currentUserRole ?? user.schoolRole;
  const studentJoinCode = detail?.school.studentJoinCode ?? null;

  if (!role) {
    return (
      <OnboardingGate userId={user.id} memberId={user.memberId}>
        <NoMembershipState />
      </OnboardingGate>
    );
  }

  // Students get a real, data-backed home (overview counts + active roster)
  // rather than the reference figures the staff dashboard used, so a newly
  // joined student is guided toward enrolling in a class instead of being shown
  // fabricated stats.
  const [data, overview, myClasses] = await Promise.all([
    getDashboard(role),
    role === "STUDENT" && user.schoolId
      ? getStudentOverview(user.schoolId)
      : Promise.resolve(null),
    role === "STUDENT" ? getMyClasses() : Promise.resolve([]),
  ]);

  return (
    <OnboardingGate userId={user.id} memberId={user.memberId}>
      <DashboardComposer
      context={{
        role,
        fullName: user.fullName ?? null,
        schoolName: detail?.school.name ?? null,
        studentJoinCode,
        availability: data.availability,
        summary: data.summary,
        trend: data.trend,
        distributions: data.distributions,
        submissions: data.submissions,
        classPerformance: data.classPerformance,
        feed: data.feed,
        studentClasses: myClasses.map((item) => ({ id: item.id, name: item.name })),
        availableClasses: overview?.counts.availableClasses ?? 0,
        pendingRequests: overview?.counts.pendingRequests ?? 0,
      }}
      />
    </OnboardingGate>
  );
}
