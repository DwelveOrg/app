"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Reordering, once, for everything in the studio that has an order: the outline
 * rail, an ordering question's steps, a choice question's options, and a
 * matching question's pairs.
 *
 * ## Why a drag-and-drop library now
 *
 * `docs/architecture/ARCHITECTURE.md` previously ruled one out on the grounds
 * that up/down buttons are "keyboard- and touch-accessible, which `dnd-kit` is
 * not by default". Half of that is right and half of it is not: dnd-kit ships a
 * `KeyboardSensor`, and with `sortableKeyboardCoordinates` a list is fully
 * operable from the keyboard — space to lift, arrows to move, space to drop,
 * escape to cancel. What the buttons genuinely give is discoverability and a
 * target that does not require a sustained drag, which matters for motor
 * impairment and for touch.
 *
 * So this ships **both**. The handle is the fast path; the buttons stay on every
 * row as the reliable one. Reordering a forty-question paper with up-arrows
 * alone is the single worst thing about the old builder, and neither mechanism
 * is worth removing to fix it.
 *
 * Order is array position throughout — `move()` from `useFieldArray`, nothing
 * sent to the backend, which rewrites the sibling sequence to a contiguous
 * `0..n-1` inside the save transaction.
 */
export default function SortableList({
  ids,
  onReorder,
  disabled,
  children,
  className,
}: {
  /** Stable keys — RHF's `field.id`, never the array index. */
  ids: string[];
  onReorder: (from: number, to: number) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    // A small distance threshold so a click on a control inside a row is still a
    // click. Without it, every button press inside a sortable row starts a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    onReorder(from, to);
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * One draggable row. Renders through a child function so the caller keeps full
 * control of its markup and only has to place the handle.
 *
 * `isDragging` is passed back rather than styled here: a question row, an
 * option row, and an outline node need different lifted treatments, and baking
 * one in would mean three overrides.
 */
export function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (props: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
    handle: ReactNode;
    isDragging: boolean;
  }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lifted rows must clear their neighbours; everything else keeps the
    // document order so focus rings are not clipped by a stacking context.
    zIndex: isDragging ? 10 : undefined,
  };

  const handle = disabled ? null : (
    <button
      type="button"
      // `touch-none` is required, not cosmetic: without it the browser claims
      // the vertical pan gesture and a drag never starts on a phone.
      className={cn(
        "grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground",
        "outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
        "active:cursor-grabbing",
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-3.5" aria-hidden="true" />
    </button>
  );

  return <>{children({ setNodeRef, style, handle, isDragging })}</>;
}
