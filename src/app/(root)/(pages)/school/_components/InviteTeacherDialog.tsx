"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/Button";
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
  const [copied, setCopied] = useState(false);

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
      setResult(null);
      setCopied(false);
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

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      toast.success(t("root.schoolPage.inviteTeacher.linkCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("root.schoolPage.inviteTeacher.linkCopyError"));
    }
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
          <p className="text-sm text-[var(--foreground)]">
            {t("root.schoolPage.inviteTeacher.created", { email: result.invitedEmail })}
          </p>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              {t("root.schoolPage.inviteTeacher.linkLabel")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--foreground)]">
                {result.inviteUrl}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label={t("root.schoolPage.inviteTeacher.copyLink")}
              >
                {copied ? <Check className="h-4 w-4 text-success-text" /> : <Copy className="h-4 w-4" />}
              </button>
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              {t("root.schoolPage.inviteTeacher.emailLabel")}
              <span className="text-[var(--destructive)]"> *</span>
            </label>
            <Input
              {...register("email")}
              type="email"
              placeholder={t("root.schoolPage.inviteTeacher.emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              autoFocus
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-[var(--destructive)]">
                {t("root.schoolPage.inviteTeacher.emailError")}
              </p>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {t("root.schoolPage.inviteTeacher.hint")}
          </p>
          <div className="flex items-center justify-end gap-3 pt-1">
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="outline" disabled={isBusy}>
                {t("root.schoolPage.inviteTeacher.cancel")}
              </Button>
            </DialogPrimitive.Close>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {t("root.schoolPage.inviteTeacher.submit")}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
