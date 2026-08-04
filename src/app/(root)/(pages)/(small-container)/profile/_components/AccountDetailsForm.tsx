"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { updateFullNameAction } from "@/app/(root)/_lib/profile-actions";
import {
  updateFullNameSchema,
  type UpdateFullNameInput,
} from "@/app/(root)/_lib/profile.schemas.forms";
import type { ProfileAccount } from "@/app/(root)/_lib/profile.schemas";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";

type AccountDetailsFormProps = {
  account: ProfileAccount;
};

export function AccountDetailsForm({ account }: Readonly<AccountDetailsFormProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateFullNameInput>({
    resolver: zodResolver(updateFullNameSchema),
    defaultValues: { fullName: account.fullName },
  });

  useEffect(() => {
    form.reset({ fullName: account.fullName });
  }, [account.fullName, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (values.fullName.trim() === account.fullName.trim()) return;

    startTransition(async () => {
      const result = await updateFullNameAction(values);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.profile.form.error"));
        return;
      }
      toast.success(t("root.profile.form.updated"));
      router.refresh();
    });
  });

  const fullName = useWatch({ control: form.control, name: "fullName" });
  const isDirty = (fullName ?? "").trim() !== account.fullName.trim();
  const isBusy = isPending || form.formState.isSubmitting;

  return (
    <Surface as="section">
      <header className="mb-4">
        <h2 className="text-base font-bold text-foreground">
          {t("root.profile.account.title")}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("root.profile.account.description")}
        </p>
      </header>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="profile-full-name"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("root.profile.account.fullName.label")}
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-full-name"
              {...form.register("fullName")}
              placeholder={t("root.profile.account.fullName.placeholder")}
              className="pl-10"
              aria-invalid={Boolean(form.formState.errors.fullName)}
              autoComplete="name"
            />
          </div>
          {form.formState.errors.fullName ? (
            <p className="mt-1.5 text-xs text-destructive">
              {t("root.profile.account.fullName.error")}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {t("root.profile.account.email.label")}
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-email"
              type="email"
              value={account.email}
              readOnly
              disabled
              className="pl-10 cursor-not-allowed"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("root.profile.account.email.hint")}
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isBusy || !isDirty}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {t("root.profile.form.save")}
          </button>
        </div>
      </form>
    </Surface>
  );
}
