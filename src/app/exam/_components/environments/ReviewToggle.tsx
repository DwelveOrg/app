"use client";

import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";

export default function ReviewToggle({
  pressed,
  onToggle,
  label,
  pressedLabel,
  className,
  disabled = false,
}: {
  pressed: boolean;
  onToggle: () => void;
  label: string;
  pressedLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "interactive-flat inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-13 font-medium outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        pressed
          ? "bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-warning"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <Flag className={cn("size-3.5", pressed && "fill-current")} aria-hidden="true" />
      {pressed ? pressedLabel : label}
    </button>
  );
}
