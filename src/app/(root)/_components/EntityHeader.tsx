"use client";

import type { ReactNode } from "react";

import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/badge";
import Surface from "@/components/ui/Surface";
import { cn } from "@/lib/utils";

/**
 * The identity block at the top of a school or a class: who this is, whether it is active, a line
 * about it, a row of facts, and the actions you can take on it.
 *
 * `SchoolProfileHeader` and the header inside `ClassDetailView` were the same five slots in the
 * same order, written twice. They disagreed on tile size, heading size, and status-pill markup, so
 * two pages that are the same kind of page did not look related.
 *
 * The title is deliberately not truncated: Russian and Uzbek Latin run considerably longer than
 * English, and a clipped school name is worse than a wrapped one.
 */
export type EntityHeaderProps = {
  /** Used for the initials and the image's alt text. */
  name: string;
  imageUrl?: string | null;
  /** Tint for the initials tile when there is no image — e.g. the per-class accent. */
  tileClassName?: string;
  /** `lg` for a school, `xl` for a class page. */
  tileSize?: "lg" | "xl";
  title?: ReactNode;
  headingId?: string;
  /** Active / archived. Rendered as a badge so every status pill in the product matches. */
  status?: { label: string; active: boolean };
  description?: ReactNode;
  /** The facts row — stat dots, a location, a "viewing as" chip. */
  meta?: ReactNode;
  actions?: ReactNode;
  /** Dialogs and other non-visual siblings that belong to this header. */
  children?: ReactNode;
  className?: string;
};

export default function EntityHeader({
  name,
  imageUrl,
  tileClassName,
  tileSize = "lg",
  title,
  headingId,
  status,
  description,
  meta,
  actions,
  children,
  className,
}: Readonly<EntityHeaderProps>) {
  return (
    <Surface
      as="section"
      padding="lg"
      aria-labelledby={headingId}
      className={cn(className)}
    >
      <div className="flex flex-wrap items-start gap-4">
        <Avatar
          name={name}
          src={imageUrl}
          size={tileSize}
          shape="rounded"
          className={tileClassName}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 id={headingId} className="type-section text-foreground">
              {title ?? name}
            </h1>
            {status ? (
              <Badge variant={status.active ? "success" : "neutral"}>{status.label}</Badge>
            ) : null}
          </div>

          {description ? (
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
          ) : null}

          {meta ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {meta}
            </div>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {children}
    </Surface>
  );
}

export { EntityHeader };
