"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared geometry for every text-entry control. Exported so `Textarea` consumes the exact same
 * string instead of duplicating it — the two used to be byte-identical copies that could drift.
 */
export const fieldBaseClassName = [
  "w-full rounded-xl border text-sm text-foreground outline-none",
  "transition-[color,background-color,border-color,box-shadow] duration-[var(--dur-1)]",
  "placeholder:text-muted-foreground",
  "hover:border-border/80",
  "focus:border-ring focus:ring-3 focus:ring-ring/25",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-invalid:border-destructive aria-invalid:focus:border-destructive aria-invalid:focus:ring-destructive/25",
].join(" ");

/** Padding is a prop, not a per-call-site override — the builder used to render three heights. */
export const fieldSizeClassName = {
  sm: "px-3 py-1.5",
  md: "px-3.5 py-2.5",
  lg: "px-4 py-3",
} as const;

export type FieldSurface = "default" | "muted";
export type FieldSize = keyof typeof fieldSizeClassName;

export const fieldSurfaceClassName: Record<FieldSurface, string> = {
  default: "border-input bg-card",
  /** For inputs sitting on a `--card` panel, where a white field would disappear into it. */
  muted: "border-input bg-muted",
};

type InputProps = Omit<React.ComponentPropsWithoutRef<"input">, "size"> & {
  surface?: FieldSurface;
  size?: FieldSize;
  /**
   * Renders a reveal toggle. Defaults on for `type="password"`, which is what the three
   * hand-rolled eye buttons across the auth pages and the change-password form were doing.
   */
  showPasswordToggle?: boolean;
  /**
   * Translated labels for the reveal toggle. The product ships in three languages, so the
   * primitive cannot hard-code English here — callers pass `t(...)`.
   */
  revealLabel?: string;
  hideLabel?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      surface = "default",
      size = "lg",
      showPasswordToggle,
      revealLabel = "Show password",
      hideLabel = "Hide password",
      type,
      ...props
    },
    ref,
  ) => {
    const [revealed, setRevealed] = React.useState(false);
    const isPassword = type === "password";
    const withToggle = showPasswordToggle ?? isPassword;

    const input = (
      <input
        ref={ref}
        type={isPassword && revealed ? "text" : type}
        className={cn(
          fieldBaseClassName,
          fieldSurfaceClassName[surface],
          fieldSizeClassName[size],
          withToggle && isPassword && "pr-11",
          className,
        )}
        {...props}
      />
    );

    if (!withToggle || !isPassword) return input;

    return (
      <div className="relative">
        {input}
        {/*
          Deliberately focusable. This carried `tabIndex={-1}`, which made
          "show password" reachable by mouse only — a WCAG 2.1.1 failure on
          every password field in the product (login, signup, reset, change).
          A keyboard user could not verify what they had typed.
        */}
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? hideLabel : revealLabel}
          aria-pressed={revealed}
          className={cn(
            "absolute inset-y-1 right-1 grid w-9 cursor-pointer place-items-center rounded-lg",
            "text-muted-foreground transition-colors duration-[var(--dur-1)]",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        >
          {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
export { Input };
