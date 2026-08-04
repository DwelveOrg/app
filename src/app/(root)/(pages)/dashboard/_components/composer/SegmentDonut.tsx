"use client";

export type DonutSegment = {
  label: string;
  value: number;
  /** A CSS color, typically a chart token e.g. "var(--chart-1)". */
  color: string;
};

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Generic donut for categorical breakdowns (grade distribution, members by
 * role). Colors are passed in from the validated chart-token order (violet →
 * green → blue → amber — never violet next to blue) and identity is carried by
 * the legend, never color alone.
 */
export default function SegmentDonut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerValue?: string | number;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  let cursor = 0;
  const arcs = segments.map((segment) => {
    const length = total > 0 ? (segment.value / total) * CIRCUMFERENCE : 0;
    // A 2px gap between arcs reads them as separate segments.
    const visible = Math.max(length - 2, 0);
    const arc = {
      color: segment.color,
      dashArray: `${visible} ${CIRCUMFERENCE - visible}`,
      dashOffset: -cursor,
    };
    cursor += length;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 100 100"
        width="100"
        height="100"
        className="shrink-0"
        role="img"
        aria-label={centerLabel}
      >
        <g transform="rotate(-90 50 50)" fill="none" strokeWidth="15">
          {total > 0 ? (
            arcs.map((arc, index) => (
              <circle
                key={index}
                cx="50"
                cy="50"
                r={RADIUS}
                stroke={arc.color}
                strokeDasharray={arc.dashArray}
                strokeDashoffset={arc.dashOffset}
              />
            ))
          ) : (
            <circle cx="50" cy="50" r={RADIUS} stroke="var(--muted)" />
          )}
        </g>
        {centerValue != null ? (
          <text
            x="50"
            y="49"
            textAnchor="middle"
            fontSize="15"
            fontWeight="800"
            fill="var(--foreground)"
          >
            {centerValue}
          </text>
        ) : null}
        {centerLabel ? (
          <text
            x="50"
            y="61"
            textAnchor="middle"
            fontSize="8"
            fill="var(--muted-foreground)"
          >
            {centerLabel}
          </text>
        ) : null}
      </svg>

      <ul className="flex flex-col gap-2">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: segment.color }}
            />
            <span className="text-foreground">{segment.label}</span>
            <span className="tabular-nums">· {segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
