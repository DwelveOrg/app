"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { SkeletonList } from "@/components/ui/Skeleton";
import type { ClassEnrollmentItem } from "@/app/(root)/_lib/enrollment.schemas";
import {
  useCancelJoinRequestMutation,
  useMyClassRequests,
} from "@/app/(root)/_hooks/useEnrollment";
import Empty from "../../_components/ui/Empty";
import { classAccent } from "../_constants";
import ClassesNav from "./ClassesNav";
import Surface from "@/components/ui/Surface";
import Badge from "@/components/ui/badge";

type MyClassRequestsViewProps = {
  schoolId: string | undefined;
  variant?: "page" | "embedded";
};

/** Student list of pending class join requests, each cancellable. */
export default function MyClassRequestsView({
  schoolId,
  variant = "page",
}: MyClassRequestsViewProps) {
  const { t } = useTranslation();
  const query = useMyClassRequests();
  const cancelRequest = useCancelJoinRequestMutation(schoolId);

  const requests = useMemo(
    () => query.data?.pages.flatMap((page) => page.enrollments) ?? [],
    [query.data?.pages],
  );

  const handleCancel = (classId: string) => {
    cancelRequest.mutate(
      { classId },
      {
        onSuccess: () => toast.success(t("root.enrollment.requests.cancelledToast")),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t("root.enrollment.errorGeneric")),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {variant === "page" ? (
        <>
          <header>
            <h1 className="type-title text-foreground">
              {t("root.enrollment.requests.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("root.enrollment.requests.subtitle")}
            </p>
          </header>

          <ClassesNav schoolId={schoolId} />
        </>
      ) : null}

      {query.isLoading ? (
        <SkeletonList count={3} itemClassName="h-20" />
      ) : query.isError ? (
        <Empty
          title={t("root.enrollment.requests.errorTitle")}
          description={t("root.enrollment.requests.errorDescription")}
        />
      ) : requests.length === 0 ? (
        <Empty
          title={t("root.enrollment.requests.emptyTitle")}
          description={t("root.enrollment.requests.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              onCancel={() => handleCancel(request.classId)}
              isCancelling={
                cancelRequest.isPending && cancelRequest.variables?.classId === request.classId
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type RequestRowProps = {
  request: ClassEnrollmentItem;
  onCancel: () => void;
  isCancelling: boolean;
};

function RequestRow({ request, onCancel, isCancelling }: RequestRowProps) {
  const { t } = useTranslation();
  const className = request.class.name;
  const teacher = request.class.teachers[0]?.fullName;
  const initial = className.charAt(0).toUpperCase();
  const accent = classAccent(request.classId);

  return (
    <Surface as="li" padding="sm" className="flex flex-wrap items-center gap-4">
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${accent}`}
      >
        {initial}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{className}</p>
        <p className="truncate text-xs text-muted-foreground">
          {teacher ?? t("root.enrollment.directory.noTeacher")}
          {request.requestedAt ? (
            <>
              {" · "}
              <RelativeTime date={request.requestedAt} />
            </>
          ) : null}
        </p>
      </div>

      <Badge variant="warning" size="md">
        <Clock className="h-3.5 w-3.5" />
        {t("root.enrollment.status.pending")}
      </Badge>

      <Button
        variant="outline"
        size="lg"
        loading={isCancelling}
        onClick={onCancel}
      >
        {t("root.enrollment.requests.cancel")}
      </Button>
    </Surface>
  );
}
