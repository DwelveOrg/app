# pdf.js Viewport Scale Is Points, Not Pixels

## Context

The importer renders selected pages to JPEG when a slice is too heavy to
upload, at a resolution solved from a probe page. A guard was written to stop
a small page being blown up:

```ts
const scale = Math.min(1.5, maxEdge / Math.max(base.width, base.height));
```

It reads as prudent — "never render larger than 1:1" — and it is wrong.

## Knowledge

`page.getViewport({ scale: 1 })` returns the page in **points** (72 per inch),
not pixels. A4 is 595×842, so scale 1.0 renders at roughly 72 DPI, well below
useful, and an embedded 300 DPI scan is thrown away to reach it. A PDF page has
no native pixel resolution for "1:1" to mean anything against.

Clamping the scale therefore pinned every standard page at about 108 DPI
regardless of the requested `maxEdge`, and that silently broke the byte solver,
which assumes output bytes track `maxEdge` squared. With the scale pinned,
asking for a smaller edge changed almost nothing: the same 28-page scan was
refused at 12 pages and accepted at 25.

The correct form makes the rendered long edge exactly `maxEdge`:

```ts
const scale = maxEdge / Math.max(base.width, base.height);
```

Both canvas dimensions then stay at or below `maxEdge`, so no separate pixel
guard is needed.

## Relevant Files

- `src/app/studio/tests/import/_lib/pdf.ts`

## Implications

Found only by driving the real module in a headless browser. Node has no canvas
and no JPEG encoder, so no unit test could have reached it — anything in this
file that touches rendering has to be exercised in a browser before it is
believed.
