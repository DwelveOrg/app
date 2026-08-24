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
 * Class join-requests management. Owner and admins only — approving a request
 * is a membership decision, and the backend refuses it for anyone else.
 * Students manage their own requests from `/groups/requests`. The backend is
 * the real security boundary; this gate just keeps the surface off the screens
 * that cannot act on it.
 */
export default async function Page({ params, searchParams }: PageProps) {
  const { classId } = await params;
  const { tab } = await searchParams;
  // Fetched together: getClass is authorised on the backend by the same
  // session, so starting it before the role gate leaks nothing — a non-admin
  // merely discards the response it paid for, and the common (admin) path
  // saves a full sequential round trip.
  const [user, result] = await Promise.all([getUser(), getClass(classId)]);

  if (user?.schoolRole !== "ADMIN") {
    redirect("/groups");
  }

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
      isAdmin
      initialTab={tab === "teachers" ? "teachers" : "students"}
    />
  );
}
