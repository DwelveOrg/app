import Skeleton, { SkeletonPage } from "@/components/ui/Skeleton";

/**
 * Streaming placeholder for the builder: back link, the test header with its
 * meta row, one section shell, and the sticky action bar.
 */
export default function Loading() {
  return (
    <SkeletonPage backLink header="withActions">
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
    </SkeletonPage>
  );
}
