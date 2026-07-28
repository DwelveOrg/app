"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Pointer from identity (`/profile`) to account security (`/settings`).
 *
 * Password and active-session management deliberately live under Settings only —
 * this page owns who you are, Settings owns how the account behaves. The card
 * keeps that split discoverable instead of leaving users hunting for a password
 * field that used to be here.
 */
export function SecurityLinkCard() {
  const { t } = useTranslation();

  return (
    <Link
      href="/settings"
      className="group flex items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]">
        <ShieldCheck className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold text-[var(--foreground)]">
          {t("root.profile.security.title")}
        </h2>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
          {t("root.profile.security.description")}
        </p>
      </div>
      <ChevronRight className="h-[18px] w-[18px] shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}
