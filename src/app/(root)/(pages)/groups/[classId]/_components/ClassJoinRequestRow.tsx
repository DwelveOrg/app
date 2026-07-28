"use client";

import { Check, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import type { ClassEnrollmentItem } from "@/app/(root)/_lib/enrollment.schemas";

type ClassJoinRequestRowProps = {
  request: ClassEnrollmentItem;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
};

/**
 * One pending student join request. Shared by the class detail Requests section
 * and the full requests page so both read identically; the backend decides
 * whether approve/reject actually succeed.
 */
export default function ClassJoinRequestRow({
  request,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: ClassJoinRequestRowProps) {
  const { t } = useTranslation();
  const { student } = request;
  const initial = student.fullName.trim().charAt(0).toUpperCase() || "?";
  const busy = isApproving || isRejecting;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
        {initial}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
          {student.fullName}
        </p>
        {student.email ? (
          <p className="truncate text-xs text-[var(--muted-foreground)]">{student.email}</p>
        ) : null}
        {request.message ? (
          <p className="mt-1.5 rounded-lg bg-[var(--muted)] px-3 py-1.5 text-xs text-[var(--foreground)]">
            {request.message}
          </p>
        ) : null}
        {request.requestedAt ? (
          <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
            <RelativeTime date={request.requestedAt} />
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button size="lg" disabled={busy} aria-busy={isApproving} onClick={onApprove}>
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {t("root.enrollment.classRequests.approve")}
        </Button>
        <Button size="lg" variant="destructive" disabled={busy} onClick={onReject}>
          <X className="h-4 w-4" />
          {t("root.enrollment.classRequests.reject")}
        </Button>
      </div>
    </li>
  );
}
