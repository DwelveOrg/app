import RoleEmptyState from "../_components/ui/RoleEmptyState";
import { getUser } from "../../_utils/getUser";
import { getSchool } from "../../_utils/getSchool";
import { getSchoolMembers } from "../../_utils/getSchoolMembers";
import { getClasses } from "../../_utils/getClasses";
import { getStudents } from "../../_utils/getStudents";
import { getStudentOverview } from "../../_utils/getStudentOverview";
import { toClassCardItem } from "../groups/_lib/mapClass";
import SchoolProfileHeader from "./_components/SchoolProfileHeader";
import SchoolTabsSection from "./_components/SchoolTabsSection";
import StudentOverviewCards from "./_components/StudentOverviewCards";

export default async function Page() {
  const user = await getUser();
  const detail = user?.schoolId ? await getSchool(user.schoolId) : null;

  if (!detail) {
    return (
      <div className="flex min-h-[calc(100dvh-12rem)] w-full items-center justify-center">
        <RoleEmptyState role={user?.schoolRole} entity="school" />
      </div>
    );
  }

  const { school, currentUserRole } = detail;
  const isAdmin = currentUserRole === "ADMIN";
  const isStudent = currentUserRole === "STUDENT";
  const location = [school.city, school.country].filter(Boolean).join(", ") || null;

  // Backend gates `GET /students` to ADMIN and `student-overview` to STUDENT, so
  // only fire each for the matching role.
  const [classes, schoolMembers, students, studentOverview] = await Promise.all([
    isAdmin ? getClasses() : Promise.resolve([]),
    user?.schoolId ? getSchoolMembers(user.schoolId) : null,
    isAdmin ? getStudents() : Promise.resolve([]),
    isStudent && user?.schoolId ? getStudentOverview(user.schoolId) : Promise.resolve(null),
  ]);
  const items = classes.map((item) => toClassCardItem(item, user?.memberId));

  // `GET /schools/:schoolId/members` returns populated rows only to admins; for
  // everyone else `members` is `[]` and only the counts above are usable.
  const teachers = isAdmin
    ? (schoolMembers?.members ?? []).filter((member) => member.role === "TEACHER")
    : [];
  const teachersError = isAdmin && schoolMembers === null;

  const classCount = detail.counts?.classes ?? classes.length;

  return (
    <section className="flex flex-col gap-6 py-6">
      <SchoolProfileHeader
        name={school.name}
        description={school.description}
        country={school.country}
        city={school.city}
        logoUrl={school.logoUrl}
        location={location}
        isActive={school.isActive}
        classCount={classCount}
        studentCount={schoolMembers?.counts.students ?? 0}
        teacherCount={schoolMembers?.counts.teachers ?? 0}
        isAdmin={isAdmin}
        role={currentUserRole}
        studentJoinCode={school.studentJoinCode}
      />

      {isStudent && studentOverview ? (
        <StudentOverviewCards
          availableClasses={studentOverview.counts.availableClasses}
          activeClasses={studentOverview.counts.activeClasses}
          pendingRequests={studentOverview.counts.pendingRequests}
        />
      ) : null}

      <SchoolTabsSection
        classItems={items}
        students={students}
        teachers={teachers}
        teachersError={teachersError}
        isAdmin={isAdmin}
        schoolId={user?.schoolId}
        role={currentUserRole}
      />
    </section>
  );
}
