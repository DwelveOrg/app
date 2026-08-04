"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Dialog as DialogPrimitive } from "radix-ui";
import { toast } from "react-toastify";

import Dialog from "@/app/(root)/_components/Dialog";
import { updateSchoolSchema, type UpdateSchoolInput } from "@/app/(root)/_lib/actions.schemas";
import ImagePicker from "@/components/Custom/ImagePicker";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { useUpdateSchoolMutation } from "../_hooks/useUpdateSchoolMutation";

type EditSchoolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: {
    name: string;
    description?: string | null;
    country?: string | null;
    city?: string | null;
    logoUrl?: string | null;
  };
};

export default function EditSchoolDialog({
  open,
  onOpenChange,
  school,
}: EditSchoolDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const updateSchool = useUpdateSchoolMutation();
  const [removeLogo, setRemoveLogo] = useState(false);

  const defaultValues = useMemo(
    () => ({
      name: school.name,
      description: school.description ?? "",
      country: school.country ?? "",
      city: school.city ?? "",
    }),
    [school.name, school.description, school.country, school.city],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateSchoolInput>({
    resolver: zodResolver(updateSchoolSchema),
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
      setRemoveLogo(false);
    }
  };

  const onSubmit: SubmitHandler<UpdateSchoolInput> = (data) => {
    updateSchool.mutate(
      { ...data, removeLogo: removeLogo || undefined },
      {
        onSuccess: (updated) => {
          toast.success(t("root.schoolPage.edit.success", { name: updated.name }));
          close(false);
          router.refresh();
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("root.schoolPage.edit.error"));
        },
      },
    );
  };

  const isBusy = isSubmitting || updateSchool.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.schoolPage.edit.title")}
      description={t("root.schoolPage.edit.description")}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field
          label={t("root.schoolPage.edit.nameLabel")}
          required
          error={errors.name ? t("root.schoolPage.edit.nameError") : undefined}
        >
          <Input
            {...register("name")}
            placeholder={t("root.schoolPage.edit.namePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            autoFocus
          />
        </Field>

        <Field label={t("root.schoolPage.edit.descLabel")}>
          <Textarea
            {...register("description")}
            rows={3}
            placeholder={t("root.schoolPage.edit.descPlaceholder")}
            aria-invalid={Boolean(errors.description)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("root.schoolPage.edit.cityLabel")}>
            <Input
              {...register("city")}
              placeholder={t("root.schoolPage.edit.cityPlaceholder")}
              aria-invalid={Boolean(errors.city)}
            />
          </Field>
          <Field label={t("root.schoolPage.edit.countryLabel")}>
            <Input
              {...register("country")}
              placeholder={t("root.schoolPage.edit.countryPlaceholder")}
              aria-invalid={Boolean(errors.country)}
            />
          </Field>
        </div>

        <Controller
          control={control}
          name="logo"
          render={({ field, fieldState }) => (
            <ImagePicker
              label={t("root.schoolPage.edit.logoLabel")}
              hint={t("root.schoolPage.edit.logoHint")}
              currentUrl={removeLogo ? null : school.logoUrl ?? null}
              chooseLabel={t("root.schoolPage.edit.logoChoose")}
              replaceLabel={t("root.schoolPage.edit.logoReplace")}
              removeLabel={t("root.schoolPage.edit.logoRemove")}
              onChange={(file) => {
                field.onChange(file ?? undefined);
                if (file) {
                  setRemoveLogo(false);
                  setValue("removeLogo", undefined);
                }
              }}
              onRemove={() => {
                field.onChange(undefined);
                setRemoveLogo(true);
              }}
              errorMessage={fieldState.error?.message ?? null}
            />
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-1">
          <DialogPrimitive.Close asChild>
            <Button type="button" variant="outline" disabled={isBusy}>
              {t("root.schoolPage.edit.cancel")}
            </Button>
          </DialogPrimitive.Close>
          <Button type="submit" loading={isBusy}>
            {t("root.schoolPage.edit.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
