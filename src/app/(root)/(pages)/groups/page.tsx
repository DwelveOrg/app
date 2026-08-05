import RoleEmptyState from "../_components/ui/RoleEmptyState";
import { getUser } from "../../_utils/getUser";
import { getClasses } from "../../_utils/getClasses";
import ClassesView from "./_components/ClassesView";
import StudentClassesView from "./_components/StudentClassesView";
import { toClassCardItem } from "./_lib/mapClass";

export default async function Page() {
  const user = await getUser();

  // No membership yet — keep the join/create entry point instead of an empty grid.
  if (!user?.membershipCount) {
    return (
      <div className="flex min-h-[calc(100dvh-12rem)] w-full items-center justify-center">
        <RoleEmptyState role={user?.schoolRole} entity="class" />
      </div>
    );
  }

  // A student's page is about decisions, not a directory: classes to enter,
  // requests awaiting approval, and classes they may ask to join. Only
  // `GET /schools/:schoolId/classes` carries those flags — `GET /classes`
  // returns active enrolments alone, which cannot express the other states.
  if (user.schoolRole === "STUDENT") {
    return <StudentClassesView schoolId={user.schoolId} />;
  }

  // Staff: `GET /classes` is the caller's own class list — teaching assignments
  // for teachers, the full directory for admins.
  const classes = await getClasses();
  const items = classes.map((item) => toClassCardItem(item, user.memberId));

  return <ClassesView items={items} role={user.schoolRole ?? null} />;
}
