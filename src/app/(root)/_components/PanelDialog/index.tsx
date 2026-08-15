"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import Dialog from "@/app/(root)/_components/Dialog";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function PanelDialog({
  icon: Icon,
  label,
  count,
  emphasis = false,
  title,
  description,
  size = "md",
  triggerClassName,
  children,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  emphasis?: boolean;
  title?: string;
  description?: string;
  size?: "md" | "lg";
  triggerClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const showCount = typeof count === "number";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        <Icon className="size-4" />
        {label}
        {showCount ? (
          <Badge
            variant={emphasis && count > 0 ? "primary" : "neutral"}
            size="xs"
            shape="count"
          >
            {count}
          </Badge>
        ) : null}
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={title ?? label}
        description={description}
        showClose
        contentClassName={cn(size === "lg" ? "max-w-3xl" : "max-w-lg")}
      >
        <div className="content-scroll -mx-1 max-h-[min(34rem,60dvh)] overflow-y-auto px-1">
          {children}
        </div>
      </Dialog>
    </>
  );
}

export { PanelDialog };
