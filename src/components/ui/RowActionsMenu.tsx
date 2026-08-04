"use client";

import { MoreVertical, type LucideIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * The overflow menu at the end of a row or on the corner of a card.
 *
 * The two roster tabs and the class card each built this out of raw `DropdownMenu` parts, and had
 * already drifted: two different trigger sizes, three different content widths, and the destructive
 * item styled by hand in each place. A "remove" that looks different on two screens reads as two
 * different levels of danger.
 *
 * `destructive` is a flag rather than a caller-supplied class so the danger treatment can never be
 * half-applied — every menu's last-resort action looks the same.
 */
export type RowAction = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /**
   * Keep the menu open on select. Needed when the action opens a dialog: closing the menu in the
   * same tick moves focus while the dialog is mounting, and focus lands back on the trigger.
   */
  keepOpen?: boolean;
};

export type RowActionsMenuProps = {
  /** Accessible name for the trigger — include the row's subject, e.g. "Actions for Aziza". */
  label: string;
  actions: RowAction[];
  align?: "start" | "end";
  /**
   * `flat` sits in a table cell or list row. `floating` overlays a card, so it carries its own
   * backdrop and stops the click from reaching the card's link.
   */
  variant?: "flat" | "floating";
  className?: string;
  contentClassName?: string;
};

export default function RowActionsMenu({
  label,
  actions,
  align = "end",
  variant = "flat",
  className,
  contentClassName,
}: Readonly<RowActionsMenuProps>) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={cn(
            "shrink-0",
            variant === "floating" && "rounded-full bg-card/80 backdrop-blur",
            className,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreVertical aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className={cn("w-48", contentClassName)}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              onSelect={(event) => {
                if (action.keepOpen) event.preventDefault();
                action.onSelect();
              }}
              className={cn(action.destructive && "text-destructive focus:text-destructive")}
            >
              {Icon ? <Icon aria-hidden className="size-4" /> : null}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { RowActionsMenu };
