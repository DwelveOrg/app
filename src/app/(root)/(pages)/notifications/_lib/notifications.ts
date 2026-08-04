import type { TFunction } from "i18next";
import type {
  NotificationCategory,
  NotificationInvitationData,
  NotificationItem,
} from "@/app/(root)/_types";

const INVITATION_TYPES = /invit|join[_-]?request/i;
const PAYMENT_TYPES = /payment|billing|fee|invoice|subscription/i;

/**
 * Derives a notification's category from its `type`. The backend now assigns a
 * `category` on each item and filters by it server-side, so this is only a
 * fallback for items that predate that field. Prefer {@link categoryForItem}.
 */
export function getNotificationCategory(type: string): NotificationCategory {
  if (INVITATION_TYPES.test(type)) return "invitations";
  if (PAYMENT_TYPES.test(type)) return "payments";
  return "system";
}

/** Backend category when present, otherwise derived from the type. */
export function categoryForItem(item: NotificationItem): NotificationCategory {
  return item.category ?? getNotificationCategory(item.type);
}

/**
 * Resolves the in-app destination for a notification from its `type` and the
 * IDs carried in `data`. Deletions route to the parent list (the entity is
 * gone); class join-requests route managers to the class requests page and
 * students to their own requests. Returns `null` when there's no sensible
 * target — the caller falls back to the details dialog.
 */
export function resolveNotificationHref(item: NotificationItem): string | null {
  const type = item.type ?? "";
  const data = (item.data ?? {}) as Record<string, unknown>;
  const classId = typeof data.classId === "string" ? data.classId : null;

  if (type === "CLASS_DELETED") return "/groups";
  if (type === "SCHOOL_DELETED") return "/school";

  if (type === "CLASS_JOIN_REQUEST_CREATED" && classId) {
    return `/groups/${classId}/requests`;
  }
  if (type.startsWith("CLASS_JOIN_REQUEST_")) return "/groups/requests";

  // A new teacher request routes the admin to that class's teacher-review tab.
  if (type === "TEACHER_CLASS_JOIN_REQUEST_CREATED" && classId) {
    return `/groups/${classId}/requests?tab=teachers`;
  }
  // An approved teacher can now enter the class; a rejected one cannot, so send
  // them back to the browse list where they can request again.
  if (type === "TEACHER_CLASS_JOIN_REQUEST_APPROVED" && classId) {
    return `/groups/${classId}`;
  }
  if (type.startsWith("TEACHER_CLASS_JOIN_REQUEST_")) return "/groups";

  if (classId) return `/groups/${classId}`;

  if (type.startsWith("SCHOOL_") || type.endsWith("_SCHOOL")) return "/school";

  return null;
}

/** Icon container tint per category, driven by design tokens (never hard-coded hex). */
export const CATEGORY_TINT: Record<NotificationCategory, string> = {
  system: "bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-info",
  payments: "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-success",
  invitations: "bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-primary",
};

/** True when a notification is an unresolved invitation (renders Accept / Decline). */
export function isPendingInvitation(item: NotificationItem): boolean {
  if (categoryForItem(item) !== "invitations") return false;
  const data = item.data as NotificationInvitationData | null | undefined;
  // Only true invitations carry an `invitationId` the backend can resolve. Class
  // join-request notifications share the "invitations" category (their type
  // matches the fallback regex) but are informational — they must not offer
  // Accept / Decline, which would post to the invitation endpoint and fail.
  if (typeof data?.invitationId !== "string") return false;
  const status = data.status;
  return status !== "accepted" && status !== "declined";
}

export type NotificationGroup = {
  key: string;
  label: string;
  items: NotificationItem[];
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Buckets notifications into Today / Yesterday / Earlier this week / older
 * per-day sections, comparing by local calendar day and preserving the
 * backend's newest-first ordering.
 */
export function groupNotificationsByDate(
  items: NotificationItem[],
  t: TFunction,
  language: string,
): NotificationGroup[] {
  const todayStart = startOfDay(new Date());
  const dayMs = 24 * 60 * 60 * 1000;
  const fullDate = new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const order: string[] = [];
  const groups = new Map<string, NotificationGroup>();

  for (const item of items) {
    const created = new Date(item.createdAt);
    const diffDays = Math.round((todayStart - startOfDay(created)) / dayMs);

    let key: string;
    let label: string;
    if (diffDays <= 0) {
      key = "today";
      label = t("root.notifications.dateGroups.today");
    } else if (diffDays === 1) {
      key = "yesterday";
      label = t("root.notifications.dateGroups.yesterday");
    } else if (diffDays < 7) {
      key = "week";
      label = t("root.notifications.dateGroups.earlierThisWeek");
    } else {
      key = `older-${startOfDay(created)}`;
      label = fullDate.format(created);
    }

    if (!groups.has(key)) {
      groups.set(key, { key, label, items: [] });
      order.push(key);
    }

    groups.get(key)?.items.push(item);
  }

  return order.map((key) => groups.get(key)!);
}
