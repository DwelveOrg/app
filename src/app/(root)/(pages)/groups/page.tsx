import RoleEmptyState from "../_components/ui/RoleEmptyState";
import { getUser } from "../../_utils/getUser";
import { getClasses } from "../../_utils/getClasses";
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

  // Students get one directory: `GET /classes` returns every active class in the
  // school with their own access flags, so enrolled and joinable classes live in
  // the same list. Client-rendered so request/cancel mutations refresh it.
  if (user.schoolRole === "STUDENT") {
    return <StudentClassesView schoolId={user.schoolId} />;
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
