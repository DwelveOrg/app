"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import {
  joinSchoolSchema,
  type JoinSchoolFormField,
} from "@/app/(authentication)/_types/_schemas";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useJoinSchoolMutation } from "../../../_hooks/useJoinSchoolMutation";

const SESSION_EXPIRED_HINT = "session expired";

type JoinSchoolDialogProps = {
  trigger: React.ReactNode;
};

export default function JoinSchoolDialog({ trigger }: JoinSchoolDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const joinSchoolMutation = useJoinSchoolMutation();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JoinSchoolFormField>({
    resolver: zodResolver(joinSchoolSchema),
    defaultValues: { code: "" },
  });

  const onSubmit: SubmitHandler<JoinSchoolFormField> = (data) => {
    clearErrors("root");

    joinSchoolMutation.mutate(data, {
      onSuccess: () => {
        clearErrors("root");
        toast.success(t("root.joinSchool.success"));
        setOpen(false);
        reset();
        router.push("/dashboard");
        router.refresh();
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : t("root.joinSchool.error");
        setError("root", { message });
        toast.error(message);

        if (message.toLowerCase().includes(SESSION_EXPIRED_HINT)) {
          router.push("/login");
        }
      },
    });
  };

  const isBusy = isSubmitting || joinSchoolMutation.isPending;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) reset();
    }}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 dark:bg-black/50" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-elev-4 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <DialogPrimitive.Title className="text-base font-semibold text-foreground">
            {t("root.joinSchool.title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
            {t("root.joinSchool.description")}
          </DialogPrimitive.Description>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("root.joinSchool.codeLabel")}
                <span className="text-destructive"> *</span>
              </label>
              <Input
                {...register("code")}
                placeholder={t("root.joinSchool.codePlaceholder")}
                aria-invalid={Boolean(errors.code)}
                autoFocus
              />
              {errors.code && (
                <p className="mt-1.5 text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            {errors.root && (
              <div className="rounded-lg border border-[color-mix(in_srgb,var(--destructive)_25%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] px-3 py-2 text-sm text-destructive">
                {errors.root.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="outline" disabled={isBusy}>
                  {t("root.joinSchool.cancel")}
                </Button>
              </DialogPrimitive.Close>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {t("root.joinSchool.submit")}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
