import Skeleton from "@/components/ui/Skeleton";

/**
 * Streaming placeholder for the test list: back link, header with the create
 * action, the status tabs, and the first few cards.
 */
export default function Loading() {
  return (
    <section aria-busy="true" className="flex flex-col gap-6 py-6">
      <Skeleton className="h-5 w-32" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <Skeleton className="h-8 w-64 rounded-lg" />

      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
