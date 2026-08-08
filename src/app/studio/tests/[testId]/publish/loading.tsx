import Skeleton from "@/components/ui/Skeleton";

/**
 * The studio's own loading shape.
 *
 * It mirrors the real layout — top bar, outline rail, document column — because
 * a centred spinner on a full-viewport canvas reads as a blank page, and the
 * design system requires a skeleton rather than a bare spinner.
 */
export default function Loading() {
  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden w-64 shrink-0 space-y-2 border-r border-border bg-card p-3 lg:block">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-6" />
          ))}
        </div>

        <div className="mx-auto w-full max-w-[900px] space-y-4 px-4 py-6 md:px-8">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </>
  );
}
