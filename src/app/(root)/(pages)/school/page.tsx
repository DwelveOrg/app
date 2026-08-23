import RoleEmptyState from "../_components/ui/RoleEmptyState";
import { getUser } from "../../_utils/getUser";
import { getSchool } from "../../_utils/getSchool";
import { getSchoolMembers } from "../../_utils/getSchoolMembers";
import { getSchoolBlocklist, getTeacherInvites } from "../../_utils/getSchoolAccess";
import { getClasses } from "../../_utils/getClasses";
import { getStudents } from "../../_utils/getStudents";
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
  const [
    classes,
    schoolMembers,
    students,
    studentOverview,
    studentClasses,
    teacherClasses,
    teacherInvites,
    blocklist,
  ] = await Promise.all([
    isAdmin ? getClasses() : Promise.resolve([]),
    user?.schoolId ? getSchoolMembers(user.schoolId) : null,
    isAdmin ? getStudents() : Promise.resolve([]),
    isStudent && user?.schoolId ? getStudentOverview(user.schoolId) : Promise.resolve(null),
    isStudent && user?.schoolId
      ? getStudentSchoolClasses(user.schoolId)
      : Promise.resolve(undefined),
    isTeacher && user?.schoolId
      ? getTeacherSchoolClasses(user.schoolId)
      : Promise.resolve(undefined),
    // Both are ADMIN-gated on the backend, so they are only worth asking for
    // when the viewer is one; for everyone else they stay `null` and the
    // Access panel is not rendered at all.
    isAdmin && user?.schoolId ? getTeacherInvites(user.schoolId) : Promise.resolve(null),
    isAdmin && user?.schoolId ? getSchoolBlocklist(user.schoolId) : Promise.resolve(null),
  ]);

  // `GET /schools/:schoolId/members` returns populated rows only to admins; for
  // everyone else `members` is `[]` and only the counts above are usable.
  const roster = isAdmin ? (schoolMembers?.members ?? []) : [];
  const teachers = roster.filter((member) => member.role === "TEACHER");
  const admins = roster.filter((member) => member.role === "ADMIN");
  const teachersError = isAdmin && schoolMembers === null;

  // The viewer's own membership row carries the two facts that decide what the
  // Access panel offers. Read from the roster rather than the session, because
  // the session's role claim predates the owner/permission split and a promoted
  // admin should not have to log out and back in to see their new controls.
  const viewerMembership = roster.find((member) => member.memberId === user?.memberId);
  const viewerIsOwner = viewerMembership?.isOwner ?? false;
  const viewerCanManageAdmins = viewerMembership?.canManageAdmins ?? false;

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

      <SchoolDirectorySection
        students={students}
        teachers={teachers}
        admins={admins}
        teachersError={teachersError}
        isAdmin={isAdmin}
        schoolId={user?.schoolId}
        role={currentUserRole}
        requestCount={studentOverview?.counts.pendingRequests}
        studentClasses={studentClasses}
        teacherClasses={teacherClasses}
        teacherInvites={teacherInvites?.invites ?? []}
        teacherInvitesError={isAdmin && teacherInvites === null}
        blocklist={blocklist?.entries ?? []}
        blocklistError={isAdmin && blocklist === null}
        viewerMemberId={user?.memberId}
        viewerIsOwner={viewerIsOwner}
        viewerCanManageAdmins={viewerCanManageAdmins}
      />
    </section>
  );
}
