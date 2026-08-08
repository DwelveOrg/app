"use client";

import Link from "next/link";
import { House } from "lucide-react";
import { useTranslation } from "react-i18next";

import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import { Button } from "@/components/ui/Button";

/**
 * The global 404 boundary must render a page rather than throwing a redirect.
 *
 * `redirect()` is represented internally as a special thrown value. React's
 * development performance instrumentation attempts to measure that throw as a
 * failed `NotFound` render, which can result in a negative-duration measure and
 * obscure the actual navigation. A normal 404 state keeps the invalid URL
 * visible and gives the user a reliable route back into the app.
 */
export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[1180px] items-center px-4 py-6 md:px-8 md:py-8">
      <Empty
        title={t("root.notFound.title")}
        description={t("root.notFound.description")}
        action={
          <Button asChild>
            <Link href="/dashboard">
              <House className="size-4" />
              {t("root.notFound.home")}
            </Link>
          </Button>
        }
      />
    </main>
  );
}
