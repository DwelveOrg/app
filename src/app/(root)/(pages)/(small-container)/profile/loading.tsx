import Skeleton, { SkeletonPage } from "@/components/ui/Skeleton";

/** Streaming placeholder for the account area — identity header, tab bar, panel. */
export default function Loading() {
  return (
    <SkeletonPage header="none">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-9 w-80" />
      <Skeleton className="h-64 rounded-2xl" />
    </SkeletonPage>
  );
}
