import {
  Bell,
  CalendarClock,
  CircleSlash,
  CreditCard,
  GraduationCap,
  NotebookPen,
  School,
  Sparkles,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";

type NotificationIconProps = {
  type: string;
  className?: string;
};

/**
 * Renders a best-effort icon for a notification `type`. Each branch returns a
 * literal element (rather than a component chosen into a variable) so the icon
 * reference stays static — required by the react-hooks/static-components rule.
 */
export function NotificationIcon({ type, className }: Readonly<NotificationIconProps>) {
  const value = type.toLowerCase();

  // Anchored: only a notification *about a problem report*, not anything whose
  // type happens to contain the word (a lab report, a progress report).
  if (/^report_resolved/.test(value)) return <Wrench className={className} />;
  if (/^report_dismissed/.test(value)) return <CircleSlash className={className} />;
  if (/assignment|homework|task/.test(value)) return <NotebookPen className={className} />;
  if (/grade|result|score|exam/.test(value)) return <GraduationCap className={className} />;
  if (/invit|join[_-]?request/.test(value)) return <Users className={className} />;
  if (/payment|billing|fee|invoice|subscription/.test(value)) {
    return <CreditCard className={className} />;
  }
  if (/deadline|reminder|alert|warning|due/.test(value)) {
    return <TriangleAlert className={className} />;
  }
  if (/school/.test(value)) return <School className={className} />;
  if (/schedule|calendar|class|room/.test(value)) return <CalendarClock className={className} />;
  if (/greeting|welcome|login|signup/.test(value)) return <Sparkles className={className} />;
  return <Bell className={className} />;
}
