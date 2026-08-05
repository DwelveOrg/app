export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
  },
  schools: {
    all: ["schools"] as const,
  },
  classes: {
    all: ["classes"] as const,
    detail: (classId: string) => [...queryKeys.classes.all, "detail", classId] as const,
    /** Every search variant of a class's student picker, for broad invalidation. */
    assignableStudentsAll: (classId: string) =>
      [...queryKeys.classes.all, "assignable-students", classId] as const,
    assignableStudents: (classId: string, filters: { search: string; limit: number }) =>
      [...queryKeys.classes.assignableStudentsAll(classId), filters] as const,
    assignableTeachersAll: (classId: string) =>
      [...queryKeys.classes.all, "assignable-teachers", classId] as const,
    assignableTeachers: (classId: string, filters: { search: string; limit: number }) =>
      [...queryKeys.classes.assignableTeachersAll(classId), filters] as const,
  },
  tests: {
    all: ["tests"] as const,
    list: (classId: string, filters: { status: string; page: number }) =>
      [...queryKeys.tests.all, "list", classId, filters] as const,
    detail: (testId: string) => [...queryKeys.tests.all, "detail", testId] as const,
    validation: (testId: string) =>
      [...queryKeys.tests.all, "validation", testId] as const,
    formats: () => [...queryKeys.tests.all, "formats"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    status: () => [...queryKeys.notifications.all, "status"] as const,
    lists: () => [...queryKeys.notifications.all, "list"] as const,
    list: (tab: "all" | "unread", limit: number, category?: string) =>
      [...queryKeys.notifications.lists(), tab, category ?? "all", limit] as const,
  },
  enrollment: {
    all: ["enrollment"] as const,
    overview: (schoolId: string) =>
      [...queryKeys.enrollment.all, "overview", schoolId] as const,
    /** The student class directory for a school (`GET /classes`). */
    studentClassesAll: (schoolId: string) =>
      [...queryKeys.enrollment.all, "student-classes", schoolId] as const,
    studentClasses: (schoolId: string) => queryKeys.enrollment.studentClassesAll(schoolId),
    myClasses: () => [...queryKeys.enrollment.all, "my-classes"] as const,
    myRequestsAll: () => [...queryKeys.enrollment.all, "my-requests"] as const,
    myRequests: (limit: number) =>
      [...queryKeys.enrollment.myRequestsAll(), limit] as const,
    /** All join-request variants for a class (used for broad invalidation). */
    classRequestsAll: (classId: string) =>
      [...queryKeys.enrollment.all, "class-requests", classId] as const,
    classRequests: (classId: string, filters: { search: string; limit: number }) =>
      [...queryKeys.enrollment.classRequestsAll(classId), filters] as const,
    /** The teacher-visible class list for a school (`GET /classes`, TEACHER). */
    teacherClassesAll: (schoolId: string) =>
      [...queryKeys.enrollment.all, "teacher-classes", schoolId] as const,
    teacherClasses: (schoolId: string) => queryKeys.enrollment.teacherClassesAll(schoolId),
    /** All teacher-request variants for a class (used for broad invalidation). */
    teacherRequestsAll: (classId: string) =>
      [...queryKeys.enrollment.all, "teacher-requests", classId] as const,
    teacherRequests: (classId: string, filters: { search: string; limit: number }) =>
      [...queryKeys.enrollment.teacherRequestsAll(classId), filters] as const,
  },
};
