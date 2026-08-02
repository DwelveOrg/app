"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Loader2, Lock, Users, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import type { TeacherClass } from "@/app/(root)/_lib/teacher-requests.schemas";
import {
  useCancelTeacherRequestMutation,
  useRequestToTeachMutation,
} from "@/app/(root)/_hooks/useTeacherRequests";
import { classAccent } from "../_constants";
import RequestToTeachDialog from "./RequestToTeachDialog";

type TeacherClassCardProps = {
  item: TeacherClass;
  schoolId: string | undefined;
};

/**
 * A single class in the teacher browse list. The call to action is driven
 * entirely by the backend flags (`canEnter`, `canRequest`, `teacherRequestStatus`)
 * — the UI never reconstructs authorization rules.
 */
export default function TeacherClassCard({ item, schoolId }: TeacherClassCardProps) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const requestToTeach = useRequestToTeachMutation(schoolId);
  const cancelRequest = useCancelTeacherRequestMutation(schoolId);

  const initial = item.name.charAt(0).toUpperCase();
  const accent = classAccent(item.id);
  const leadTeacher = item.teachers[0]?.fullName ?? "";
  const studentCount = item.counts?.students ?? item.students.length;
  const isRejected = item.teacherRequestStatus === "REJECTED";

  const handleRequest = (message: string) => {
    requestToTeach.mutate(
      { classId: item.id, message: message || undefined },
      {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success(t("root.enrollment.teacher.requestedToast", { name: item.name }));
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          );
        },
      },
    );
  };

  const handleCancel = () => {
    cancelRequest.mutate(
      { classId: item.id },
      {
        onSuccess: () => toast.success(t("root.enrollment.teacher.cancelledToast")),
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.enrollment.errorGeneric"),
          ),
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
            {item.canEnter ? (
              <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                {t("root.classes.card.teaching")}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {leadTeacher || t("root.enrollment.teacher.noTeacher")}
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
          {t("root.enrollment.teacher.studentCount", { count: studentCount })}
        </span>
      </div>

      <div className="mt-4 flex-1" />

      <div className="mt-2">{renderAction()}</div>

      <RequestToTeachDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        className={item.name}
        isSubmitting={requestToTeach.isPending}
        onConfirm={handleRequest}
      />
    </div>
  );

  function renderAction() {
    // Assigned: let the teacher open and manage the class.
    if (item.canEnter) {
      return (
        <Button asChild variant="outline" className="w-full">
          <Link href={`/groups/${item.id}`}>
            {t("root.enrollment.teacher.open")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      );
    }

    // Awaiting an admin decision: show the pending state and allow cancellation.
    if (item.teacherRequestStatus === "PENDING") {
      return (
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-warning/12 px-2.5 py-2 text-sm font-medium text-warning-text">
            <Clock className="h-4 w-4" />
            {t("root.enrollment.teacher.requestPending")}
          </span>
          <Button
            variant="outline"
            className="w-full"
            disabled={cancelRequest.isPending}
            aria-busy={cancelRequest.isPending}
            onClick={handleCancel}
          >
            {cancelRequest.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("root.enrollment.teacher.cancelRequest")}
          </Button>
        </div>
      );
    }

    // Requestable — including after a rejection, where a fresh request is allowed.
    if (item.canRequest) {
      return (
        <div className="flex flex-col gap-2">
          {isRejected ? (
            <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] px-2.5 py-2 text-sm font-medium text-[var(--destructive)]">
              <XCircle className="h-4 w-4" />
              {t("root.enrollment.teacher.rejected")}
            </span>
          ) : null}
          <Button className="w-full" onClick={() => setDialogOpen(true)}>
            {isRejected
              ? t("root.enrollment.teacher.requestAgain")
              : t("root.enrollment.teacher.requestToTeach")}
          </Button>
        </div>
      );
    }

    // Not requestable and not assigned: explain, so it's never a dead end.
    return (
      <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-2.5 py-2 text-sm font-medium text-[var(--muted-foreground)]">
        <Lock className="h-3.5 w-3.5" />
        {t("root.enrollment.teacher.unavailable")}
      </span>
    );
  }
}
