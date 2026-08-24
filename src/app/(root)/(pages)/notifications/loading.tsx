import Skeleton, { SkeletonList, SkeletonPage } from "@/components/ui/Skeleton";

/** Streaming placeholder for notifications — header, filter tabs, rows. */
export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-9 w-80" />
      <SkeletonList count={5} itemClassName="h-16" />
    </SkeletonPage>
  );
}
