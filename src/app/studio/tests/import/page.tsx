import { redirect } from "next/navigation";

import { getUser } from "@/app/(root)/_utils/getUser";
import { getClass } from "@/app/(root)/_utils/getClass";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import StudioError, { StudioForbidden } from "../../_components/StudioError";
import ImportScreen from "./_components/ImportScreen";

type PageProps = {
  searchParams: Promise<{ class?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { class: classId } = await searchParams;

  if (!classId) redirect("/groups");

  // One wave, not two — the class read is session-authorised, so a forbidden
  // viewer merely discards it.
  const [user, classResult] = await Promise.all([getUser(), getClass(classId)]);
  const viewerRole = user?.schoolRole ?? null;
  const exitHref = studioRoutes.classTests(classId);

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <StudioForbidden
        exitHref={`/groups/${classId}`}
        exitLabelKey="root.tests.list.backToClass"
        titleKey="root.tests.import.title"
      />
    );
  }


  if (!classResult.ok) {
    return (
      <StudioError
        reason={classResult.reason}
        exitHref={exitHref}
        exitLabelKey="root.tests.builder.backToTests"
        titleKey="root.tests.import.title"
      />
    );
  }

  return <ImportScreen classId={classId} className={classResult.class.name} />;
}
