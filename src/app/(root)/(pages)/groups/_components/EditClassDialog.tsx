"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import ImagePicker from "@/components/Custom/ImagePicker";
import Dialog from "@/app/(root)/_components/Dialog";
import { updateClassSchema, type UpdateClassInput } from "@/app/(root)/_lib/actions.schemas";
import { useUpdateClassMutation } from "@/app/(root)/(pages)/school/_hooks/useUpdateClassMutation";

type EditClassDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classInfo: {
    id: string;
    name: string;
    description?: string | null;
    pictureUrl?: string | null;
  };
};

export default function EditClassDialog({
  open,
  onOpenChange,
  classInfo,
}: EditClassDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const updateClass = useUpdateClassMutation();
  const [removePicture, setRemovePicture] = useState(false);

  const defaultValues = useMemo(
    () => ({
      classId: classInfo.id,
      name: classInfo.name,
      description: classInfo.description ?? "",
    }),
    [classInfo.id, classInfo.name, classInfo.description],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateClassInput>({
    resolver: zodResolver(updateClassSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      reset(defaultValues);
      setRemovePicture(false);
    }
  };

  const onSubmit: SubmitHandler<UpdateClassInput> = (data) => {
    updateClass.mutate(
      { ...data, removePicture: removePicture || undefined },
      {
        onSuccess: (updated) => {
          toast.success(t("root.classDetail.edit.success", { name: updated.name }));
          close(false);
          router.refresh();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("root.classDetail.edit.error"),
          );
        },
      },
    );
  };

  const isBusy = isSubmitting || updateClass.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.classDetail.edit.title")}
      description={t("root.classDetail.edit.description")}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" {...register("classId")} />

        <Field
          label={t("root.schoolPage.createClass.nameLabel")}
          required
          error={errors.name ? t("root.schoolPage.createClass.nameError") : undefined}
        >
          <Input
            {...register("name")}
            placeholder={t("root.schoolPage.createClass.namePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            autoFocus
          />
        </Field>

        <Field label={t("root.schoolPage.createClass.descLabel")}>
          <Textarea
            {...register("description")}
            rows={3}
            placeholder={t("root.schoolPage.createClass.descPlaceholder")}
            aria-invalid={Boolean(errors.description)}
          />
        </Field>

        <Controller
          control={control}
          name="picture"
          render={({ field, fieldState }) => (
            <ImagePicker
              label={t("root.schoolPage.createClass.pictureLabel")}
              hint={t("root.schoolPage.createClass.pictureHint")}
              currentUrl={removePicture ? null : classInfo.pictureUrl ?? null}
              chooseLabel={t("root.schoolPage.createClass.pictureChoose")}
              replaceLabel={t("root.schoolPage.createClass.pictureReplace")}
              removeLabel={t("root.schoolPage.createClass.pictureRemove")}
              onChange={(file) => {
                field.onChange(file ?? undefined);
                if (file) setRemovePicture(false);
              }}
              onRemove={() => {
                field.onChange(undefined);
                setRemovePicture(true);
              }}
              errorMessage={fieldState.error?.message ?? null}
            />
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="outline" disabled={isBusy}>
              {t("root.schoolPage.createClass.cancel")}
            </Button>
          </DialogPrimitive.Close>
          <Button type="submit" loading={isBusy}>
            {t("root.classDetail.edit.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
