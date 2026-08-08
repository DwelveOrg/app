"use client";

import React, { useId } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
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
 * Kept alongside the drag handle rather than replaced by it: a handle is faster
 * but needs a sustained drag, and these are the reliable path for touch, for
 * motor impairment, and for anyone who simply does not discover the handle. See
 * `SortableList` for the full reasoning. Order is array position — nothing is
 * sent to the backend for it.
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

/**
 * A heading above one part of a question editor.
 *
 * Every editor has two or three of these ("Options", "Accepted answers", "Word
 * limit"), and they were inline `text-xs font-medium` spans in six files that
 * had already drifted by a weight.
 */
export function EditorLabel({
  children,
  hint,
  action,
}: {
  children: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="text-xs font-semibold text-foreground">{children}</span>
      {hint ? <span className="text-2xs text-muted-foreground">{hint}</span> : null}
      {action ? <span className="ml-auto">{action}</span> : null}
    </div>
  );
}

/**
 * The correct-answer marker.
 *
 * A check icon and the word "Correct" beside the tint, never the tint alone —
 * this product grades answers, and `docs/design/design-system.md` forbids
 * signalling correctness by colour. Extracted because five editors draw it.
 */
export function CorrectMark({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-semibold text-success">
      <Check className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

/**
 * A list of short strings edited as chips: type, press Enter, get a chip.
 *
 * This is the accepted-answers control. The previous version was a
 * `useFieldArray` of full-width inputs with up/down/remove buttons on each —
 * roughly 40px of chrome per row for a value like "twentieth century". IELTS
 * answers routinely have three or four accepted spellings, so the list is the
 * common case and it needs to be compact enough to read at a glance.
 *
 * Values are held as `{ value }` objects because `useFieldArray` requires object
 * items; the wrapper is invisible from here.
 */
export function ChipListInput({
  values,
  onChange,
  placeholder,
  addLabel,
  removeLabel,
  emptyLabel,
  disabled,
  maxLength = 2_000,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  addLabel: string;
  removeLabel: (value: string) => string;
  emptyLabel: string;
  disabled?: boolean;
  maxLength?: number;
}) {
  const [draft, setDraft] = React.useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    // Duplicates would be dead weight in the grader, and silently dropping one
    // is friendlier than an error for what is almost always a mistyped repeat.
    if (!values.includes(trimmed)) onChange([...values, trimmed]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background p-2",
          disabled && "opacity-60",
        )}
      >
        {values.length === 0 ? (
          <span className="px-1 text-2xs text-muted-foreground">{emptyLabel}</span>
        ) : null}

        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="inline-flex max-w-full items-center gap-1 rounded-lg bg-[color-mix(in_srgb,var(--success)_14%,transparent)] py-1 pr-1 pl-2 text-xs font-medium text-success"
          >
            <span className="truncate">{value}</span>
            <button
              type="button"
              disabled={disabled}
              aria-label={removeLabel(value)}
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="grid size-4 shrink-0 cursor-pointer place-items-center rounded outline-none hover:bg-success/20 focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}

        <input
          value={draft}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={values.length === 0 ? placeholder : ""}
          aria-label={addLabel}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              // Enter inside a form submits it; an accepted answer is not a
              // reason to save the whole test.
              event.preventDefault();
              commit();
              return;
            }
            if (event.key === "Backspace" && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          // Committing on blur means a teacher who types an answer and clicks
          // straight to the next question does not lose it.
          onBlur={commit}
          className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
