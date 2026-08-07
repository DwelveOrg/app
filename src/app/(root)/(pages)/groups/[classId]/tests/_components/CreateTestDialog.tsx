"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Dialog from "@/app/(root)/_components/Dialog";
import {
  createTestSchema,
  type CreateTestInput,
} from "@/app/(root)/_lib/tests.actions.schemas";
import type { FormatBlueprintRegistry } from "@/app/(root)/_lib/tests.schemas";
import { cn } from "@/lib/utils";
import { formatIcon } from "../_constants";
import FormatMark from "./FormatMark";
import { useCreateTestMutation } from "../_hooks/useCreateTestMutation";
import { humanizeToken, translateKey } from "../_lib/labels";

type CreateTestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  /** Blueprints from `GET /tests/formats`; the picker is built from these. */
  formats: FormatBlueprintRegistry;
};

/**
 * Creates a draft and drops the teacher straight into the builder.
 *
 * The format is picked as cards rather than a `<select>`: it decides the sections the draft
 * starts with, it cannot be changed afterwards, and each option needs a line of explanation — all
 * of which a closed menu hides.
 *
 * It no longer decides which *question types* the test may hold. Every format now returns the
 * complete catalogue (`docs/api/test-creation.md`), so the cards describe their section layout
 * instead — the only thing the choice still determines.
 */
export default function CreateTestDialog({
  open,
  onOpenChange,
  classId,
  formats,
}: CreateTestDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const createTest = useCreateTestMutation();
  const titleId = useId();

  const formatKeys = Object.keys(formats);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTestInput>({
    resolver: zodResolver(createTestSchema),
    defaultValues: { classId, title: "", format: formatKeys[0] ?? "" },
  });

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) reset({ classId, title: "", format: formatKeys[0] ?? "" });
  };

  const onSubmit: SubmitHandler<CreateTestInput> = (values) => {
    createTest.mutate(values, {
      onSuccess: (created) => {
        toast.success(t("root.tests.create.success", { title: created.title }));
        close(false);
        router.push(`/groups/${classId}/tests/${created.id}`);
        router.refresh();
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : t("root.tests.create.error"),
        ),
    });
  };

  const isBusy = isSubmitting || createTest.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.tests.create.title")}
      description={t("root.tests.create.description")}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          htmlFor={titleId}
          label={t("root.tests.create.titleLabel")}
          required
          error={errors.title ? t("root.tests.create.titleError") : undefined}
        >
          <Input
            id={titleId}
            {...register("title")}
            placeholder={t("root.tests.create.titlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            autoFocus
          />
        </Field>

        <Controller
          control={control}
          name="format"
          render={({ field }) => (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-foreground">
                {t("root.tests.create.formatLabel")}
              </legend>

              {formatKeys.length === 0 ? (
                <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                  {t("root.tests.create.noFormats")}
                </p>
              ) : (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="gap-2"
                >
                  {formatKeys.map((format) => {
                    const blueprint = formats[format];
                    const isSelected = field.value === format;

                    return (
                      <label
                        key={format}
                        className={cn(
                          "interactive-flat flex cursor-pointer items-start gap-3 rounded-xl border p-3",
                          "has-focus-visible:ring-2 has-focus-visible:ring-ring/40",
                          isSelected
                            ? "border-primary bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                            : "border-border bg-background hover:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))]",
                        )}
                      >
                        <RadioGroupItem value={format} className="mt-1" />

                        <FormatMark
                          icon={formatIcon(format)}
                          className={cn(
                            "size-9 rounded-lg transition-colors duration-[var(--dur-1)]",
                            isSelected
                              ? "bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        />

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            {translateKey(t, blueprint.labelKey, humanizeToken(format))}
                            {/* Selection is the tint, the ring, *and* this check — never colour alone. */}
                            {isSelected ? (
                              <Check className="size-3.5 text-primary" aria-hidden="true" />
                            ) : null}
                          </span>
                          {/*
                            The label is the backend's `labelKey`; this blurb is
                            ours, so it is keyed by the format enum. A format the
                            catalogs do not describe yet falls back to a summary
                            read straight off its blueprint.
                          */}
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {t(`root.tests.create.formatDescriptions.${format}`, {
                              defaultValue: t("root.tests.create.formatFallback", {
                                sections: blueprint.sectionPresets.length,
                                types: blueprint.allowedQuestionTypes.length,
                              }),
                            })}
                          </span>

                          {/*
                            What the format actually decides, now that it no longer restricts
                            question types: the sections a new draft starts with.
                          */}
                          {blueprint.sectionPresets.length > 0 ? (
                            <span className="mt-2 flex flex-wrap gap-1">
                              {blueprint.sectionPresets.map((preset, index) => (
                                <Badge
                                  key={`${preset.kind}-${index}`}
                                  variant={isSelected ? "primary" : "neutral"}
                                  size="xs"
                                >
                                  {translateKey(
                                    t,
                                    preset.titleKey,
                                    humanizeToken(preset.kind),
                                  )}
                                </Badge>
                              ))}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </RadioGroup>
              )}
            </fieldset>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="outline" disabled={isBusy}>
              {t("root.tests.actions.cancel")}
            </Button>
          </DialogPrimitive.Close>
          <Button type="submit" loading={isBusy} disabled={formatKeys.length === 0}>
            {t("root.tests.create.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
