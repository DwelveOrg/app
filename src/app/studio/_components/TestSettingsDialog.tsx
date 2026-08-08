"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { ApiTestDetail } from "@/app/(root)/_lib/tests.schemas";
import {
  testSettingsFormSchema,
  type TestSettingsForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import { useUpdateTestMutation } from "@/app/(root)/_hooks/useTests";
import Dialog, { DialogFooterActions } from "@/app/(root)/_components/Dialog";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { Field } from "./editors/fields";
import { toIsoOrNull, toLocalInputValue } from "../_lib/datetime";

type TestSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: ApiTestDetail;
};

/**
 * The test's identity: title, description, and the instructions students read
 * before they start.
 *
 * Timing, availability, and the passing score used to live here too. They moved
 * into the publish wizard, where they belong — they are decisions about how the
 * test is *delivered*, and asking for them in a dialog a teacher may never open
 * is how a test ends up published with no time limit by accident. What is left
 * is what a teacher edits while writing rather than while shipping.
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
        // Carried through untouched so a save here never silently clears what
        // the publish wizard set.
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
        <Field
          size="sm"
          label={t("root.tests.settings.titleLabel")}
          error={errors.title ? t("root.tests.settings.titleRequired") : undefined}
        >
          <Input
            {...register("title")}
            aria-invalid={Boolean(errors.title)}
            size="md"
          />
        </Field>

        <Field size="sm" label={t("root.tests.settings.descriptionLabel")}>
          <Textarea {...register("description")} rows={2} fieldSize="md" />
        </Field>

        <Field
          size="sm"
          label={t("root.tests.settings.instructionsLabel")}
          hint={t("root.tests.settings.instructionsHint")}
        >
          <Textarea {...register("instructions")} rows={4} fieldSize="md" />
        </Field>

        <p className="rounded-xl bg-muted px-3 py-2 text-2xs text-muted-foreground">
          {t("root.tests.settings.deliveryMoved")}
        </p>

        <DialogFooterActions
          cancelLabel={t("root.tests.actions.cancel")}
          submitLabel={t("root.tests.actions.save")}
          isBusy={isBusy}
        />
      </form>
    </Dialog>
  );
}
