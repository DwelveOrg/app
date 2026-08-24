import Skeleton, { SkeletonList, SkeletonPage } from "@/components/ui/Skeleton";

/** Streaming placeholder for the class list — header, tab row, class cards. */
export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-9 w-72" />
      <SkeletonList count={3} itemClassName="h-32" />
    </SkeletonPage>
  );
}
