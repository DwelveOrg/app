import Skeleton from "@/components/ui/Skeleton";

/**
 * Streaming placeholder for the builder: back link, the test header with its
 * meta row, one section shell, and the sticky action bar.
 */
export default function Loading() {
  return (
    <section aria-busy="true" className="flex flex-col gap-6 py-6">
      <Skeleton className="h-5 w-32" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
    </section>
  );
}
