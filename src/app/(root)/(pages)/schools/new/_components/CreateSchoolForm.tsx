"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { School } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  createSchoolSchema,
  type CreateSchoolFormField,
} from "@/app/(authentication)/_types/_schemas";
import ImagePicker from "@/components/Custom/ImagePicker";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import { useCreateSchoolMutation } from "../_hooks/useCreateSchoolMutation";
import Surface from "@/components/ui/Surface";

const SESSION_EXPIRED_HINT = "session expired";

export default function CreateSchoolForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const createSchoolMutation = useCreateSchoolMutation();

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CreateSchoolFormField>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: { name: "", description: "", country: "", city: "" },
  });

  const onSubmit: SubmitHandler<CreateSchoolFormField> = (data) => {
    clearErrors("root");

    createSchoolMutation.mutate(data, {
      onSuccess: () => {
        clearErrors("root");
        toast.success(t("root.dashboard.schoolForm.success"));
        router.push("/dashboard");
        router.refresh();
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : t("root.dashboard.schoolForm.error");
        setError("root", { message });
        toast.error(message);

        // A stale/expired access token means the session is gone: send to login.
        if (message.toLowerCase().includes(SESSION_EXPIRED_HINT)) {
          router.push("/login");
        }
      },
    });
  };

  const isBusy = isSubmitting || createSchoolMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <School className="h-5 w-5" />
        </span>
        <div>
          <h1 className="type-title text-foreground">
            {t("root.dashboard.schoolForm.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("root.dashboard.schoolForm.subtitle")}
          </p>
        </div>
      </div>

      <Surface
        as="form"
        className="space-y-5 p-6"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Field
          label={t("root.dashboard.schoolForm.fields.name.label")}
          required
          error={errors.name?.message}
        >
          <Input
            {...register("name")}
            placeholder={t("root.dashboard.schoolForm.fields.name.placeholder")}
            aria-invalid={Boolean(errors.name)}
            autoFocus
          />
        </Field>

        <Field
          label={t("root.dashboard.schoolForm.fields.description.label")}
          error={errors.description?.message}
        >
          <Textarea
            {...register("description")}
            rows={3}
            placeholder={t("root.dashboard.schoolForm.fields.description.placeholder")}
            aria-invalid={Boolean(errors.description)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("root.dashboard.schoolForm.fields.country.label")}
            error={errors.country?.message}
          >
            <Input
              {...register("country")}
              placeholder={t("root.dashboard.schoolForm.fields.country.placeholder")}
              aria-invalid={Boolean(errors.country)}
            />
          </Field>

          <Field
            label={t("root.dashboard.schoolForm.fields.city.label")}
            error={errors.city?.message}
          >
            <Input
              {...register("city")}
              placeholder={t("root.dashboard.schoolForm.fields.city.placeholder")}
              aria-invalid={Boolean(errors.city)}
            />
          </Field>
        </div>

        <Controller
          control={control}
          name="logo"
          render={({ field, fieldState }) => (
            <ImagePicker
              label={t("root.dashboard.schoolForm.fields.logo.label")}
              hint={t("root.dashboard.schoolForm.fields.logo.hint")}
              chooseLabel={t("root.dashboard.schoolForm.fields.logo.choose")}
              replaceLabel={t("root.dashboard.schoolForm.fields.logo.replace")}
              removeLabel={t("root.dashboard.schoolForm.fields.logo.remove")}
              onChange={(file) => field.onChange(file ?? undefined)}
              errorMessage={fieldState.error?.message ?? null}
            />
          )}
        />

        {errors.root && (
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors.root.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button asChild variant="outline" disabled={isBusy}>
            <Link href="/dashboard">{t("root.dashboard.schoolForm.cancel")}</Link>
          </Button>
          <Button type="submit" loading={isBusy}>
            {t("root.dashboard.schoolForm.submit")}
          </Button>
        </div>
      </Surface>
    </div>
  );
}
