export const ROUTE_LABEL_KEYS: Record<string, string> = {
  dashboard: "root.pages.dashboard",
  groups: "root.pages.classes",
  tests: "root.pages.tests",
  school: "root.pages.school",
  notifications: "root.pages.notifications",
  profile: "root.pages.profile",
  settings: "root.pages.settings",
  assignments: "sidebar.assignments",
  homework: "root.pages.homework",
  exams: "root.pages.exams",
  "change-password": "root.settings.security.changePassword.page.title",
  documentation: "root.settings.documentation.page.title",
  "login-history": "root.settings.security.loginHistory.title",
};

export function getRouteLabelKey(segment: string) {
  return ROUTE_LABEL_KEYS[segment];
}

export function isRouteActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
