import { redirect } from "next/navigation";

import { getUser } from "@/app/(root)/_utils/getUser";
import { getClass } from "@/app/(root)/_utils/getClass";
import { getTestFormats } from "@/app/(root)/_utils/getTestFormats";
import StudioError, { StudioForbidden } from "../../_components/StudioError";
import ImportScreen from "./_components/ImportScreen";

type PageProps = {
  searchParams: Promise<{ class?: string }>;
};

/**
 * Creating a test from a PDF (ADMIN + TEACHER).
 *
 * Sits beside `/studio/tests/new` rather than inside it: both routes create a
 * test that does not exist yet, and both take the class as a query parameter
 * for the same reason — there is nothing to put at `/studio/tests/<id>` until
 * the draft is made. What differs is only where the questions come from, which
 * is a big enough difference to be its own screen and too small to be its own
 * section of the URL space.
 *
 * The format catalogue is loaded server-side so the destination format renders
 * from the same registry the builder will use.
 */
export default async function Page({ searchParams }: PageProps) {
  const { class: classId } = await searchParams;

  if (!classId) redirect("/groups");

  const user = await getUser();
  const viewerRole = user?.schoolRole ?? null;
  const exitHref = `/groups/${classId}/tests`;

  if (viewerRole !== "ADMIN" && viewerRole !== "TEACHER") {
    return (
      <StudioForbidden
        exitHref={`/groups/${classId}`}
        exitLabel="Back to class"
        title="Import a test"
      />
    );
  }

  const [catalog, classResult] = await Promise.all([getTestFormats(), getClass(classId)]);

  if (!catalog) {
    return (
      <StudioError
        reason="error"
        exitHref={exitHref}
        exitLabel="Back to tests"
        title="Import a test"
      />
    );
  }

  if (!classResult.ok) {
    return (
      <StudioError
        reason={classResult.reason}
        exitHref={exitHref}
        exitLabel="Back to tests"
        title="Import a test"
      />
    );
  }

  return (
    <ImportScreen
      classId={classId}
      className={classResult.class.name}
      catalog={catalog}
    />
  );
}
