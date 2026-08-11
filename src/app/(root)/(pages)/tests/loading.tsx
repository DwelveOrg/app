import Skeleton, { SkeletonList, SkeletonPage } from "@/components/ui/Skeleton";

/** Streaming placeholder that matches the library header, filters, and cards. */
export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-64 rounded-lg" />
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 min-w-0 flex-1 sm:max-w-xs" />
        <Skeleton className="h-9 w-full sm:w-56" />
      </div>
      <SkeletonList count={3} itemClassName="h-40" />
    </SkeletonPage>
  );
}
