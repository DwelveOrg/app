import Skeleton, { SkeletonList, SkeletonPage } from "@/components/ui/Skeleton";

/**
 * Streaming placeholder for the test list: back link, header with the create
 * action, the status tabs, and the first few cards.
 */
export default function Loading() {
  return (
    <SkeletonPage backLink header="withActions" actions={1}>
      <Skeleton className="h-8 w-64 rounded-lg" />
      <SkeletonList count={3} itemClassName="h-40" />
    </SkeletonPage>
  );
}
