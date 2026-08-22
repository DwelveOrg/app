/**
 * `<input type="datetime-local">` speaks local wall-clock time with no zone;
 * the backend speaks ISO-8601 UTC. These two functions are the only place the
 * conversion happens, because doing it inline is how a test ends up opening at
 * the right hour in one dialog and five hours off in another.
 */

/** `2026-08-02T09:30:00.000Z` -> `2026-08-02T09:30`, what the input expects. */
export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
}

/** The inverse. An empty or unparseable value means "not set", never `Invalid Date`. */
export function toIsoOrNull(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** A human-readable date-time in the viewer's locale, or a dash when unset. */
export function formatDateTime(
  iso: string | null | undefined,
  locale?: string,
): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
