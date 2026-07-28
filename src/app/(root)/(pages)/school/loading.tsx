import Skeleton from "@/components/ui/Skeleton";

/**
 * Streaming placeholder for the School page. The header, overview cards, and
 * the roster tabs (classes, teachers, students) are all server-rendered from
 * backend requests, so this stands in until those resolve.
 */
export default function Loading() {
  return (
    <section aria-busy="true" className="flex flex-col gap-6 py-6">
      <Skeleton className="h-40 rounded-2xl" />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-9 w-72" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
