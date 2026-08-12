"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { logout } from "@/app/(authentication)/_lib/actions";
import { useNotificationStatus } from "@/app/(root)/_hooks/useNotifications";
import {
  Bell,
  GraduationCap,
  House,
  LogOut,
  Menu,
  NotebookPen,
  School,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { NavItem } from "../../_types/index";
import { isRouteActive } from "../../_constants";
import Badge from "@/components/ui/badge";
import DwelveLogo from "@/components/Custom/DwelveLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SIDEBAR_WIDTH = "w-[264px]";

/**
 * Shared row geometry so every nav row (link, locked, logout) lines up exactly.
 * Weight is the state signal, not size: idle rests at `font-normal` (400) so the
 * active jump to `font-semibold` (600) reads clearly; row size never changes, so
 * switching tabs never shifts the layout.
 */
const ROW_BASE =
  "interactive-flat group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-15 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";
// Active is a soft action tint plus a left rail — the rail is what survives at a glance when the
// tint sits on an already-tinted sidebar. A lift is deliberately absent: nav rows must never move.
const ROW_ACTIVE =
  "bg-[color-mix(in_srgb,var(--primary)_13%,transparent)] text-accent-foreground font-semibold tracking-[0.01em] shadow-elev-1";
const ROW_IDLE = "text-muted-foreground hover:bg-muted hover:text-foreground";

function NavIcon({ icon: Icon, color }: { icon: LucideIcon; color?: string }) {
  return <Icon color={color} className="h-5 w-5 shrink-0" strokeWidth={2} />;
}

/** Unread count on the Notifications row — the one solid badge in the shell. */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Badge variant="solid" size="sm" shape="count" className="ml-auto">
      {count}
    </Badge>
  );
}

function NavLink({
  item,
  active,
  badge,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative ${ROW_BASE} ${active ? ROW_ACTIVE : ROW_IDLE}`}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
        />
      ) : null}
      <NavIcon icon={item.icon} />
      <span className="truncate">{item.label}</span>
      {badge ? <CountBadge count={badge} /> : null}
    </Link>
  );
}

function LockedNavItem({
  icon: Icon,
  label,
  comingSoonLabel,
}: {
  icon: LucideIcon;
  label: string;
  comingSoonLabel: string;
}) {
  return (
    <div
      aria-disabled="true"
      className={`${ROW_BASE} cursor-not-allowed select-none text-muted-foreground opacity-55`}
    >
      <NavIcon icon={Icon} />
      <span className="truncate">{label}</span>
      <Badge variant="neutral" size="xs" uppercase className="ml-auto">
        {comingSoonLabel}
      </Badge>
    </div>
  );
}

function MobileLink({
  item,
  active,
  badge,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onPress?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onPress}
      aria-current={active ? "page" : undefined}
      className={`interactive-flat relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="relative">
        <NavIcon icon={item.icon} />
        {badge ? (
          <Badge variant="solid" size="xs" shape="count" className="absolute -right-2 -top-1.5">
            {badge}
          </Badge>
        ) : null}
      </span>
      <span className="truncate text-2xs font-semibold max-[430px]:hidden">{item.label}</span>
    </Link>
  );
}

export default function SideBar({ schoolRole }: { schoolRole?: string | null }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const { data: notificationStatus } = useNotificationStatus();
  const unreadCount = notificationStatus?.unreadCount ?? 0;

  // Primary navigation — order and items mirror the reference design.
  const primaryItems: NavItem[] = [
    { href: "/dashboard", label: t("sidebar.dashboard"), icon: House },
    { href: "/school", label: t("sidebar.school"), icon: School },
    { href: "/groups", label: t("sidebar.classes"), icon: GraduationCap },
  ];
  const notificationsItem: NavItem = {
    href: "/notifications",
    label: t("sidebar.notifications"),
    icon: Bell,
  };
  /**
   * One account destination, not two. Profile and Settings were separate rows
   * over the same `GET /profile` payload; `/profile` now owns identity,
   * security, preferences and support as tabs.
   */
  const profileItem: NavItem = { href: "/profile", label: t("sidebar.profile"), icon: UserRound };

  /**
   * Assignments: the tests set for a student's classes, or — for staff — the
   * tests they have set across theirs. One row, because it is one question
   * asked from two directions, and it now has a real destination for every
   * membership role rather than a "coming soon" for two of the three.
   */
  const assignmentsItem: NavItem = {
    href: "/assignments/exams",
    label: t("sidebar.assignments"),
    icon: NotebookPen,
  };
  /**
   * An account with no membership has neither side of it, so the row stays
   * locked for them rather than opening onto an access state.
   */
  const hasAssignments =
    schoolRole === "STUDENT" || schoolRole === "TEACHER" || schoolRole === "ADMIN";

  const comingSoon = t("sidebar.comingSoon");
  const isActive = (href: string) => isRouteActive(pathname, href);

  const mobileExtra: NavItem[] = [profileItem];

  return (
    <>
      {/* Desktop: flat, flush-left full-height panel with a hairline right divider. */}
      <aside
        className={`hidden md:sticky md:top-0 md:flex md:h-screen md:flex-col ${SIDEBAR_WIDTH} shrink-0 border-r border-border bg-sidebar text-sidebar-foreground`}
      >
        <div className="px-6 pb-5 pt-6">
          <DwelveLogo variant="form" />
        </div>

        <nav
          aria-label={t("sidebar.primaryNav")}
          className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3"
        >
          {primaryItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
          {hasAssignments ? (
            <NavLink item={assignmentsItem} active={isActive(assignmentsItem.href)} />
          ) : (
            <LockedNavItem
              icon={NotebookPen}
              label={t("sidebar.assignments")}
              comingSoonLabel={comingSoon}
            />
          )}
          <NavLink
            item={notificationsItem}
            active={isActive(notificationsItem.href)}
            badge={unreadCount}
          />
        </nav>

        <div className="space-y-1 border-t border-border px-3 py-3">
          <NavLink item={profileItem} active={isActive(profileItem.href)} />
          <button
            type="button"
            onClick={logout}
            className={`${ROW_BASE} ${ROW_IDLE} cursor-pointer hover:bg-destructive/10 hover:text-destructive`}
          >
            <NavIcon icon={LogOut} />
            <span className="truncate">{t("sidebar.logOut")}</span>
          </button>
        </div>
      </aside>

      {/* Mobile: bottom navigation bar. */}
      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <nav
          aria-label={t("sidebar.primaryNav")}
          className="border-t border-border bg-[color-mix(in_srgb,var(--card)_92%,transparent)] p-2 shadow-elev-3 supports-backdrop-filter:backdrop-blur-md"
        >
          <div className="flex items-stretch gap-1.5">
            {primaryItems.map((item) => (
              <MobileLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onPress={() => setMobileMoreOpen(false)}
              />
            ))}
            <MobileLink
              item={notificationsItem}
              active={isActive(notificationsItem.href)}
              badge={unreadCount}
              onPress={() => setMobileMoreOpen(false)}
            />
            <DropdownMenu open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`interactive-flat flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-2xs font-semibold ${
                    mobileMoreOpen
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-label={t("sidebar.toggleMore")}
                >
                  <NavIcon icon={Menu} />
                  <span className="max-[430px]:hidden">{t("sidebar.more")}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="mb-2 w-[260px] rounded-2xl border-border bg-popover p-2 shadow-elev-3 max-[350px]:w-[220px]"
              >
                {hasAssignments ? (
                  <DropdownMenuItem
                    asChild
                    className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold max-[350px]:rounded-lg max-[350px]:px-2.5 max-[350px]:py-2 max-[350px]:text-xs ${
                      isActive(assignmentsItem.href)
                        ? "bg-accent text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        : ""
                    }`}
                  >
                    <Link
                      href={assignmentsItem.href}
                      onClick={() => setMobileMoreOpen(false)}
                    >
                      <NavIcon icon={NotebookPen} />
                      <span className="ml-3">{assignmentsItem.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold opacity-70 max-[350px]:rounded-lg max-[350px]:px-2.5 max-[350px]:py-2 max-[350px]:text-xs"
                  >
                    <NavIcon icon={NotebookPen} />
                    <span className="ml-3">{t("sidebar.assignments")}</span>
                    <Badge variant="neutral" size="xs" uppercase className="ml-auto">
                      {comingSoon}
                    </Badge>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1.5" />
                {mobileExtra.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold max-[350px]:rounded-lg max-[350px]:px-2.5 max-[350px]:py-2 max-[350px]:text-xs ${
                      isActive(item.href)
                        ? "bg-accent text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        : "text-popover-foreground/75"
                    }`}
                  >
                    <Link href={item.href}>
                      <NavIcon icon={item.icon} />
                      <span className="ml-3">{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    logout();
                  }}
                  className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold text-popover-foreground/75 max-[350px]:rounded-lg max-[350px]:px-2.5 max-[350px]:py-2 max-[350px]:text-xs"
                >
                  <NavIcon color="var(--destructive)" icon={LogOut} />
                  <span className="ml-3">{t("sidebar.logOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </>
  );
}
