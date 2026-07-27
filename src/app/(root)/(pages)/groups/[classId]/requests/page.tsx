import { notFound, redirect } from "next/navigation";

import { getUser } from "../../../../_utils/getUser";
import { getClass } from "../../../../_utils/getClass";
import ClassRequestsView from "../_components/ClassRequestsView";

type PageProps = {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

/**
 * Class join-requests management. Teachers and admins only — students manage
 * their own requests from `/groups/requests`. The backend is the real security
 * boundary; this gate just hides the surface from students.
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { classId } = await params;
  const { tab } = await searchParams;
  const user = await getUser();

  if (user?.schoolRole !== "ADMIN" && user?.schoolRole !== "TEACHER") {
    redirect("/groups");
  }

  const classItem = await getClass(classId);
  if (!classItem) {
    notFound();
  }

  return (
    <ClassRequestsView
      classId={classId}
      className={classItem.name}
      isAdmin={user.schoolRole === "ADMIN"}
      initialTab={tab === "teachers" ? "teachers" : "students"}
    />
  );
}
