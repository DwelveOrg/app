"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/utils";
import EmptyArtwork from "./Artwork";

type EmptyProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
  /**
   * `dashed` reads as "a slot waiting to be filled" — right for a first-run state the user is meant
   * to act on. `card` is the resting surface, right for a genuine "nothing here yet".
   */
  variant?: "card" | "dashed";
};

/**
 * The empty, error, and first-run state. An empty state should teach the interface, so `action` is
 * where the way forward goes — not a bare "nothing here".
 */
const Empty = ({
  title,
  description,
  icon,
  className = "",
  action,
  variant = "card",
}: EmptyProps) => {
  const { t } = useTranslation();

  return (
    <Surface
      variant={variant}
      elevation={variant === "dashed" ? 0 : 1}
      padding="none"
      className={cn(
        "mx-auto flex w-full max-w-lg flex-col items-center px-6 py-10 text-center",
        className,
      )}
    >
      <div className="relative">{icon ?? <EmptyArtwork />}</div>

      <h2 className="type-section mt-5 text-foreground">{title ?? t("root.empty.title")}</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
        {description ?? t("root.empty.description")}
      </p>
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </Surface>
  );
};

export default Empty;
