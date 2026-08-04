"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * A switch and its label in one clickable bordered row.
 *
 * The test settings dialog and the text-answer editor each wrote this out, disagreeing only on
 * label size — so the same control read as two different controls two clicks apart. `size` keeps
 * that difference deliberate: `md` in a dialog, `sm` inside the dense builder.
 *
 * It is a `<label>`, so the whole row toggles the switch rather than just the 36px track.
 */
export default function SwitchRow({
  checked,
  onCheckedChange,
  label,
  size = "md",
  disabled,
  className,
}: Readonly<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}>) {
  return (
    <label
      className={cn(
        "interactive-flat flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5",
        "hover:border-primary/35 has-disabled:cursor-not-allowed has-disabled:opacity-60",
        className,
      )}
    >
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <span
        className={cn(
          "font-medium text-foreground",
          size === "md" ? "text-sm" : "text-xs",
        )}
      >
        {label}
      </span>
    </label>
  );
}

export { SwitchRow };
