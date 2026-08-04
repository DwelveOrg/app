import { getUser } from "../../../_utils/getUser";
import { getClass } from "../../../_utils/getClass";
import { getStudents } from "../../../_utils/getStudents";
import ClassDetailView from "./_components/ClassDetailView";
import ResourceStateView from "@/app/(root)/_components/ResourceStateView";

type PageProps = {
  params: Promise<{ classId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { classId } = await params;
  const user = await getUser();

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

  const viewerRole = user?.schoolRole ?? null;
  const isAdmin = viewerRole === "ADMIN";

  // The assign-student picker needs the school roster, which is admin-only
  // (`GET /students`), so only fetch it for admins.
  const students = isAdmin ? await getStudents() : [];

  return (
    <ClassDetailView
      classItem={result.class}
      isAdmin={isAdmin}
      viewerRole={viewerRole}
      students={students}
    />
  );
}
