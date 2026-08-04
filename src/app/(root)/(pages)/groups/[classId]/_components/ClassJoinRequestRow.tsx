"use client";

import { Check, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import type { ClassEnrollmentItem } from "@/app/(root)/_lib/enrollment.schemas";
import Surface from "@/components/ui/Surface";

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
  const busy = isApproving || isRejecting;

  return (
    <Surface as="li" padding="sm" className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar name={student.fullName} tint="seeded" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {student.fullName}
        </p>
        {student.email ? (
          <p className="truncate text-xs text-muted-foreground">{student.email}</p>
        ) : null}
        {request.message ? (
          <p className="mt-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-foreground">
            {request.message}
          </p>
        ) : null}
        {request.requestedAt ? (
          <p className="mt-1 text-2xs text-muted-foreground">
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
    </Surface>
  );
}
