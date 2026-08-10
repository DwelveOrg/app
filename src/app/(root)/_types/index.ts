import { LucideIcon } from "lucide-react";

export interface NotificationItem {
  id: string;
  schoolId?: string | null;
  type: string;
  titleKey: string;
  bodyKey: string;
  /** Optional backend payload; for invitations it carries {@link NotificationInvitationData}. */
  data?: NotificationInvitationData | Record<string, unknown> | null;
  /** ISO 8601 timestamp; rendered as a live relative time via <RelativeTime />. */
  createdAt: string;
  readAt?: string | null;
  unread: boolean;
  /** Backend-assigned category (drives the tint and the category filter). */
  category?: NotificationCategory;
}

/**
 * Structured payload on invitation-type notifications, used to render the
 * inline Accept / Decline actions and to resolve the invite on the backend.
 * See docs/features/notifications.md.
 */
export type NotificationInvitationData = {
  invitationId?: string;
  /** Resolution state once the user has responded (backend-owned). */
  status?: "pending" | "accepted" | "declined";
  [key: string]: unknown;
};

/** Read-state filter sent to the backend as the `tab` query param. */
export type NotificationTab = "all" | "unread";

/** Notification category (backend-assigned; the frontend also derives it as a fallback). */
/**
 * Mirrors the backend's `ListNotificationsDto` filter, which gained `test` when
 * attempts shipped. A value the API accepts but this union omits is a filter
 * pill the product can never show.
 */
export type NotificationCategory = "system" | "payments" | "invitations" | "test";

/**
 * The active filter pill on the notifications page. `all`/`unread` map to the
 * `tab` query param; `system`/`payments`/`invitations` map to the backend
 * `category` query param (server-side filtering).
 */
export type NotificationFilter = NotificationTab | NotificationCategory;

/** Response body for the "respond to invitation" action. */
export type InvitationResponse = "accept" | "decline";

export type NotificationStatusResponse = {
  hasUnread: boolean;
  unreadCount: number;
};

export type NotificationsListResponse = {
  data: NotificationItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    unreadCount: number;
  };
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type Items = {
  item: string;
  number: number;
}

export type ThemeOption = "light" | "dark" | "system";
