"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Label + control + hint + error, in one place.
 *
 * The label string `mb-1.5 block text-sm font-medium …` was written out in 36 files and the error
 * paragraph in 14 more, which is why field spacing and error colour had drifted between the auth
 * forms, the dialogs, and the test builder. This is the promoted version of the test builder's
 * local `Field`, which was already the best of them.
 *
 * Pass `htmlFor` when the control has its own id; otherwise `Field` generates one and hands it to
 * the child through the `id` render argument.
 */
export type FieldProps = {
  label?: ReactNode;
  /** Marks the control required and renders the affordance. Does not validate — that is zod's job. */
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  className?: string;
  /** `md` matches a standalone form; `sm` matches dense contexts like the test builder. */
  size?: "sm" | "md";
  children: ReactNode | ((props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode);
};

export default function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  className,
  size = "md",
  children,
}: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);
  // `size` drives the message as well as the label, so a dense field does not carry a
  // standalone-form-sized hint under it.
  const messageClassName = size === "md" ? "mt-1.5 text-xs" : "mt-1 text-2xs";

  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "mb-1.5 block font-medium text-foreground",
            size === "md" ? "type-label" : "text-xs",
          )}
        >
          {label}
          {required ? (
            <span aria-hidden className="ml-0.5 text-destructive">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {typeof children === "function"
        ? children({
            id,
            ...(error ? ({ "aria-invalid": true } as const) : {}),
            ...(hasMessage ? { "aria-describedby": messageId } : {}),
          })
        : children}

      {error ? (
        <p id={messageId} role="alert" className={cn(messageClassName, "text-destructive")}>
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className={cn(messageClassName, "text-muted-foreground")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { Field };
