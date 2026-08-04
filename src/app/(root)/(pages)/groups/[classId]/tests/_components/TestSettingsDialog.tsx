"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import type { ApiTestDetail } from "@/app/(root)/_lib/tests.schemas";
import {
  testSettingsFormSchema,
  type TestSettingsForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import Dialog from "@/app/(root)/_components/Dialog";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUpdateTestMutation } from "../_hooks/useSaveTestStructureMutation";
import { Field, NumberField } from "./editors/fields";

type TestSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: ApiTestDetail;
};

/** `2026-08-02T09:30:00.000Z` -> `2026-08-02T09:30`, what the input expects. */
function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoOrNull(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Test metadata — title, timing, and the availability window.
 *
 * Kept apart from the builder form on purpose: the structure save is one
 * `PUT /structure` and metadata is one `PATCH /tests/:testId`. Folding them
 * together would make "save" two requests that can half-fail.
 */
export default function TestSettingsDialog({
  open,
  onOpenChange,
  test,
}: TestSettingsDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const updateTest = useUpdateTestMutation();

  const defaultValues: TestSettingsForm = {
    title: test.title,
    description: test.description ?? "",
    instructions: test.instructions ?? "",
    durationMinutes: test.durationMinutes ?? null,
    passingScore: test.passingScore ?? null,
    shuffleQuestions: test.shuffleQuestions ?? false,
    availableFrom: toLocalInputValue(test.availableFrom),
    availableUntil: toLocalInputValue(test.availableUntil),
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TestSettingsForm>({
    resolver: zodResolver(testSettingsFormSchema),
    defaultValues,
  });

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) reset(defaultValues);
  };

  const onSubmit: SubmitHandler<TestSettingsForm> = (values) => {
    updateTest.mutate(
      {
        testId: test.id,
        title: values.title,
        description: values.description,
        instructions: values.instructions,
        durationMinutes: values.durationMinutes,
        passingScore: values.passingScore,
        shuffleQuestions: values.shuffleQuestions,
        availableFrom: toIsoOrNull(values.availableFrom),
        availableUntil: toIsoOrNull(values.availableUntil),
      },
      {
        onSuccess: () => {
          toast.success(t("root.tests.settings.success"));
          onOpenChange(false);
          router.refresh();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.tests.errorGeneric"),
          ),
      },
    );
  };

  const isBusy = isSubmitting || updateTest.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.tests.settings.title")}
      description={t("root.tests.settings.description")}
      contentClassName="max-w-lg"
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label={t("root.tests.settings.titleLabel")}>
          <Input
            {...register("title")}
            aria-invalid={Boolean(errors.title)}
            size="md"
          />
          {errors.title ? (
            <p className="mt-1 text-2xs text-destructive">
              {t("root.tests.settings.titleRequired")}
            </p>
          ) : null}
        </Field>

        <Field label={t("root.tests.settings.descriptionLabel")}>
          <Textarea {...register("description")} rows={2} fieldSize="md" />
        </Field>

        <Field
          label={t("root.tests.settings.instructionsLabel")}
          hint={t("root.tests.settings.instructionsHint")}
        >
          <Textarea {...register("instructions")} rows={3} fieldSize="md" />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            control={control}
            name="durationMinutes"
            label={t("root.tests.settings.duration")}
            min={1}
            step={1}
          />
          <NumberField
            control={control}
            name="passingScore"
            label={t("root.tests.settings.passingScore")}
            hint={t("root.tests.settings.passingScoreHint")}
            min={0}
            step={1}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("root.tests.settings.availableFrom")}>
            <Input
              type="datetime-local"
              {...register("availableFrom")}
              size="md"
            />
          </Field>
          <Field label={t("root.tests.settings.availableUntil")}>
            <Input
              type="datetime-local"
              {...register("availableUntil")}
              aria-invalid={Boolean(errors.availableUntil)}
              size="md"
            />
            {errors.availableUntil ? (
              <p className="mt-1 text-2xs text-destructive">
                {t("root.tests.settings.windowInvalid")}
              </p>
            ) : null}
          </Field>
        </div>

        <Controller
          control={control}
          name="shuffleQuestions"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              <span className="text-sm font-medium text-foreground">
                {t("root.tests.settings.shuffle")}
              </span>
            </label>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="outline" disabled={isBusy}>
              {t("root.tests.actions.cancel")}
            </Button>
          </DialogPrimitive.Close>
          <Button type="submit" disabled={isBusy}>
            {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.tests.actions.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
