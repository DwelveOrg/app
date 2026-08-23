"use client";

import { createContext, useContext, useId, useMemo, type ReactNode } from "react";

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
/**
 * What `Field` computed and the control needs to carry.
 *
 * Passed through context rather than only through the render-prop argument
 * because the render prop was optional and almost nobody used it: of 57 call
 * sites, 46 passed plain children, and every one of those rendered a
 * `<label for>` pointing at an id no element had. The label was decorative, the
 * error was never announced, and clicking the label focused nothing. A control
 * that reads this gets wired whichever way it is nested.
 */
type FieldWiring = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

const FieldContext = createContext<FieldWiring | null>(null);

/**
 * Read the enclosing `Field`'s wiring, or `null` when there is none.
 *
 * A control merges this **under** its own props: an explicit `id` or
 * `aria-describedby` at the call site is a deliberate override and wins.
 */
export function useFieldWiring() {
  return useContext(FieldContext);
}

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

  const wiring = useMemo<FieldWiring>(
    () => ({
      id,
      ...(error ? ({ "aria-invalid": true } as const) : {}),
      ...(hasMessage ? { "aria-describedby": messageId } : {}),
    }),
    [id, error, hasMessage, messageId],
  );

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

      <FieldContext.Provider value={wiring}>
        {typeof children === "function" ? children(wiring) : children}
      </FieldContext.Provider>

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
