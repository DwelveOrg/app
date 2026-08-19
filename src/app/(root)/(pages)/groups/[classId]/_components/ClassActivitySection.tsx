"use client";

import Link from "next/link";
import {
  CircleDot,
  FileCheck2,
  Radio,
  RefreshCw,
  Send,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ClassActivityItem,
  ClassActivityResponse,
  ClassActivityType,
} from "@/app/(root)/_lib/class-activity.schemas";
import { useClassActivity } from "@/app/(root)/_hooks/useClassRoster";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import { SkeletonList } from "@/components/ui/Skeleton";
import Surface from "@/components/ui/Surface";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import { cn } from "@/lib/utils";


const ICONS: Record<ClassActivityType, LucideIcon> = {
  TEST_SUBMITTED: FileCheck2,
  TEST_STARTED: CircleDot,
  STUDENT_JOINED: UserPlus,
  TEST_PUBLISHED: Send,
};

const EVENT_KEYS = {
  TEST_SUBMITTED: "root.classDetail.activity.events.TEST_SUBMITTED",
  TEST_STARTED: "root.classDetail.activity.events.TEST_STARTED",
  STUDENT_JOINED: "root.classDetail.activity.events.STUDENT_JOINED",
  TEST_PUBLISHED: "root.classDetail.activity.events.TEST_PUBLISHED",
} as const satisfies Record<ClassActivityType, string>;

const TONES: Record<ClassActivityType, string> = {
  TEST_SUBMITTED: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-success",
  TEST_STARTED: "bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-info",
  STUDENT_JOINED: "bg-accent text-accent-foreground",
  TEST_PUBLISHED: "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary",
};

export default function ClassActivitySection({
  classId,
  enabled,
  initialData,
}: {
  classId: string;
  enabled: boolean;
  initialData?: ClassActivityResponse;
}) {
  const { t } = useTranslation();
  const { data, isPending, isError, isFetching, refetch } = useClassActivity({
    classId,
    enabled,
    initialData,
  });

  if (!enabled) return null;

  const items = data?.items ?? [];

  return (
    <section aria-labelledby="class-activity-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="class-activity-heading"
          className="inline-flex items-center gap-2 text-base font-bold text-foreground"
        >
          <Radio className="size-4 text-muted-foreground" />
          {t("root.classDetail.activity.title")}
        </h2>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={isFetching && !isPending}
          onClick={() => void refetch()}
        >
          <RefreshCw className="size-3.5" />
          {t("root.classDetail.activity.refresh")}
        </Button>
      </div>

      {isPending ? (
        <SkeletonList count={3} itemClassName="h-16" />
      ) : isError ? (
        <Empty
          title={t("root.classDetail.activity.errorTitle")}
          description={t("root.classDetail.activity.errorDescription")}
          action={
            <Button type="button" className="w-full" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              {t("root.classDetail.activity.retry")}
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <Empty
          title={t("root.classDetail.activity.emptyTitle")}
          description={t("root.classDetail.activity.emptyDescription")}
        />
      ) : (
        <Surface padding="none" divided>
          {items.map((item) => (
            <ActivityRow key={item.id} classId={classId} item={item} />
          ))}
        </Surface>
      )}
    </section>
  );
}

function ActivityRow({
  classId,
  item,
}: {
  classId: string;
  item: ClassActivityItem;
}) {
  const { t } = useTranslation();
  const Icon = ICONS[item.type];
  const name = item.actor?.fullName ?? t("root.classDetail.activity.someone");
  // A submitted attempt carries its score whether or not marking has finished,
  // so the feed can show the result on the row that announces the submission —
  // which is the whole reason a teacher opens this list.
  const scored =
    item.type === "TEST_SUBMITTED" && item.score != null && item.maxScore != null;
  const provisional = scored && item.attemptStatus !== "GRADED";
  const testHref = item.test
    ? item.type === "TEST_SUBMITTED" && item.attemptId
      ? `/groups/${classId}/tests/${item.test.id}/results/${item.attemptId}`
      : item.type === "TEST_STARTED"
        ? `/groups/${classId}/tests/${item.test.id}/results`
        : studioRoutes.builder(item.test.id)
    : null;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
          TONES[item.type],
        )}
      >
        <Icon />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{name}</span>{" "}
          <span className="text-muted-foreground">
            {t(EVENT_KEYS[item.type])}
          </span>{" "}
          {item.test && testHref ? (
            <Link
              href={testHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {item.test.title}
            </Link>
          ) : null}
        </p>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <RelativeTime date={item.at} className="text-2xs text-muted-foreground" />

          {item.isLate ? (
            <Badge variant="warning" size="xs">
              {t("root.classDetail.activity.late")}
            </Badge>
          ) : null}

          {scored ? (
            <>
              {/*
                The mark itself, plus the percentage — the number a teacher
                scans a feed for. Tone follows the pass flag when there is one;
                a part-marked attempt stays neutral, because colouring an
                incomplete score green or red asserts an outcome nobody has
                decided yet.
              */}
              <Badge
                variant={
                  provisional || item.passed == null
                    ? "neutral"
                    : item.passed
                      ? "success"
                      : "destructive"
                }
                size="xs"
              >
                <span className="tabular-nums">
                  {item.score} / {item.maxScore}
                </span>
                {item.percentage != null ? (
                  <span className="tabular-nums opacity-80">· {item.percentage}%</span>
                ) : null}
              </Badge>

              {provisional ? (
                <span className="text-2xs text-muted-foreground">
                  {t("root.classDetail.activity.partiallyMarked")}
                </span>
              ) : null}
            </>
          ) : item.type === "TEST_SUBMITTED" ? (
            <span className="text-2xs text-muted-foreground">
              {t("root.classDetail.activity.awaitingMark")}
            </span>
          ) : null}

          {/* The submission row is the natural way into the marked paper. */}
          {item.type === "TEST_SUBMITTED" && testHref ? (
            <Link
              href={testHref}
              className="text-2xs font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("root.classDetail.activity.viewResult")}
            </Link>
          ) : null}
        </div>
      </div>

      {item.actor ? (
        <Avatar name={item.actor.fullName} size="sm" tint="seeded" className="shrink-0" />
      ) : null}
    </div>
  );
}
