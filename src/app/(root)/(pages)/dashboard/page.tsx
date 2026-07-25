import { getUser } from "../../_utils/getUser";
import { getSchool } from "../../_utils/getSchool";
import { getStudentOverview } from "../../_utils/getStudentOverview";
import { getMyClasses } from "../../_utils/getMyClasses";
import { getDashboard } from "../../_utils/getDashboard";
import type { StaffDashboardSummary } from "../../_lib/dashboard.schemas";
import NoMembershipState from "./_components/NoMembershipState";
import StudentDashboard from "./_components/StudentDashboard";
import DashboardComposer, {
  type StaffRole,
} from "./_components/composer/DashboardComposer";

export default async function Dashboard() {
  const user = await getUser();

  if (!user?.membershipCount) {
    return <NoMembershipState />;
  }

  // Fails soft: if the school fetch errors we still render the dashboard using
  // the role carried in the session, rather than blanking the whole page.
  const detail = user.schoolId ? await getSchool(user.schoolId) : null;
  const role = detail?.currentUserRole ?? user.schoolRole;
  const studentJoinCode = detail?.school.studentJoinCode ?? null;

  // Students get a real, data-backed home (overview counts + active roster)
  // rather than the reference figures the staff dashboard used, so a newly
  // joined student is guided toward enrolling in a class instead of being shown
  // fabricated stats.
  if (role === "STUDENT") {
    const [overview, myClasses] = await Promise.all([
      user.schoolId ? getStudentOverview(user.schoolId) : Promise.resolve(null),
      getMyClasses(),
    ]);

    return (
      <StudentDashboard
        fullName={user.fullName ?? null}
        schoolName={detail?.school.name ?? overview?.school.name ?? null}
        availableClasses={overview?.counts.availableClasses ?? 0}
        activeClasses={overview?.counts.activeClasses ?? myClasses.length}
        pendingRequests={overview?.counts.pendingRequests ?? 0}
        classes={myClasses.map((item) => ({ id: item.id, name: item.name }))}
      />
    );
  }

  // ADMIN / TEACHER: one adaptive dashboard composed from the live
  // data-availability profile. Empty states (the setup checklist, "no results
  // yet") are modules that lead when data is missing and give way to real graphs
  // as it arrives — the dashboard never shows fabricated figures. Every fetch
  // fails soft inside getDashboard, so a partial backend outage degrades
  // individual panels to their empty state instead of blanking the page.
  const staffRole: StaffRole = role === "TEACHER" ? "TEACHER" : "ADMIN";
  const data = await getDashboard(staffRole);

  return (
    <DashboardComposer
      context={{
        role: staffRole,
        fullName: user.fullName ?? null,
        schoolName: detail?.school.name ?? null,
        studentJoinCode,
        availability: data.availability,
        summary: data.summary as StaffDashboardSummary | null,
        trend: data.trend,
        distributions: data.distributions,
        feed: data.feed,
      }}
    />
  );
}
