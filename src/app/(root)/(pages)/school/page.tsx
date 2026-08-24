import RoleEmptyState from "../_components/ui/RoleEmptyState";
import { getUser } from "../../_utils/getUser";
import { getSchool } from "../../_utils/getSchool";
import { getStudentOverview } from "../../_utils/getStudentOverview";
import { getStudentSchoolClasses } from "../../_utils/getStudentSchoolClasses";
import { getTeacherSchoolClasses } from "../../_utils/getTeacherSchoolClasses";
import SchoolProfileHeader from "./_components/SchoolProfileHeader";
import SchoolDirectorySection from "./_components/SchoolDirectorySection";
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
  const isTeacher = currentUserRole === "TEACHER";
  const location = [school.city, school.country].filter(Boolean).join(", ") || null;

  // Backend gates `GET /students` to ADMIN and `student-overview` to STUDENT, so
  // only fire each for the matching role.
  // Only data visible in the base page is loaded here. Admin roster, invite,
  // student, and blocklist data lives behind management dialogs and is fetched
  // when that dialog opens; eagerly resolving it made every School navigation
  // wait for four hidden panels.
  const [studentOverview, studentClasses, teacherClasses] = await Promise.all([
    isStudent && user?.schoolId ? getStudentOverview(user.schoolId) : Promise.resolve(null),
    isStudent && user?.schoolId
      ? getStudentSchoolClasses(user.schoolId)
      : Promise.resolve(undefined),
    isTeacher && user?.schoolId
      ? getTeacherSchoolClasses(user.schoolId)
      : Promise.resolve(undefined),
  ]);

  // School detail already carries current membership authority and aggregate
  // counts. The old page fetched the full member and class directories merely
  // to reconstruct these values.
  const viewerIsOwner = detail.membership.isOwner ?? false;
  const viewerCanManageAdmins = detail.membership.canManageAdmins ?? false;
  const classCount = detail.counts?.classes ?? 0;

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
        studentCount={detail.counts?.students ?? 0}
        teacherCount={detail.counts?.teachers ?? 0}
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

      <SchoolDirectorySection
        isAdmin={isAdmin}
        schoolId={user?.schoolId}
        role={currentUserRole}
        studentCount={detail.counts?.students ?? 0}
        teacherCount={detail.counts?.teachers ?? 0}
        requestCount={studentOverview?.counts.pendingRequests}
        studentClasses={studentClasses}
        teacherClasses={teacherClasses}
        viewerMemberId={detail.membership.id}
        viewerIsOwner={viewerIsOwner}
        viewerCanManageAdmins={viewerCanManageAdmins}
      />
    </section>
  );
}
