"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export default function ExamPopover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  panelClassName,
  className,
  label,
}: {
  trigger: (state: { open: boolean }) => ReactNode;
  children: (state: { close: () => void }) => ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  panelClassName?: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "interactive-flat inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2",
          "text-13 font-semibold text-foreground outline-none",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
          open && "bg-muted",
        )}
      >
        {trigger({ open })}
      </button>

      {open ? (
        <div
          id={panelId}
          className={cn(
            "absolute z-40 min-w-[14rem] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-elev-4",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            align === "end" && "right-0",
            align === "center" && "left-1/2 -translate-x-1/2",
            align === "start" && "left-0",
            panelClassName,
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      ) : null}
    </div>
  );
}
