"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Loader2, Lock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import type { DiscoverableClass } from "@/app/(root)/_lib/enrollment.schemas";
import {
  useCancelJoinRequestMutation,
  useRequestJoinClassMutation,
} from "@/app/(root)/_hooks/useEnrollment";
import { classAccent } from "../_constants";
import { enrollmentModeLabelKeys } from "../_lib/enrollmentLabels";
import RequestJoinDialog from "./RequestJoinDialog";

type StudentClassCardProps = {
  item: DiscoverableClass;
  schoolId: string | undefined;
};

/**
 * One class in the student directory. Every call to action is driven by the
 * backend-provided `canEnter`, `canRequest`, `studentEnrollmentStatus`,
 * `enrollmentMode`, `capacity`, and `activeStudentCount` fields — the UI never
 * reconstructs authorization rules.
 */
export default function StudentClassCard({ item, schoolId }: StudentClassCardProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const requestJoin = useRequestJoinClassMutation(schoolId);
  const cancelRequest = useCancelJoinRequestMutation(schoolId);

  const initial = item.name.charAt(0).toUpperCase();
  const accent = classAccent(item.id);
  const isPending = item.studentEnrollmentStatus === "PENDING";
  const isEnrolled = item.studentEnrollmentStatus === "ACTIVE";
  const isFull = item.capacity != null && item.activeStudentCount >= item.capacity;

  const handleRequest = (message: string) => {
    requestJoin.mutate(
      { classId: item.id, message: message || undefined },
      {
        onSuccess: (result) => {
          setDialogOpen(false);
          toast.success(
            result.status === "ACTIVE"
              ? t("root.enrollment.directory.joinedToast", { name: item.name })
              : t("root.enrollment.directory.requestedToast", { name: item.name }),
          );
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("root.enrollment.errorGeneric"));
        },
      },
    );
  };

  const handleCancel = () => {
    cancelRequest.mutate(
      { classId: item.id },
      {
        onSuccess: () => toast.success(t("root.enrollment.directory.cancelledToast")),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t("root.enrollment.errorGeneric")),
      },
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-start gap-3">
        {item.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.pictureUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${accent}`}
          >
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[15px] font-semibold text-[var(--foreground)]">
              {item.name}
            </h3>
            {isEnrolled ? (
              <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                {t("root.classes.card.enrolled")}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {item.teacher?.name ?? t("root.enrollment.directory.noTeacher")}
          </p>
        </div>
      </div>

      {item.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-[var(--muted-foreground)]">
          {item.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--muted)] px-2.5 py-1 font-medium text-[var(--muted-foreground)]">
          <Users className="h-3.5 w-3.5" />
          {item.capacity != null
            ? t("root.enrollment.directory.seats", {
                count: item.activeStudentCount,
                capacity: item.capacity,
              })
            : t("root.enrollment.directory.enrolledCount", {
                count: item.activeStudentCount,
              })}
        </span>
        <span className="inline-flex items-center rounded-lg border border-[var(--border)] px-2.5 py-1 font-medium text-[var(--muted-foreground)]">
          {t(enrollmentModeLabelKeys[item.enrollmentMode])}
        </span>
      </div>

      <div className="mt-4 flex-1" />

      <div className="mt-2">{renderAction()}</div>

      <RequestJoinDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        className={item.name}
        isSubmitting={requestJoin.isPending}
        onConfirm={handleRequest}
      />
    </div>
  );

  function renderAction() {
    // `canEnter` is the backend's authority for entry, so enrolled classes lead
    // straight into the class instead of offering a request.
    if (item.canEnter) {
      return (
        <Button asChild variant={isEnrolled ? "default" : "outline"} className="w-full">
          <Link href={`/groups/${item.id}`}>
            {t("root.enrollment.directory.open")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      );
    }

    if (item.canRequest) {
      return (
        <Button className="w-full" onClick={() => setDialogOpen(true)}>
          {t("root.enrollment.directory.requestToJoin")}
        </Button>
      );
    }

    if (isPending) {
      return (
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-warning/12 px-2.5 py-2 text-sm font-medium text-warning-text">
            <Clock className="h-4 w-4" />
            {t("root.enrollment.directory.requestPending")}
          </span>
          <Button
            variant="outline"
            className="w-full"
            disabled={cancelRequest.isPending}
            aria-busy={cancelRequest.isPending}
            onClick={handleCancel}
          >
            {cancelRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("root.enrollment.directory.cancelRequest")}
          </Button>
        </div>
      );
    }

    // Not requestable: explain why, so a disabled state is never a dead end.
    const reasonKey = isFull
      ? "root.enrollment.directory.classFull"
      : item.enrollmentMode === "DIRECT_ASSIGNMENT"
        ? "root.enrollment.directory.assignmentRequired"
        : "root.enrollment.directory.unavailable";

    return (
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-2.5 py-2 text-sm font-medium text-[var(--muted-foreground)]">
        <Lock className="h-3.5 w-3.5" />
        {t(reasonKey)}
      </span>
    );
  }
}
