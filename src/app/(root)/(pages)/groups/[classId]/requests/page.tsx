import { redirect } from "next/navigation";

import { getUser } from "../../../../_utils/getUser";
import { getClass } from "../../../../_utils/getClass";
import ClassRequestsView from "../_components/ClassRequestsView";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";

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

  const result = await getClass(classId);
  if (!result.ok) {
    return (
      <ResourceStateView
        reason={result.reason}
        namespace="root.classDetail"
        backHref="/groups"
        backLabelKey="root.classDetail.back"
        retryLabelKey="root.classDetail.states.retry"
        actionLabelKey="root.classDetail.states.backToClasses"
      />
    );
  }

  return (
    <ClassRequestsView
      classId={classId}
      className={result.class.name}
      isAdmin={user.schoolRole === "ADMIN"}
      initialTab={tab === "teachers" ? "teachers" : "students"}
    />
  );
}
