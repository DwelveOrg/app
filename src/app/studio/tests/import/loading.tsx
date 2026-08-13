import Skeleton from "@/components/ui/Skeleton";

/**
 * The import screen's loading shape — top bar, then the dropzone it is about to
 * render. A centred spinner on a full-viewport canvas reads as a blank page,
 * which is why the design system asks for a skeleton instead.
 */
export default function Loading() {
  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 md:px-8">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-6 w-56" />
          <Skeleton className="mx-auto h-4 w-72" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    </>
  );
}
