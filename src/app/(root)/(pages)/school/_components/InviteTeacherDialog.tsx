"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
import CopyButton from "@/components/ui/CopyButton";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Dialog from "@/app/(root)/_components/Dialog";
import { inviteTeacherSchema, type InviteTeacherInput } from "@/app/(root)/_lib/actions.schemas";
import { useInviteTeacherMutation } from "../_hooks/useInviteTeacherMutation";

type InviteTeacherDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type InviteResult = { invitedEmail: string; inviteUrl: string };

export default function InviteTeacherDialog({ open, onOpenChange }: InviteTeacherDialogProps) {
  const { t } = useTranslation();
  const inviteTeacher = useInviteTeacherMutation();
  const [result, setResult] = useState<InviteResult | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteTeacherInput>({
    resolver: zodResolver(inviteTeacherSchema),
    defaultValues: { email: "" },
  });

  const close = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      reset();
      // Clearing the result unmounts the CopyButton, which owns its own copied state and timer.
      setResult(null);
    }
  };

  const onSubmit: SubmitHandler<InviteTeacherInput> = (data) => {
    inviteTeacher.mutate(data, {
      onSuccess: (invite) => {
        setResult({ invitedEmail: invite.invitedEmail, inviteUrl: invite.inviteUrl });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t("root.schoolPage.inviteTeacher.error"));
      },
    });
  };

  const isBusy = isSubmitting || inviteTeacher.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={t("root.schoolPage.inviteTeacher.title")}
      description={t("root.schoolPage.inviteTeacher.description")}
    >
      {result ? (
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            {t("root.schoolPage.inviteTeacher.created", { email: result.invitedEmail })}
          </p>
          <div className="rounded-xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t("root.schoolPage.inviteTeacher.linkLabel")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                {result.inviteUrl}
              </code>
              <CopyButton
                value={result.inviteUrl}
                label={t("root.schoolPage.inviteTeacher.copyLink")}
                copiedLabel={t("root.schoolPage.inviteTeacher.linkCopied")}
                onCopied={() => toast.success(t("root.schoolPage.inviteTeacher.linkCopied"))}
                onError={() => toast.error(t("root.schoolPage.inviteTeacher.linkCopyError"))}
                className="shrink-0"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <DialogPrimitive.Close asChild>
              <Button type="button">{t("root.schoolPage.inviteTeacher.done")}</Button>
            </DialogPrimitive.Close>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field
            label={t("root.schoolPage.inviteTeacher.emailLabel")}
            required
            error={errors.email ? t("root.schoolPage.inviteTeacher.emailError") : undefined}
          >
            <Input
              {...register("email")}
              type="email"
              placeholder={t("root.schoolPage.inviteTeacher.emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              autoFocus
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            {t("root.schoolPage.inviteTeacher.hint")}
          </p>
          <div className="flex items-center justify-end gap-3 pt-1">
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="outline" disabled={isBusy}>
                {t("root.schoolPage.inviteTeacher.cancel")}
              </Button>
            </DialogPrimitive.Close>
            <Button type="submit" loading={isBusy}>
              {t("root.schoolPage.inviteTeacher.submit")}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
