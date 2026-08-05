"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import ClassRequestsPanel, { type RequestsTab } from "./ClassRequestsPanel";

type ClassRequestsViewProps = {
  classId: string;
  className: string;
  /** Admins also review teacher requests to teach; teachers see students only. */
  isAdmin: boolean;
  /** Which queue to open first — teacher-request notifications deep-link here. */
  initialTab?: RequestsTab;
};

/**
 * The standalone request queue for one class, kept as the deep-link target for
 * notifications. The queues themselves are `ClassRequestsPanel`, which the class
 * page also renders — so reviewing a request never depends on which of the two
 * surfaces the user happens to be on.
 */
export default function ClassRequestsView({
  classId,
  className,
  isAdmin,
  initialTab = "students",
}: ClassRequestsViewProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <section className="flex flex-col gap-6 py-6">
      <Link
        href={`/groups/${classId}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("root.enrollment.classRequests.back")}
      </Link>

      <header>
        <h1 className="type-title text-foreground">
          {t("root.enrollment.classRequests.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("root.enrollment.classRequests.subtitle", { name: className })}
        </p>
      </header>

      <ClassRequestsPanel
        classId={classId}
        isAdmin={isAdmin}
        initialTab={initialTab}
        // The class name and roster on this route are server-rendered too.
        onReviewed={() => router.refresh()}
      />
    </section>
  );
}
