"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The countdown, run against the server's clock rather than the device's.
 *
 * ## Why skew correction is not optional
 *
 * `expiresAt` is an absolute instant chosen by the server. A browser comparing
 * it to `Date.now()` is comparing two clocks, and device clocks are wrong all
 * the time — a laptop resuming from sleep, a phone with the timezone set by
 * hand, a machine whose NTP sync failed. A student whose clock is ten minutes
 * fast would watch their exam end ten minutes early; one whose clock is ten
 * minutes slow would keep answering into a window the server has already shut,
 * and lose the lot.
 *
 * So the attempt response carries `serverTime`, the offset is measured once,
 * and every tick reads a corrected clock. The correction is captured at load
 * and never re-measured: re-measuring from a later response would let a slow
 * request look like time travel, and the drift over one exam is milliseconds.
 *
 * The server still enforces expiry (`§B.5` of the backend contract). This is
 * the display, and the auto-submit here is a courtesy that saves the student's
 * work — not the rule.
 */
export type AttemptClock = {
  /** Seconds left, floored at zero. `null` for an untimed paper. */
  remaining: number | null;
  /** Past the warning threshold the delivery configured. */
  warning: boolean;
  /** The clock has reached zero. Fires once, then stays true. */
  expired: boolean;
  /** Server-corrected wall clock, for stamping a violation. */
  now: () => Date;
};

export function useAttemptClock({
  expiresAt,
  serverTime,
  warnAtMinutes,
  onExpire,
}: {
  expiresAt: string | null;
  /** The server's clock when it produced this attempt. */
  serverTime: string;
  warnAtMinutes: number | null;
  onExpire?: () => void;
}): AttemptClock {
  /**
   * How far this device's clock is from the server's, in milliseconds, measured
   * once at mount.
   *
   * A lazy `useState` initializer rather than a ref written during render: the
   * value has to be captured before the first paint (the countdown's initial
   * value depends on it) and it must never change afterwards. Re-measuring from
   * a later response would let a slow request look like time travel, and the
   * real drift over one exam is milliseconds.
   */
  const [skew] = useState(() => new Date(serverTime).getTime() - Date.now());

  const deadline = useMemo(
    () => (expiresAt ? new Date(expiresAt).getTime() : null),
    [expiresAt],
  );

  const [remaining, setRemaining] = useState<number | null>(() =>
    deadline === null
      ? null
      : Math.max(0, Math.round((deadline - (Date.now() + skew)) / 1000)),
  );

  /**
   * Held in a ref so the interval can be set up once. A callback in the
   * dependency array would tear down and rebuild the timer on every render of
   * the runtime, which is every keystroke in an essay.
   */
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (deadline === null) return;

    let fired = false;

    const tick = () => {
      const left = Math.max(0, Math.round((deadline - (Date.now() + skew)) / 1000));
      setRemaining(left);

      if (left === 0 && !fired) {
        fired = true;
        onExpireRef.current?.();
      }
    };

    tick();
    /*
     * One second, and re-read from the deadline every time rather than
     * decrementing a counter. A tab that is backgrounded has its timers
     * throttled to once a minute or stopped outright, so a counter would come
     * back minutes behind — showing a student time they no longer have.
     */
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [deadline, skew]);

  const warnAt = warnAtMinutes != null ? warnAtMinutes * 60 : null;

  return {
    remaining,
    warning: remaining !== null && warnAt !== null && remaining <= warnAt && remaining > 0,
    expired: remaining === 0,
    now: () => new Date(Date.now() + skew),
  };
}

/** `1:04:09` for an hour or more, `24:09` below it. */
export function formatRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${minutes}:${pad(secs)}`;
}
