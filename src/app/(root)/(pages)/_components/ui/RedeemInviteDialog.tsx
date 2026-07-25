"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Dialog as DialogPrimitive } from "radix-ui";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAcceptTeacherInviteMutation } from "../../_hooks/useAcceptTeacherInviteMutation";

const SESSION_EXPIRED_HINT = "session expired";

/**
 * Teacher invites arrive as a unique link (never a shared code — the teacher
 * role exposes answer keys, see CLAUDE.md). The person may paste the whole URL
 * or just the token, so accept either and pull the token out: a `token` query
 * param wins, otherwise the last path segment, otherwise the raw input.
 */
function extractInviteToken(raw: string): string {
  const value = raw.trim();
  try {
    const url = new URL(value);
    const queryToken = url.searchParams.get("token");
    if (queryToken) return queryToken;
    const lastSegment = url.pathname.split("/").filter(Boolean).pop();
    if (lastSegment) return lastSegment;
  } catch {
    // Not a URL — treat the input as the raw token.
  }
  return value;
}

const redeemInviteFormSchema = z.object({
  invite: z
    .string()
    .trim()
    .min(1, "Paste your invite link or token."),
});

type RedeemInviteFormField = z.infer<typeof redeemInviteFormSchema>;

type RedeemInviteDialogProps = {
  trigger: React.ReactNode;
};

export default function RedeemInviteDialog({ trigger }: RedeemInviteDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const acceptInviteMutation = useAcceptTeacherInviteMutation();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RedeemInviteFormField>({
    resolver: zodResolver(redeemInviteFormSchema),
    defaultValues: { invite: "" },
  });

  const onSubmit: SubmitHandler<RedeemInviteFormField> = (data) => {
    clearErrors("root");

    const token = extractInviteToken(data.invite);

    acceptInviteMutation.mutate(
      { token },
      {
        onSuccess: (result) => {
          clearErrors("root");
          toast.success(t("root.redeemInvite.success"));
          setOpen(false);
          reset();
          router.push(result?.redirectTo ?? "/dashboard");
          router.refresh();
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : t("root.redeemInvite.error");
          setError("root", { message });
          toast.error(message);

          if (message.toLowerCase().includes(SESSION_EXPIRED_HINT)) {
            router.push("/login");
          }
        },
      },
    );
  };

  const isBusy = isSubmitting || acceptInviteMutation.isPending;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 dark:bg-black/50" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)] duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <DialogPrimitive.Title className="text-base font-semibold text-[var(--foreground)]">
            {t("root.redeemInvite.title")}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-sm text-[var(--muted-foreground)]">
            {t("root.redeemInvite.description")}
          </DialogPrimitive.Description>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                {t("root.redeemInvite.inputLabel")}
                <span className="text-[var(--destructive)]"> *</span>
              </label>
              <Input
                {...register("invite")}
                placeholder={t("root.redeemInvite.inputPlaceholder")}
                aria-invalid={Boolean(errors.invite)}
                autoFocus
              />
              {errors.invite && (
                <p className="mt-1.5 text-xs text-[var(--destructive)]">
                  {errors.invite.message}
                </p>
              )}
            </div>

            {errors.root && (
              <div className="rounded-lg border border-[color-mix(in_srgb,var(--destructive)_25%,transparent)] bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] px-3 py-2 text-sm text-[var(--destructive)]">
                {errors.root.message}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="outline" disabled={isBusy}>
                  {t("root.redeemInvite.cancel")}
                </Button>
              </DialogPrimitive.Close>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {t("root.redeemInvite.submit")}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
