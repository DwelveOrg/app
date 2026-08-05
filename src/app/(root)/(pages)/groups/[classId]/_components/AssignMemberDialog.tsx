"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import Dialog from "@/app/(root)/_components/Dialog";

/** The only fields a picker row needs, whichever roster it fills. */
export type PickerPerson = {
  id: string;
  fullName: string;
  email: string;
  /** A second identifying line — a student code, a phone number. */
  hint?: string | null;
};

export type AssignMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  searchPlaceholder: string;
  addLabel: string;
  /** Shown when the search returned nothing; and when the whole list is empty. */
  noResultsLabel: string;
  emptyLabel: string;
  people: PickerPerson[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  /** Debounced search term, ready to send to the backend. */
  onSearchChange: (search: string) => void;
  onAdd: (person: PickerPerson) => void;
  /** Id of the row whose add request is in flight. */
  addingId?: string;
};

/**
 * The add-to-class picker, shared by the teacher and student rosters.
 *
 * Search and pagination are the backend's (`assignable-teachers` /
 * `assignable-students`), which is what lets a teacher use the student picker
 * at all: those endpoints are class-scoped, where the school-wide `GET /students`
 * is admin-only. This component is presentational — the caller owns the query
 * and the mutation, so neither list has to know about the other's endpoints.
 */
export default function AssignMemberDialog({
  open,
  onOpenChange,
  title,
  description,
  searchPlaceholder,
  addLabel,
  noResultsLabel,
  emptyLabel,
  people,
  isLoading,
  isError,
  hasMore,
  isFetchingMore,
  onLoadMore,
  onRetry,
  onSearchChange,
  onAdd,
  addingId,
}: Readonly<AssignMemberDialogProps>) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");

  // Debounced so typing a name is one request, not one per keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => onSearchChange(searchInput.trim()), 300);
    return () => window.clearTimeout(id);
  }, [onSearchChange, searchInput]);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setSearchInput("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={title}
      description={description}
      showClose
      closeLabel={t("root.enrollment.assign.close")}
      contentClassName="max-w-lg"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {isLoading ? (
          <div aria-busy="true" className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("root.enrollment.assign.errorDescription")}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t("root.classDetail.states.retry")}
            </Button>
          </div>
        ) : people.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {searchInput.trim() ? noResultsLabel : emptyLabel}
          </p>
        ) : (
          <>
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {people.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted"
                >
                  <Avatar name={person.fullName} size="sm" tint="seeded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {person.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.hint ? `${person.email} · ${person.hint}` : person.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={addingId === person.id}
                    onClick={() => onAdd(person)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {addLabel}
                  </Button>
                </li>
              ))}
            </ul>

            {hasMore ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                loading={isFetchingMore}
                onClick={onLoadMore}
              >
                {t("root.enrollment.loadMore")}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </Dialog>
  );
}

export { AssignMemberDialog };
