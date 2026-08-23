import { notFound } from "next/navigation";

import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import type { DashboardAvailability } from "@/app/(root)/_utils/getDashboard";
import SideBar from "@/app/(root)/_components/Sidebar";
import ShellBackdrop from "@/components/Custom/ShellBackdrop";
import DashboardComposer, {
  type DashboardComposerContext,
} from "@/app/(root)/(pages)/dashboard/_components/composer/DashboardComposer";

export const dynamic = "force-dynamic";

/**
 * Design preview for the dashboard composer — development only.
 *
 * The dashboard sits behind a real session and a school with real data, which
 * makes design iteration on its states (roles × stages) needlessly expensive.
 * This route renders the same `DashboardComposer` with representative fixture
 * data instead:
 *
 *   /dev/preview/dashboard?role=teacher&stage=active
 *   role  = teacher | admin | student
 *   stage = active | awaiting | populating | fresh
 *
 * Production builds 404: the route exists for a developer with the dev server
 * running, never for users, and the fixture school must not be mistaken for a
 * real one.
 */

const TREND_POINTS = [
  { month: "2026-03", avg: 68 },
  { month: "2026-04", avg: 71 },
  { month: "2026-05", avg: 69 },
  { month: "2026-06", avg: 74 },
  { month: "2026-07", avg: 78 },
  { month: "2026-08", avg: 81 },
];

const CLASSES = [
  { classId: "c1", className: "7-A Mathematics", studentCount: 26, completedAssessments: 8, averageScore: 74, completionRate: 92 },
  { classId: "c2", className: "8-A Biology", studentCount: 24, completedAssessments: 11, averageScore: 81, completionRate: 96 },
  { classId: "c3", className: "8-B Biology", studentCount: 22, completedAssessments: 9, averageScore: 66, completionRate: 78 },
  { classId: "c4", className: "9-A Chemistry", studentCount: 25, completedAssessments: 6, averageScore: 88, completionRate: 100 },
  { classId: "c5", className: "9-B Chemistry", studentCount: 23, completedAssessments: 5, averageScore: 71, completionRate: 84 },
];

const SUBMISSIONS = [
  { classId: "c1", className: "7-A Mathematics", onTime: 21, late: 3, missing: 2 },
  { classId: "c2", className: "8-A Biology", onTime: 22, late: 1, missing: 1 },
  { classId: "c3", className: "8-B Biology", onTime: 14, late: 4, missing: 4 },
  { classId: "c4", className: "9-A Chemistry", onTime: 25, late: 0, missing: 0 },
];

const FEED = {
  upcoming: [
    { id: "u1", title: "Weekly quiz — Photosynthesis", dueAt: "2026-08-25T09:00:00Z", kind: "test", href: "/tests" },
    { id: "u2", title: "Unit test — Algebraic fractions", dueAt: "2026-08-26T07:30:00Z", kind: "test", href: "/tests" },
    { id: "u3", title: "Periodic table check", dueAt: "2026-08-28T10:00:00Z", kind: "test", href: "/tests" },
    { id: "u4", title: "Reading comprehension — Unit 4", dueAt: "2026-08-29T08:00:00Z", kind: "test", href: "/tests" },
  ],
  recent: [
    { id: "r1", title: "14 submissions on Weekly quiz", at: "2026-08-23T16:40:00Z", kind: "submission", href: "/tests" },
    { id: "r2", title: "Aziza Karimova joined 8-A Biology", at: "2026-08-23T14:05:00Z", kind: "member", href: "/groups" },
    { id: "r3", title: "Unit test published to 7-A", at: "2026-08-22T11:20:00Z", kind: "test", href: "/tests" },
    { id: "r4", title: "3 papers graded in 8-B Biology", at: "2026-08-21T09:10:00Z", kind: "grading", href: "/tests" },
  ],
};

function availabilityFor(stage: string, role: SchoolRole): DashboardAvailability {
  const active = stage === "active";
  const awaiting = stage === "awaiting";
  const populating = stage === "populating";
  return {
    hasClasses: active || awaiting || populating,
    hasStudents: role !== "STUDENT" && (active || awaiting),
    hasResults: active,
    hasUpcoming: active || awaiting,
    hasActivity: active || awaiting,
    hasSubmissions: active && role !== "STUDENT",
    hasClassPerformance: (active || awaiting) && role !== "STUDENT",
    hasAttendance: false,
  };
}

function contextFor(role: SchoolRole, stage: string): DashboardComposerContext {
  const availability = availabilityFor(stage, role);
  const active = stage === "active";
  const somePeople = availability.hasStudents;

  const staffSummary = {
    students: somePeople ? 118 : 0,
    classes: availability.hasClasses ? 5 : 0,
    exams: active ? 39 : 0,
    assessments: active ? 39 : 0,
    teachers: somePeople ? 9 : 0,
    avgScore: active ? 76 : 0,
    completionRate: active ? 89 : null,
    pendingGrading: active ? 14 : 0,
  };
  const studentSummary = {
    enrolledCourses: availability.hasClasses ? 4 : 0,
    dueThisWeek: active || stage === "awaiting" ? 2 : 0,
    myAverage: active ? 83 : 0,
    completedAssessments: active ? 17 : 0,
    inProgressAssessments: active ? 1 : 0,
    attendancePct: null,
  };

  return {
    role,
    fullName: role === "STUDENT" ? "Diyor Rakhimov" : "Aziza Karimova",
    schoolName: "Istiqbol Learning Center",
    studentJoinCode: role === "ADMIN" ? "DW-8A4K2" : null,
    availability,
    summary: role === "STUDENT" ? studentSummary : staffSummary,
    trend: active ? { points: TREND_POINTS } : { points: [] },
    distributions: active
      ? {
          grades: [
            { bucket: "A" as const, count: 34 },
            { bucket: "B" as const, count: 51 },
            { bucket: "C" as const, count: 27 },
            { bucket: "D/F" as const, count: 9 },
          ],
          membersByRole: { students: 118, teachers: 9, admins: 2 },
        }
      : { grades: [], membersByRole: { students: 0, teachers: 0, admins: 0 } },
    submissions: availability.hasSubmissions ? { byClass: SUBMISSIONS } : { byClass: [] },
    classPerformance: availability.hasClassPerformance
      ? {
          classes: active
            ? CLASSES
            : CLASSES.map((row) => ({
                ...row,
                completedAssessments: 0,
                averageScore: null,
                completionRate: null,
              })),
        }
      : { classes: [] },
    feed: availability.hasUpcoming || availability.hasActivity ? FEED : { upcoming: [], recent: [] },
    studentClasses:
      role === "STUDENT" && availability.hasClasses
        ? [
            { id: "c1", name: "7-A Mathematics" },
            { id: "c2", name: "8-A Biology" },
            { id: "c6", name: "English B1" },
            { id: "c7", name: "History of Uzbekistan" },
          ]
        : [],
    availableClasses: role === "STUDENT" ? 3 : 0,
    pendingRequests: role === "ADMIN" && active ? 3 : 0,
  };
}

export default async function DashboardPreview({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; stage?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const params = await searchParams;
  const role = (params.role ?? "teacher").toUpperCase() as SchoolRole;
  const stage = params.stage ?? "active";

  return (
    // The same shell composition as `(root)/layout.tsx`, so the preview looks
    // like the product and not like a component floating on a bare page. The
    // sidebar's notification badge query fails soft without a session, and its
    // links lead to auth-gated routes — fine for a design preview.
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground md:h-screen">
      <SideBar schoolRole={role} />
      <div className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ShellBackdrop />
        <main className="content-scroll relative z-10 min-h-0 min-w-0 flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="mx-auto w-full min-w-0 max-w-[1180px] px-4 py-6 md:px-8 md:py-8">
            <DashboardComposer context={contextFor(role, stage)} />
          </div>
        </main>
      </div>
    </div>
  );
}
