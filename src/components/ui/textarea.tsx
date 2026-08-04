"use client";

import * as React from "react";

import {
  fieldBaseClassName,
  fieldSizeClassName,
  fieldSurfaceClassName,
  type FieldSize,
  type FieldSurface,
} from "@/components/ui/Input";
import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> & {
  surface?: FieldSurface;
  fieldSize?: FieldSize;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, surface = "default", fieldSize = "lg", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          fieldBaseClassName,
          fieldSurfaceClassName[surface],
          fieldSizeClassName[fieldSize],
          "resize-y",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
export { Textarea };
