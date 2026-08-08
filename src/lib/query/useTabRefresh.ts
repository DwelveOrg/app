"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { type QueryKey, useQueryClient } from "@tanstack/react-query";

/**
 * What a tab needs re-read when the user opens it.
 *
 * Tabs in this product switch on local state: the query keys do not change and
 * nothing remounts, so without this a tab switch fires no request at all and the
 * panel shows whatever was fetched when the page first loaded. A join request
 * that arrived since then stayed invisible until a full reload — which is the
 * bug this exists to close.
 *
 * Both fields are needed because tabs are fed two different ways:
 * `queryKeys` covers panels backed by React Query, `router` covers panels
 * rendered from server props, which only a new RSC render can refresh.
 */
export type TabRefresh = {
  /**
   * Query keys to revalidate. These are matched as prefixes, so passing the
   * `*All` key from `queryKeys` refreshes every search/page variant under it.
   */
  queryKeys?: readonly QueryKey[];
  /** Re-run the server render, for tabs whose data arrives as RSC props. */
  router?: boolean;
};

/**
 * Returns a function that re-reads whatever backs the tab being opened.
 *
 * Invalidation covers both mounting orders: a query that already has a mounted
 * observer (tab counts, typically) refetches straight away, and one that does
 * not is marked stale so it fetches when the tab's panel mounts.
 */
export function useTabRefresh() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(
    (refresh: TabRefresh | undefined) => {
      if (!refresh) return;

      for (const queryKey of refresh.queryKeys ?? []) {
        void queryClient.invalidateQueries({ queryKey });
      }

      if (refresh.router) router.refresh();
    },
    [queryClient, router],
  );
}
