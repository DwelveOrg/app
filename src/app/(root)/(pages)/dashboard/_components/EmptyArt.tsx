import { cn } from "@/lib/utils";

/**
 * Illustrations for dashboard empty states.
 *
 * A 40px icon over two lines of text left a large hollow in any card that
 * shared a row with a populated one. These fill that space with something
 * worth looking at, and — more usefully — each one previews the shape of the
 * data that will eventually replace it, so an empty panel still communicates
 * what it is for.
 *
 * Inline SVG rather than image files: they inherit `currentColor` and the
 * chart tokens, so they follow the theme in light and dark without shipping
 * two assets. Every drawing is decorative; the adjacent heading carries the
 * meaning, so they are `aria-hidden`.
 */

type ArtProps = { className?: string };

/*
   80px, not 112px.

   These drawings preview the shape of the data a panel will hold, which is
   worth doing at a glance and not worth doing at scale. At `h-28` an empty
   panel stood ~230px tall, and because panels stretch to their row, one empty
   panel set the height for every populated panel beside it — a single activity
   row was being centred in a quarter of a screen. The illustration still reads
   perfectly at this size; the row no longer costs what a chart costs.
*/
const wrap = "h-20 w-full max-w-[13rem] shrink-0";

/** A trend line finding its way — for score/performance panels. */
export function TrendArt({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 240 112"
      fill="none"
      aria-hidden="true"
      className={cn(wrap, className)}
    >
      <defs>
        <linearGradient id="dw-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[24, 48, 72, 96].map((y) => (
        <line
          key={y}
          x1="8"
          y1={y}
          x2="232"
          y2={y}
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeDasharray="3 5"
        />
      ))}
      <path
        d="M8 88 L56 72 L104 78 L152 46 L200 34 L232 26"
        stroke="var(--chart-1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 6"
        strokeOpacity="0.85"
      />
      <path d="M8 88 L56 72 L104 78 L152 46 L200 34 L232 26 V104 H8 Z" fill="url(#dw-trend-fill)" />
      {[
        [56, 72],
        [152, 46],
        [232, 26],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="3.5" fill="var(--chart-1)" fillOpacity="0.5" />
      ))}
    </svg>
  );
}

/** A calendar with one soft highlight — for upcoming / due work. */
export function CalendarArt({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 240 112"
      fill="none"
      aria-hidden="true"
      className={cn(wrap, className)}
    >
      <rect
        x="62"
        y="16"
        width="116"
        height="84"
        rx="12"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      <path d="M62 40 H178" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <rect x="86" y="8" width="6" height="16" rx="3" fill="currentColor" fillOpacity="0.3" />
      <rect x="148" y="8" width="6" height="16" rx="3" fill="currentColor" fillOpacity="0.3" />
      {[0, 1, 2, 3].map((col) =>
        [0, 1, 2].map((row) => {
          const x = 78 + col * 26;
          const y = 52 + row * 16;
          const lit = col === 2 && row === 1;
          return (
            <rect
              key={`${col}-${row}`}
              x={x}
              y={y}
              width="14"
              height="8"
              rx="4"
              fill={lit ? "var(--chart-1)" : "currentColor"}
              fillOpacity={lit ? 0.55 : 0.12}
            />
          );
        }),
      )}
    </svg>
  );
}

/** Stacked cards — for lists, rosters, classes. */
export function ListArt({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 240 112"
      fill="none"
      aria-hidden="true"
      className={cn(wrap, className)}
    >
      {[0, 1, 2].map((i) => (
        <g key={i} opacity={1 - i * 0.28}>
          <rect
            x={44 + i * 6}
            y={18 + i * 28}
            width={152 - i * 12}
            height="22"
            rx="11"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="2"
          />
          <circle
            cx={60 + i * 6}
            cy={29 + i * 28}
            r="5"
            fill="var(--chart-1)"
            fillOpacity={0.5 - i * 0.12}
          />
          <rect
            x={74 + i * 6}
            y={25 + i * 28}
            width={64 - i * 10}
            height="8"
            rx="4"
            fill="currentColor"
            fillOpacity="0.14"
          />
        </g>
      ))}
    </svg>
  );
}

/** A quiet bell — for activity and notification feeds. */
export function BellArt({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 240 112"
      fill="none"
      aria-hidden="true"
      className={cn(wrap, className)}
    >
      <circle cx="120" cy="56" r="40" fill="currentColor" fillOpacity="0.05" />
      <path
        d="M120 26a20 20 0 0 0-20 20v14l-7 11h54l-7-11V46a20 20 0 0 0-20-20Z"
        stroke="currentColor"
        strokeOpacity="0.24"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M110 77a10 10 0 0 0 20 0"
        stroke="currentColor"
        strokeOpacity="0.24"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="146" cy="34" r="6" fill="var(--chart-1)" fillOpacity="0.45" />
    </svg>
  );
}

/** A donut with nothing in it yet — for distributions. */
export function DonutArt({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 240 112"
      fill="none"
      aria-hidden="true"
      className={cn(wrap, className)}
    >
      <circle
        cx="120"
        cy="56"
        r="34"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="16"
      />
      <circle
        cx="120"
        cy="56"
        r="34"
        stroke="var(--chart-1)"
        strokeOpacity="0.4"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray="34 180"
        transform="rotate(-90 120 56)"
      />
    </svg>
  );
}

/** A checklist with one tick — for setup and "all clear" states. */
export function CheckArt({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 240 112"
      fill="none"
      aria-hidden="true"
      className={cn(wrap, className)}
    >
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x="66"
            y={20 + i * 28}
            width="20"
            height="20"
            rx="6"
            stroke="currentColor"
            strokeOpacity={i === 0 ? 0 : 0.2}
            strokeWidth="2"
            fill={i === 0 ? "var(--success)" : "transparent"}
            fillOpacity={i === 0 ? 0.85 : 0}
          />
          {i === 0 ? (
            <path
              d="M71 30l4 4 7-8"
              stroke="var(--success-foreground)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          <rect
            x="98"
            y={26 + i * 28}
            width={76 - i * 14}
            height="8"
            rx="4"
            fill="currentColor"
            fillOpacity="0.14"
          />
        </g>
      ))}
    </svg>
  );
}

export const EMPTY_ART = {
  trend: TrendArt,
  calendar: CalendarArt,
  list: ListArt,
  bell: BellArt,
  donut: DonutArt,
  check: CheckArt,
} as const;

export type EmptyArtKind = keyof typeof EMPTY_ART;
