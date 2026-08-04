"use client";

import type { InvitationResponse, NotificationItem } from "@/app/(root)/_types";
import { NotificationCard } from "./NotificationCard";

type NotificationSectionProps = {
  items: NotificationItem[];
  label: string;
  onOpen: (item: NotificationItem) => void;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onRespond: (id: string, response: InvitationResponse) => void;
};

/**
 * A single date bucket (Today / Yesterday / …). Rendered as a fragment so the
 * header and each row become direct siblings of the shared divided card, giving
 * one continuous hairline rhythm across every group.
 */
export function NotificationSection({
  items,
  label,
  onOpen,
  onDelete,
  onMarkRead,
  onRespond,
}: Readonly<NotificationSectionProps>) {
  if (items.length === 0) return null;

  return (
    <>
      <div className="flex items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--muted)_55%,transparent)] px-4 py-2.5 sm:px-5">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="text-2xs font-semibold text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.map((item) => (
        <NotificationCard
          key={item.id}
          item={item}
          onOpen={onOpen}
          onDelete={onDelete}
          onMarkRead={onMarkRead}
          onRespond={onRespond}
        />
      ))}
    </>
  );
}
