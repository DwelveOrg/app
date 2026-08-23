import { redirect } from "next/navigation";

import { getUser } from "@/app/(root)/_utils/getUser";
import { getClass } from "@/app/(root)/_utils/getClass";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import { getTestFormats } from "@/app/(root)/_utils/getTestFormats";
import StudioError, { StudioForbidden } from "../../_components/StudioError";
import NewTestScreen from "./_components/NewTestScreen";

type PageProps = {
  searchParams: Promise<{ class?: string }>;
};

/**
 * Creating a test (ADMIN + TEACHER).
 *
 * The class arrives as a query parameter rather than a path segment because
 * this route creates a resource that does not exist yet — there is nothing to
 * put at `/studio/tests/<id>` until the draft is made, and a path like
 * `/studio/classes/<id>/tests/new` would make the studio's URL space mirror the
 * dashboard's for one transient screen.
 *
 * The catalogue is loaded here, server-side, so the format preview renders from
 * the same registry the builder will use.
 */
export default async function Page({ searchParams }: PageProps) {
  const { class: classId } = await searchParams;

  if (!classId) redirect("/groups");

  const user = await getUser();
  const viewerRole = user?.schoolRole ?? null;
  const exitHref = studioRoutes.classTests(classId);

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <StudioForbidden
        exitHref={`/groups/${classId}`}
        exitLabelKey="root.tests.list.backToClass"
        titleKey="root.tests.create.title"
      />
    );
  }

  const [catalog, classResult] = await Promise.all([getTestFormats(), getClass(classId)]);

  if (!catalog) {
    return (
      <StudioError
        reason="error"
        exitHref={exitHref}
        exitLabelKey="root.tests.builder.backToTests"
        titleKey="root.tests.create.title"
      />
    );
  }

  return (
    <NewTestScreen
      classId={classId}
      className={classResult.ok ? classResult.class.name : null}
      catalog={catalog}
    />
  );
}
