import RoleEmptyState from "../_components/ui/RoleEmptyState";
import { getUser } from "../../_utils/getUser";
import { getClasses } from "../../_utils/getClasses";
import ClassesView from "./_components/ClassesView";
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

  // `GET /classes` is the user's actual class list: active enrollments for
  // students, teaching assignments for teachers, and the full directory for
  // admins. Requestable classes live exclusively on the School page.
  const classes = await getClasses();
  const items = classes.map((item) => toClassCardItem(item, user.memberId));

  return <ClassesView items={items} role={user.schoolRole ?? null} />;
}
