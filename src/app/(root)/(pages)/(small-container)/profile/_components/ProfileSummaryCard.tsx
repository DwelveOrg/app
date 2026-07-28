"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { updateAvatarAction } from "@/app/(root)/_lib/profile-actions";
import type { ProfileAccount } from "@/app/(root)/_lib/profile.schemas";
import { cn } from "@/lib/utils";

const ACCEPTED_MIME = "image/jpeg,image/png,image/webp";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

type ProfileSummaryCardProps = {
  account: ProfileAccount;
};

/**
 * Account identity only: avatar, name, and email. The active school and its
 * role live in `SelectedSchoolCard` — the profile page never shows a school or
 * membership count (`docs/features/profile-page-contract.md`).
 */
export function ProfileSummaryCard({ account }: Readonly<ProfileSummaryCardProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);

  const avatar = preview ?? account.avatarUrl ?? null;

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("root.profile.avatar.tooLarge"));
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error(t("root.profile.avatar.badType"));
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(async () => {
      const result = await updateAvatarAction(formData);
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("root.profile.avatar.updated"));
      router.refresh();
    });
  };

  const handleRemove = () => {
    if (!account.avatarUrl) return;
    const formData = new FormData();
    formData.set("removeAvatar", "true");
    startTransition(async () => {
      const result = await updateAvatarAction(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("root.profile.avatar.removed"));
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative">
          <div
            className={cn(
              "grid size-20 place-items-center overflow-hidden rounded-full text-xl font-semibold text-[var(--primary)]",
              "bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] ring-2 ring-[var(--card)]",
            )}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={account.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{getInitials(account.fullName)}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            aria-label={t("root.profile.avatar.change")}
            className={cn(
              "absolute -bottom-0.5 -right-0.5 grid size-8 place-items-center rounded-full",
              "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm ring-2 ring-[var(--card)]",
              "transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              "disabled:opacity-70",
            )}
          >
            {isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIME}
            hidden
            onChange={(event) => {
              handleFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="truncate text-lg font-bold text-[var(--foreground)]">
            {account.fullName}
          </h2>
          <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]">
            {account.email}
          </p>
        </div>

        {account.avatarUrl ? (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--muted-foreground)]",
              "transition hover:text-[var(--destructive)] hover:border-[color-mix(in_srgb,var(--destructive)_30%,transparent)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-70",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("root.profile.avatar.remove")}
          </button>
        ) : null}
      </div>

      <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
        {t("root.profile.avatar.hint")}
      </p>
    </section>
  );
}
