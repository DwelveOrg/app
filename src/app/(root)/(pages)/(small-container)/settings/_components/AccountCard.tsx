"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/badge";
import type { SettingsAccountContext } from "../_types";
import Surface from "@/components/ui/Surface";

export function AccountCard({ account }: Readonly<{ account: SettingsAccountContext }>) {
  const { t } = useTranslation();

  if (!account.name && !account.email) return null;

  const name = account.name ?? "";
  const roleKey = account.role ? `root.profile.roles.${account.role.toLowerCase()}` : null;

  return (
    <Surface padding="none" className="flex items-center gap-3.5 px-4 py-3.5 sm:px-5">
      <Avatar name={name} src={account.avatarUrl} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-[13px] text-muted-foreground">
          {account.email}
        </p>
        {roleKey || account.schoolName ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {roleKey ? <Badge variant="primary">{t(roleKey)}</Badge> : null}
            {account.schoolName ? (
              <Badge className="max-w-full truncate">{account.schoolName}</Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      <Link
        href="/profile"
        className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-primary transition-opacity hover:opacity-75"
      >
        {t("root.pages.profile")}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </Surface>
  );
}
