import { getUser } from "../../../_utils/getUser";
import { getClass } from "../../../_utils/getClass";
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

  // The add-member pickers are class-scoped (`assignable-students` /
  // `assignable-teachers`) and fetch on demand from the dialog, so this page no
  // longer pulls the admin-only school roster up front.
  return (
    <ClassDetailView
      classItem={result.class}
      isAdmin={viewerRole === "ADMIN"}
      viewerRole={viewerRole}
    />
  );
}
