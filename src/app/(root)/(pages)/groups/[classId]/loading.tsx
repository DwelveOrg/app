import Skeleton from "@/components/ui/Skeleton";

/**
 * Streaming placeholder for the class page: identity header, overview facts,
 * and the two people cards, all of which come from `GET /classes/:classId`.
 */
export default function Loading() {
  return (
    <section aria-busy="true" className="flex flex-col gap-6 py-6">
      <Skeleton className="h-5 w-32" />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </section>
  );
}
