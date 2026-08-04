"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/**
 * Small shared building blocks for the answer-key editors, so six editors share
 * one look and one set of interaction rules instead of repeating inline markup.
 *
 * The label/hint wrapper that used to live here is now `@/components/ui/Field` — this file was
 * where the good version was written, and it was promoted rather than copied. `size="sm"` is the
 * density it had here. Re-exported so the editors' existing `from "./fields"` imports still work.
 */
export { default as Field } from "@/components/ui/Field";

/**
 * A numeric input backed by a `number | null` field. An empty box means "not
 * set", never `NaN` — `valueAsNumber` would produce one and the payload builder
 * would then have to guess.
 */
export function NumberField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  placeholder,
  min,
  max,
  step,
  disabled,
  className,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  hint?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();

  return (
    <Field label={label} hint={hint} htmlFor={id} className={className} size="sm">
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={Boolean(fieldState.error)}
            className="py-2"
            value={
              field.value === null || field.value === undefined
                ? ""
                : String(field.value)
            }
            onChange={(event) => {
              const raw = event.target.value;
              field.onChange(raw === "" ? null : Number(raw));
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
        )}
      />
    </Field>
  );
}

/**
 * A text input for one row of an ordered list, wired through `Controller` so an
 * empty required value shows up on the row itself.
 *
 * Option text is required because the backend rejects a blank option with a
 * 400 — an unfinished option cannot be saved and quietly fixed later, so the
 * builder has to say so at the row.
 */
export function RowTextInput<TFieldValues extends FieldValues>({
  control,
  name,
  placeholder,
  ariaLabel,
  disabled,
  className,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <span className="min-w-0 flex-1">
          <Input
            {...field}
            value={typeof field.value === "string" ? field.value : ""}
            disabled={disabled}
            placeholder={placeholder}
            aria-label={ariaLabel}
            aria-invalid={Boolean(fieldState.error)}
            className={cn("py-2", className)}
          />
          {fieldState.error?.message ? (
            <span className="mt-1 block text-2xs text-destructive">
              {t(fieldState.error.message)}
            </span>
          ) : null}
        </span>
      )}
    />
  );
}

/**
 * Up / down / remove for one row of an ordered list.
 *
 * Reordering is buttons, not drag-and-drop: no DnD library exists in this repo,
 * and buttons are reachable by keyboard and touch, which `dnd-kit` is not by
 * default. Order is array position — nothing is sent to the backend for it.
 */
export function RowControls({
  index,
  count,
  onMove,
  onRemove,
  canRemove = true,
  moveUpLabel,
  moveDownLabel,
  removeLabel,
  disabled,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  canRemove?: boolean;
  moveUpLabel: string;
  moveDownLabel: string;
  removeLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={moveUpLabel}
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={moveDownLabel}
        disabled={disabled || index >= count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={removeLabel}
        className="text-muted-foreground hover:text-destructive"
        disabled={disabled || !canRemove}
        onClick={() => onRemove(index)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
