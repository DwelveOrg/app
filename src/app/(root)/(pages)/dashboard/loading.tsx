import Skeleton, { SkeletonPage } from "@/components/ui/Skeleton";

/**
 * Streaming placeholder for the dashboard. This is the most-visited route and
 * its render waits on the widest backend fan-out in the product, so the click
 * must paint something immediately — greeting row, stat tiles, then the two
 * composer columns.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-8 w-72 rounded-lg" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </SkeletonPage>
  );
}
