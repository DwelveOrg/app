/**
 * How often a surface re-reads itself while someone is looking at it.
 *
 * ## Why polling exists at all
 *
 * `useServerDataRefresh` fixes the data *you* changed. It cannot fix the data
 * **someone else** changed: a student files a join request and nothing has told
 * the admin's already-open browser that anything happened, so the queue they
 * are staring at stays empty until they reload. Polling is what closes that,
 * and it is deliberately preferred here over a pushed event stream — the
 * browser has no direct line to the backend (the session is an httpOnly cookie
 * read on the Next server), so SSE would need either a new token surface or a
 * serverless function pinned open per tab. Neither is worth it for a queue
 * measured in requests per hour.
 *
 * ## Reading the intervals
 *
 * These are the delay a user tolerates before the number in front of them is
 * wrong, not a performance budget. A queue someone is actively working sits at
 * 30s; an ambient badge in the shell sits at a minute, because it is mounted on
 * every page in the product and a wrong-by-30-seconds unread count costs
 * nothing.
 *
 * Every polled query pairs its interval with `refetchOnWindowFocus`. React
 * Query pauses interval timers on a blurred tab (`refetchIntervalInBackground`
 * is off by default, and should stay off — a background tab polling for an
 * admin who went to lunch is pure waste). Without the focus refetch, coming
 * back to that tab would show whatever was true when they left it until the
 * next tick fired. The two options are one mechanism and belong together, which
 * is why `pollingOptions` returns both rather than exporting the numbers alone.
 */

/** A queue the viewer is actively working. */
export const POLL_ACTIVE_MS = 30_000;

/** Ambient state in the shell, mounted on every page. */
export const POLL_AMBIENT_MS = 60_000;

/**
 * The options a polled query spreads in.
 *
 * Note for infinite queries: a tick refetches *every loaded page*, not just the
 * first. That is the right behaviour for a queue whose middle can change, and
 * it is affordable because these queues are one page of twenty in practice — a
 * viewer who has paged deep into a backlog pays one request per loaded page per
 * tick, which is the cost of having asked to see all of it.
 */
export function pollingOptions(intervalMs: number) {
  return {
    refetchInterval: intervalMs,
    // The global default is `false`, which is right for one-shot reads and
    // wrong for anything that polls — see the note above.
    refetchOnWindowFocus: true,
  } as const;
}
