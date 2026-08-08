import { permanentRedirect } from "next/navigation";

import { studioRoutes } from "@/app/(root)/_constants/tests";

type PageProps = {
  params: Promise<{ classId: string; testId: string }>;
};

/**
 * The builder used to live here, inside the dashboard shell. It now lives in
 * the studio (`/studio/tests/[testId]`), which has its own environment.
 *
 * This route stays as a redirect rather than being deleted, because the URL is
 * in teachers' history and bookmarks and — more importantly — in the
 * `TEST_PUBLISHED` notification payloads the backend has already written. A 404
 * for a test that still exists is the worst possible answer to either.
 *
 * `permanentRedirect` rather than `redirect`: the move is not conditional and
 * the old path will never serve a page again.
 */
export default async function Page({ params }: PageProps) {
  const { testId } = await params;
  permanentRedirect(studioRoutes.builder(testId));
}
