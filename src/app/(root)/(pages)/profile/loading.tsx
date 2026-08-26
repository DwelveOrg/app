import Skeleton, { SkeletonPage } from "@/components/ui/Skeleton";

/**
 * Streaming placeholder for the account area — title, tab bar, and the two
 * panel columns.
 *
 * The cap and the `lg:grid-cols-2` split are repeated from `profile.client`
 * deliberately: a skeleton laid out to a different measure than the page it
 * stands in for reflows the whole screen the moment the data lands, which is
 * the one thing a skeleton exists to prevent. This used to open with a bare
 * avatar row, which the real page has never rendered in that position.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1040px]">
      <SkeletonPage header="simple">
        <Skeleton className="h-9 w-80 rounded-lg" />

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>

          <div className="space-y-6">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
          </div>
        </div>
      </SkeletonPage>
    </div>
  );
}
