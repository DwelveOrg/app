"use client";

/**
 * The stat-tile sparkline: the recent run of a measure, drawn quiet.
 *
 * The line sits in the de-emphasis gray — it is context, not the headline —
 * and only the current period gets the accent: the last segment and its end
 * dot in the series hue. Decorative sparklines are banned; this one renders
 * only when it has real points to plot, and the tile's delta text states the
 * same movement for anyone who cannot read a 20px line.
 */
export default function Sparkline({
  values,
  width = 64,
  height = 20,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 3) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 3;
  const step = (width - pad * 2) / (values.length - 1);
  const pointAt = (index: number): [number, number] => [
    pad + index * step,
    pad + (height - pad * 2) * (1 - (values[index] - min) / span),
  ];
  const points = values.map((_, index) => pointAt(index));
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];
  const [prevX, prevY] = points[points.length - 2];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      className="shrink-0"
    >
      <path
        d={path}
        fill="none"
        stroke="var(--muted-foreground)"
        strokeOpacity={0.45}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M${prevX} ${prevY} L${lastX} ${lastY}`}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={3} fill="var(--card)" />
      <circle cx={lastX} cy={lastY} r={2} fill="var(--chart-1)" />
    </svg>
  );
}
