import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The "up one level" link above a detail page's header.
 *
 * The class page, the test list, and the builder each wrote this same anchor out by hand, which is
 * how three pages one click apart ended up with the same link at three slightly different gaps.
 *
 * It is a link, not a history `back()`: a teacher can arrive at a test from a notification or a
 * pasted URL, where "back" would leave the product entirely.
 */
export default function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "interactive-flat inline-flex w-fit items-center gap-1.5 rounded-lg text-sm text-muted-foreground",
        "outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

export { BackLink };
