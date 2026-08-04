"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import ImagePicker from "@/components/Custom/ImagePicker";
import Dialog from "@/app/(root)/_components/Dialog";
import { createClassSchema, type CreateClassInput } from "@/app/(root)/_lib/actions.schemas";
import { useCreateClassMutation } from "../_hooks/useCreateClassMutation";

type CreateClassDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateClassDialog({ open, onOpenChange }: CreateClassDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const createClass = useCreateClassMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { name: "", description: "" },
  });

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) reset();
  };

  const onSubmit: SubmitHandler<CreateClassInput> = (data) => {
    createClass.mutate(data, {
      onSuccess: (created) => {
        toast.success(t("root.schoolPage.createClass.success", { name: created.name }));
        close(false);
        // Class data is server-rendered, so refresh to pull the new class in.
        router.refresh();
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t("root.schoolPage.createClass.error"));
      },
    });
  };

  const isBusy = isSubmitting || createClass.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.schoolPage.createClass.title")}
      description={t("root.schoolPage.createClass.description")}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("root.schoolPage.createClass.nameLabel")}
            <span className="text-destructive"> *</span>
          </label>
          <Input
            {...register("name")}
            placeholder={t("root.schoolPage.createClass.namePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            autoFocus
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-destructive">
              {t("root.schoolPage.createClass.nameError")}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("root.schoolPage.createClass.descLabel")}
          </label>
          <Textarea
            {...register("description")}
            rows={3}
            placeholder={t("root.schoolPage.createClass.descPlaceholder")}
            aria-invalid={Boolean(errors.description)}
          />
        </div>

        <Controller
          control={control}
          name="picture"
          render={({ field, fieldState }) => (
            <ImagePicker
              label={t("root.schoolPage.createClass.pictureLabel")}
              hint={t("root.schoolPage.createClass.pictureHint")}
              chooseLabel={t("root.schoolPage.createClass.pictureChoose")}
              replaceLabel={t("root.schoolPage.createClass.pictureReplace")}
              removeLabel={t("root.schoolPage.createClass.pictureRemove")}
              onChange={(file) => field.onChange(file ?? undefined)}
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
          <Button type="submit" disabled={isBusy}>
            {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.schoolPage.createClass.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
