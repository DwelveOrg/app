"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import SortableList, { SortableRow } from "@/components/ui/SortableList";
import { readAnswer, type OrderingAnswer } from "@/lib/tests/answers";
import { cn } from "@/lib/utils";
import type { QuestionRenderProps } from "../types";

/**
 * Ordering: position is the answer.
 *
 * The stored value is the id sequence, and the starting sequence is the option
 * list as served — already shuffled server-side when the delivery asks for it,
 * never here. A client-side shuffle would reorder the list on every re-render,
 * and re-render is what typing in the next question causes.
 *
 * Drag is the fast path and the up/down buttons are the reliable one, per
 * `docs/architecture/ARCHITECTURE.md`. Under exam conditions that is not a
 * nicety: a student on a trackpad who cannot complete a sustained drag has no
 * other way to answer the question at all.
 */
export default function OrderingInput({
  question,
  mode,
  value,
  onChange,
  disabled,
}: QuestionRenderProps) {
  const { t } = useTranslation();
  const readOnly = mode !== "answer" || disabled;

  const byId = useMemo(
    () => new Map(question.options.map((option) => [option.id, option])),
    [question.options],
  );

  /**
   * The saved sequence, repaired against the current option list: ids the
   * question no longer has are dropped, and options the answer never mentioned
   * are appended in their served order. Without that, a question edited after
   * an attempt started renders a list with a hole in it.
   */
  const order = useMemo(() => {
    const saved =
      (readAnswer("ORDERING", value) as OrderingAnswer | null)?.optionIds ?? [];
    const kept = saved.filter((id) => byId.has(id));
    const missing = question.options
      .map((option) => option.id)
      .filter((id) => !kept.includes(id));
    return [...kept, ...missing];
  }, [value, byId, question.options]);

  const commit = (next: string[]) => onChange?.({ optionIds: next });

  const move = (from: number, to: number) => {
    if (readOnly || to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commit(next);
  };

  return (
    <SortableList
      ids={order}
      onReorder={move}
      disabled={readOnly}
      className="divide-y divide-border rounded-xl border border-border"
    >
      {order.map((id, index) => {
        const option = byId.get(id);
        if (!option) return null;

        return (
          <SortableRow key={id} id={id} disabled={readOnly}>
            {({ setNodeRef, style, handle, isDragging }) => (
              <div
                ref={setNodeRef}
                style={style}
                className={cn(
                  "flex items-center gap-2 bg-card p-2.5",
                  isDragging && "rounded-xl shadow-elev-3",
                )}
              >
                <span
                  aria-hidden="true"
                  className="numeric inline-flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-muted text-2xs font-semibold text-muted-foreground"
                >
                  {index + 1}
                </span>

                {handle}

                <span className="exam-prose min-w-0 flex-1 text-15 text-foreground">
                  {option.text}
                </span>

                {readOnly ? null : (
                  <>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === 0}
                      aria-label={t("exam.paper.moveUp", { item: option.text })}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={index === order.length - 1}
                      aria-label={t("exam.paper.moveDown", { item: option.text })}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </SortableRow>
        );
      })}
    </SortableList>
  );
}
