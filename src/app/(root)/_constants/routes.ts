/**
 * Translation key per route segment, for breadcrumbs and segment labels.
 *
 * `settings`, `change-password`, `documentation` and `login-history` are gone
 * with the Settings routes: the account area is one destination (`/profile`)
 * whose panels are tabs, so there are no account subsegments left to label.
 */
export const ROUTE_LABEL_KEYS: Record<string, string> = {
  dashboard: "root.pages.dashboard",
  groups: "root.pages.classes",
  tests: "root.pages.tests",
  school: "root.pages.school",
  notifications: "root.pages.notifications",
  profile: "root.pages.profile",
  assignments: "sidebar.assignments",
  homework: "root.pages.homework",
  exams: "root.pages.exams",
};

export function getRouteLabelKey(segment: string) {
  return ROUTE_LABEL_KEYS[segment];
}

export function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
