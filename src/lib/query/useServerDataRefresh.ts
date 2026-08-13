"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { type QueryKey, useQueryClient } from "@tanstack/react-query";

/**
 * Re-reads everything a write touched — both halves of it.
 *
 * ## The bug this exists to close
 *
 * Data in this product arrives two ways. Panels backed by React Query hold a
 * client cache; pages, headers, rosters, fact grids and counts are rendered on
 * the server and arrive as RSC props. A mutation almost always moves both:
 * approving a join request clears a row from a React Query list *and* adds a
 * student to the server-rendered roster three inches above it, and shifts the
 * counts in the page header above that.
 *
 * Invalidating the query cache alone fixes the list and leaves the rest showing
 * the old numbers, which reads as a failed approval. The fix was known — pair
 * the invalidation with `router.refresh()` — but it lived at the *call sites*,
 * as an `onReviewed` / `onRosterChange` callback each component had to remember
 * to pass. Some did. `StudentClassCard` and `MyClassRequestsView` did not, so a
 * student requesting to join a class watched nothing change until they reloaded
 * the page by hand.
 *
 * Putting both halves behind one call moves the rule from "remember this at
 * every call site" to "you cannot invalidate without also refreshing", which is
 * the only version of it that stays true as call sites are added.
 *
 * ## What it does not solve
 *
 * Someone *else's* write. A student filing a request does not update the admin's
 * already-open screen — nothing has told that browser anything happened. That
 * needs polling or a server-pushed event, and is a separate decision from this
 * one; this hook is about the person who clicked.
 */
export function useServerDataRefresh() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(
    /**
     * @param queryKeys Prefixes to invalidate. Passing an `*All` key from
     *   `queryKeys` covers every search/page variant beneath it.
     */
    (...queryKeys: readonly QueryKey[]) => {
      // `router.refresh()` is fired first and not awaited: it re-renders the
      // server tree in the background while the query refetches run, so the two
      // halves land together rather than one after the other.
      router.refresh();

      return Promise.all(
        queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
    [queryClient, router],
  );
}
