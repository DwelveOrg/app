import { redirect } from "next/navigation";

import { getUser } from "../../_utils/getUser";
import { getSchool } from "../../_utils/getSchool";
import { getStudentOverview } from "../../_utils/getStudentOverview";
import { getMyClasses } from "../../_utils/getMyClasses";
import { getDashboard } from "../../_utils/getDashboard";
import { getOnboarding } from "../../_utils/getOnboarding";
import NoMembershipState from "./_components/NoMembershipState";
import DashboardComposer from "./_components/composer/DashboardComposer";

export default async function Dashboard() {
  // Onboarding state is server-owned, so the decision happens before any HTML
  // is sent. The previous client-side gate had to render the whole dashboard
  // behind a skeleton on *every* visit just to read localStorage, which threw
  // away the server render for established users and silently skipped the flow
  // on a second device.
  //
  // Fetched together with the user: both depend only on the session cookie,
  // and against a remote backend each *sequential* round trip is paid in full
  // — this page used to spend one whole round trip learning the user before
  // asking about onboarding. When onboarding redirects, the rest is discarded.
  const [user, onboarding] = await Promise.all([getUser(), getOnboarding()]);

  if (!user) {
    redirect("/login");
  }

  // Free: getUser() already hydrated this school and getSchool is
  // request-cached, so this await resolves from the per-request cache.
  // Fails soft: if the school fetch errored we still render the dashboard
  // using the role carried in the session, rather than blanking the page.
  const detail = user.schoolId ? await getSchool(user.schoolId) : null;
  if (onboarding.status === "in_progress") {
    redirect("/onboarding");
  }

  if (!user.membershipCount) {
    return <NoMembershipState />;
  }
  const role = detail?.currentUserRole ?? user.schoolRole;
  const studentJoinCode = detail?.school.studentJoinCode ?? null;

  if (!role) {
    return <NoMembershipState />;
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
  );
}
