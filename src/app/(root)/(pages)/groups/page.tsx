import RoleEmptyState from "../_components/ui/RoleEmptyState";
import { getUser } from "../../_utils/getUser";
import { getClasses } from "../../_utils/getClasses";
import { getMyClasses } from "../../_utils/getMyClasses";
import ClassesView from "./_components/ClassesView";
import StudentClassesView from "./_components/StudentClassesView";
import TeacherClassesView from "./_components/TeacherClassesView";
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

  // Students see My Classes: only their ACTIVE roster classes (`GET /me/classes`),
  // plus the Discover / Requests entry points. School membership does not imply
  // class enrollment, so this is deliberately separate from the school directory.
  if (user.schoolRole === "STUDENT") {
    const classes = await getMyClasses();
    const items = classes.map((item) => toClassCardItem(item, user.memberId));
    return <StudentClassesView items={items} schoolId={user.schoolId} />;
  }

  // Teachers now see every active class in the school (`GET /classes` returns
  // request/enter flags), so they browse and request to teach from a client
  // surface that refreshes on request/cancel and notification actions.
  if (user.schoolRole === "TEACHER") {
    return <TeacherClassesView schoolId={user.schoolId} />;
  }

  // Admin: `GET /classes` is the whole school directory.
  const classes = await getClasses();
  const items = classes.map((item) => toClassCardItem(item, user.memberId));

  return <ClassesView items={items} role={user.schoolRole ?? null} />;
}
