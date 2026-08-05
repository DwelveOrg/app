import Skeleton, { SkeletonPage } from "@/components/ui/Skeleton";
import Surface from "@/components/ui/Surface";

/**
 * Streaming placeholder for the class page: identity header, overview facts,
 * and the people panel, all of which come from `GET /classes/:classId`.
 */
export default function Loading() {
  return (
    <SkeletonPage backLink header="none">
      <Surface padding="lg">
        <div className="flex flex-wrap items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      </Surface>

      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </SkeletonPage>
  );
}
