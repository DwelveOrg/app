"use client";

import { useDeferredValue, useMemo } from "react";
import type { TFunction } from "i18next";
import {
  AlertTriangle,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import { useWatch, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { QuestionTypeCatalog } from "@/app/(root)/_lib/tests.schemas";
import type { TestBuilderForm } from "@/app/(root)/_lib/tests.actions.schemas";
import {
  groupAnchorId,
  questionAnchorId,
  sectionAnchorId,
} from "@/app/(root)/_constants/tests";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ACCENT_CLASSES, presentationFor } from "../_lib/questionPresentation";

/**
 * The outline: every section, group, and question in one navigable column.
 *
 * This is the change that makes a forty-question paper editable. The previous
 * builder was a single scrolling stack, so "question 34 is missing its correct
 * answer" meant scrolling past thirty-three questions to find it, and there was
 * no way to see the shape of the paper at all. The rail is a map, a jump
 * target, and — because it shows the flags — the working list while fixing
 * publish issues.
 *
 * ## Why the subscription lives here
 *
 * The rail shows live prompt text, so it has to re-render as the teacher types.
 * Watching `sections` in the builder root would re-render the whole tree on
 * every keystroke and undo the memoisation that keeps eight hundred fields
 * responsive. Subscribing inside this component confines the re-render to the
 * rail, and `useDeferredValue` lets React drop intermediate frames when typing
 * outruns it — the outline is a map, and a map may lag a character.
 */
export default function OutlineRail({
  control,
  catalog,
  flaggedIds,
  collapsed,
  onToggle,
}: {
  control: Control<TestBuilderForm>;
  catalog: QuestionTypeCatalog;
  flaggedIds: ReadonlySet<string>;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const watched = useWatch({ control, name: "sections" });
  const sections = useDeferredValue(watched);

  /**
   * The tree flattened to a list of rows.
   *
   * Built up front rather than accumulated while rendering, because question
   * numbering runs across the whole test and a counter incremented inside
   * `.map()` is state that survives one render and lies on the next.
   */
  const rows = useMemo(() => buildRows(sections ?? [], catalog, t), [sections, catalog, t]);

  /**
   * Jumping is a scroll plus a focus, not a hash change: a hash would push a
   * history entry per click, so the browser back button would walk the
   * teacher's reading path instead of leaving the studio.
   */
  const jumpTo = (anchor: string | null) => {
    if (!anchor) return;
    const element = document.getElementById(anchor);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    element.focus({ preventScroll: true });
  };

  if (collapsed) {
    return (
      <div className="hidden shrink-0 border-r border-border bg-card px-2 py-3 lg:block">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={t("root.tests.builder.outline.expand")}
          onClick={onToggle}
        >
          <PanelLeft />
        </Button>
      </div>
    );
  }

  return (
    <nav
      aria-label={t("root.tests.builder.outline.title")}
      className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className="type-micro flex-1 text-muted-foreground">
          {t("root.tests.builder.outline.title")}
        </span>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label={t("root.tests.builder.outline.collapse")}
          onClick={onToggle}
        >
          <PanelLeftClose />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {rows.map((row) => (
          <OutlineButton
            key={row.key}
            level={row.level}
            label={row.label}
            number={row.number}
            leading={
              row.icon ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded [&_svg]:size-3",
                    row.accentClass ?? "bg-muted text-muted-foreground",
                  )}
                >
                  <row.icon />
                </span>
              ) : null
            }
            trailing={
              row.count != null ? (
                <span className="text-3xs text-muted-foreground tabular-nums">
                  {row.count}
                </span>
              ) : null
            }
            flagged={Boolean(row.serverId) && flaggedIds.has(row.serverId!)}
            onClick={() => jumpTo(row.anchor)}
          />
        ))}
      </div>
    </nav>
  );
}

type OutlineRow = {
  key: string;
  level: 0 | 1 | 2;
  label: string;
  number?: number;
  count?: number;
  serverId?: string;
  anchor: string | null;
  icon?: LucideIcon;
  accentClass?: string;
};

function buildRows(
  sections: TestBuilderForm["sections"],
  catalog: QuestionTypeCatalog,
  t: TFunction,
): OutlineRow[] {
  const rows: OutlineRow[] = [];
  let questionNumber = 0;

  sections.forEach((section, sectionIndex) => {
    rows.push({
      key: `section-${sectionIndex}`,
      level: 0,
      label: section.title || t("root.tests.builder.outline.untitledSection"),
      count: section.groups.reduce((total, group) => total + group.questions.length, 0),
      serverId: section.serverId,
      anchor: section.serverId ? sectionAnchorId(section.serverId) : null,
    });

    section.groups.forEach((group, groupIndex) => {
      // A group with no title and no passage is the implicit one every test
      // carries, and listing it would add a level of nesting that means nothing
      // to the teacher. It appears only once it is a real group.
      if (section.groups.length > 1 || group.title || group.passage) {
        rows.push({
          key: `group-${sectionIndex}-${groupIndex}`,
          level: 1,
          label:
            group.title || t("root.tests.builder.outline.group", { index: groupIndex + 1 }),
          serverId: group.serverId,
          anchor: group.serverId ? groupAnchorId(group.serverId) : null,
        });
      }

      group.questions.forEach((question, index) => {
        questionNumber += 1;
        const spec = catalog[question.type];
        const presentation = spec ? presentationFor(question.type, spec) : null;

        rows.push({
          key: `question-${sectionIndex}-${groupIndex}-${index}`,
          level: 2,
          label: question.prompt.trim() || t("root.tests.builder.outline.emptyQuestion"),
          number: questionNumber,
          serverId: question.serverId,
          anchor: question.serverId ? questionAnchorId(question.serverId) : null,
          icon: presentation?.icon,
          accentClass: presentation
            ? ACCENT_CLASSES[presentation.accent].chip
            : undefined,
        });
      });
    });
  });

  return rows;
}

function OutlineButton({
  level,
  label,
  number,
  leading,
  trailing,
  flagged,
  onClick,
}: {
  level: 0 | 1 | 2;
  label: string;
  number?: number;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  flagged: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "interactive-flat flex w-full cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pr-2 text-left outline-none",
        "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40",
        level === 0 && "pl-2 text-xs font-semibold text-foreground",
        level === 1 && "pl-4 text-2xs font-medium text-muted-foreground",
        level === 2 && "pl-4 text-2xs text-muted-foreground",
      )}
    >
      {leading}
      {typeof number === "number" ? (
        <span className="w-5 shrink-0 text-right text-3xs tabular-nums">{number}</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {/*
        Icon, not a coloured dot: a flag is a problem and must survive a
        greyscale screenshot (`docs/design/design-system.md` §3.3).
      */}
      {flagged ? (
        <AlertTriangle className="size-3 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        trailing
      )}
    </button>
  );
}
