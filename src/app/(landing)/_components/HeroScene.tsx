"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";

/**
 * Hero centrepiece: one answer sheet, being marked.
 *
 * The scene is a single object rather than a diagram. A test paper floats in
 * three-quarter view; a row at a time, the student's chosen bubble fills and a
 * tick lands in the right margin; when the last row is marked a score ring
 * closes beside the page and the result pops. That is the whole product claim —
 * *a test comes back graded* — said once, in one gesture, in about seven
 * seconds, and then said again.
 *
 * Why one object and not five: the previous scene was an exploded five-deck
 * diagram of the pipeline (material → draft → approval → class → analytics). It
 * described the system accurately and read as an infographic — five things to
 * parse before the sentence lands. A hero gets one beat.
 *
 * How it is built:
 *   - The page *face* is a canvas texture: title, rules, question bars and empty
 *     bubbles are painted once, because none of them move. Only the things that
 *     animate are real geometry (the filled bubbles, the ticks, the ring), so a
 *     frame costs transforms and nothing else — no texture re-uploads, ever.
 *   - `SHEET` is the single source of truth for layout, in the page's own 0–1
 *     UV space. The canvas painter and the mesh placer both read it, so a bubble
 *     drawn on the paper and the disc that fills it cannot drift apart.
 *   - The ring is 56 short torus arcs sharing one geometry and one material,
 *     revealed by `visible`. Animating a real arc means rebuilding geometry every
 *     frame, and painting it to a canvas means a texture upload every frame;
 *     both are per-frame GPU churn on hardware that is often a school laptop.
 *     Fifty-six steps over a fifth of a second reads as a sweep, not as steps.
 *
 * Interaction is fenced, deliberately:
 *   - While the pointer is inside the hero box, the page leans toward it (hard
 *     clamped) and lifts slightly. The box edge is the border: crossing it fades
 *     all influence to zero across a small feather band, so moving the cursor
 *     down the page simply lets the sheet settle.
 *   - A click restarts the marking pass, because that is the thing worth seeing
 *     twice.
 *   - Off-screen or in a hidden tab, the loop stops. Under reduced motion it
 *     paints a single settled frame — marked, ringed, scored — and never runs.
 *
 * Raw three.js (no R3F) so it stays one lazy chunk, mounted through
 * `next/dynamic({ ssr: false })` so it never blocks first paint. The canvas is
 * transparent; the CSS bloom behind it (`.hero-bloom`, set up in `MainPage`)
 * gives depth and is the graceful fallback when WebGL is unavailable.
 */

/* ============================================================================
   Palette

   Literals rather than `getComputedStyle` reads: three.js wants numeric colours
   at construction time, and the CSS variables are hex strings that would need
   parsing on every material. These mirror the `--brand-*` ramp and the surface
   tokens in globals.css — keep them in step with it.

   The two themes are different objects, not one object at two brightnesses. In
   light the page is white paper under near-black ink; in dark it is a raised
   card on a near-black canvas, and the ink turns luminous rather than staying
   black on a dark surface.
   ========================================================================= */

type ScenePalette = {
  /** Paper face. */
  SHEET: number;
  /** The band at the head of the page. */
  BAND: number;
  /** Rules, bubble outlines, question bars. */
  LINE: string;
  /** Painted title ink. */
  INK: string;
  /** Painted secondary ink. */
  INK_MUTED: string;
  /** Brand violet — filled bubbles, the ring, the accent rule. */
  VIOLET: number;
  VIOLET_CSS: string;
  /** The lighter violet used for glow and the ring's leading head. */
  VIOLET_LIGHT: number;
  /** Marks. */
  SUCCESS: number;
  /** Text on a violet plaque, and the free-standing score numeral. */
  PLAQUE_TEXT: string;
  SCORE_TEXT: string;
  /** Ambient motes. */
  MOTE: number;
  /** Light rig. */
  AMBIENT: number;
  KEY: number;
};

const PALETTES: Record<"light" | "dark", ScenePalette> = {
  light: {
    SHEET: 0xffffff, // --card
    BAND: 0xf3f1ff,
    LINE: "#DCD9EA",
    INK: "#15151B", // --foreground
    INK_MUTED: "#8C8A99",
    VIOLET: 0x5f40d5, // --brand / --primary
    VIOLET_CSS: "#5F40D5",
    VIOLET_LIGHT: 0x8163ff, // --brand-gradient from
    SUCCESS: 0x25793a, // --success
    PLAQUE_TEXT: "#FFFFFF",
    SCORE_TEXT: "#15151B",
    MOTE: 0x8163ff,
    AMBIENT: 0xffffff,
    KEY: 0xffffff,
  },
  dark: {
    SHEET: 0x1d1b28,
    BAND: 0x272338,
    LINE: "#3A3650",
    INK: "#EEEDF2", // --foreground
    INK_MUTED: "#8B8899",
    VIOLET: 0xa191ff, // --brand / --primary
    VIOLET_CSS: "#A191FF",
    VIOLET_LIGHT: 0xc9bcff, // --brand-violet-300
    SUCCESS: 0x5fcb63, // --success
    PLAQUE_TEXT: "#15102F",
    SCORE_TEXT: "#EEEDF2",
    MOTE: 0xc9bcff,
    AMBIENT: 0xdad6ff,
    KEY: 0xffffff,
  },
};

/* ============================================================================
   Page layout, in the sheet's own 0–1 UV space.

   Both the canvas painter and the mesh placer read this, which is the point:
   the empty bubble is painted from `BUBBLE_U` and the disc that fills it is
   positioned from the same array, so they cannot come apart.
   ========================================================================= */

const SHEET = {
  /** World size. A4-ish, because a test paper that is not A4-ish is a card. */
  W: 3.0,
  H: 4.24,
  THICK: 0.055,

  MARGIN_L: 0.095,
  MARGIN_R: 0.905,

  TITLE_V: 0.083,
  SUBTITLE_V: 0.128,
  RULE_V: 0.168,

  ROWS: 6,
  ROW_TOP: 0.268,
  ROW_STEP: 0.1135,

  /** Offsets from a row's centre line. */
  BAR_DV: -0.035,
  BUBBLE_DV: 0.023,
  TICK_DV: -0.006,

  BUBBLE_U: [0.115, 0.243, 0.371, 0.499] as const,
  /** Radius of an answer bubble, in world units. */
  BUBBLE_R: 0.062,
  TICK_U: 0.815,
  /** Which bubble each row's student picked, and the width of its question bar. */
  PICKED: [1, 3, 0, 2, 1, 3] as const,
  BAR_W: [0.46, 0.38, 0.52, 0.43, 0.49, 0.35] as const,
} as const;

const rowV = (i: number) => SHEET.ROW_TOP + i * SHEET.ROW_STEP;
/** UV → sheet-local world coordinates. The sheet's own origin is its centre. */
const ux = (u: number) => (u - 0.5) * SHEET.W;
const vy = (v: number) => (0.5 - v) * SHEET.H;

/* ============================================================================
   Timeline

   One pass, as fractions of `CYCLE`. Written as named marks rather than magic
   numbers scattered through the frame function, because the only way to retime
   the scene is to see the whole schedule at once.
   ========================================================================= */

const CYCLE = 7.2; // seconds
const T = {
  /** First row is marked here; each subsequent row follows by ROW_GAP. */
  MARK_FROM: 0.07,
  ROW_GAP: 0.062,
  /** How long one row takes to fill its bubble, and the tick's lag behind it. */
  ROW_FILL: 0.05,
  TICK_LAG: 0.03,
  RING_FROM: 0.5,
  RING_TO: 0.7,
  SCORE_AT: 0.695,
  PILL_AT: 0.735,
  /** Everything clears from here to the end of the cycle, then it runs again. */
  CLEAR_FROM: 0.9,
} as const;
/** The frame a reduced-motion visitor gets: marked, ringed, scored, at rest. */
const SETTLED = 0.84;
const SCORE = 92;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOutCubic = (n: number) => 1 - Math.pow(1 - n, 3);
const easeOutBack = (n: number) => {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(n - 1, 3) + c * Math.pow(n - 1, 2);
};

export type HeroLabels = {
  /** Printed at the head of the page. */
  quiz?: string;
  /** The pill that pops once the ring closes. */
  graded?: string;
};

/* ============================================================================
   Canvas helpers
   ========================================================================= */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

const hex = (n: number) => `#${n.toString(16).padStart(6, "0")}`;

/**
 * Paints the page face: everything on the paper that never moves.
 *
 * Runs once per theme (and once per language, for the title). The animated
 * marks are geometry, not paint — see the module comment.
 */
function paintSheet(P: ScenePalette, title: string, fontFamily: string): HTMLCanvasElement {
  const W = 1024;
  const H = Math.round(W * (SHEET.H / SHEET.W));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const X = (u: number) => u * W;
  const Y = (v: number) => v * H;

  // Paper, then the tinted band the title sits in.
  ctx.fillStyle = hex(P.SHEET);
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = hex(P.BAND);
  ctx.fillRect(0, 0, W, Y(SHEET.RULE_V));

  // Brand rule closing the band — the page's one piece of identity.
  ctx.fillStyle = P.VIOLET_CSS;
  ctx.fillRect(0, Y(SHEET.RULE_V) - 5, W, 5);

  ctx.textBaseline = "alphabetic";
  if (title) {
    ctx.fillStyle = P.INK;
    ctx.font = `700 52px ${fontFamily}`;
    ctx.fillText(title, X(SHEET.MARGIN_L), Y(SHEET.TITLE_V));
  }
  // Numerals only: this line renders identically in en / ru / uz, so it needs no
  // catalog entry and cannot overflow when a translation runs long.
  ctx.fillStyle = P.INK_MUTED;
  ctx.font = `600 30px ${fontFamily}`;
  ctx.fillText(`${SHEET.ROWS} / ${SHEET.ROWS}`, X(SHEET.MARGIN_L), Y(SHEET.SUBTITLE_V));

  // Question rows: a bar standing in for the question, then its four bubbles.
  const bubblePx = (SHEET.BUBBLE_R / SHEET.W) * W;
  for (let i = 0; i < SHEET.ROWS; i++) {
    const v = rowV(i);

    ctx.fillStyle = P.LINE;
    roundRect(ctx, X(SHEET.MARGIN_L), Y(v + SHEET.BAR_DV) - 9, X(SHEET.BAR_W[i]), 18, 9);
    ctx.fill();

    ctx.strokeStyle = P.LINE;
    ctx.lineWidth = 4;
    for (const u of SHEET.BUBBLE_U) {
      ctx.beginPath();
      ctx.arc(X(u), Y(v + SHEET.BUBBLE_DV), bubblePx, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hairline under every row but the last — ruling, not a table.
    if (i < SHEET.ROWS - 1) {
      ctx.fillStyle = P.LINE;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(
        X(SHEET.MARGIN_L),
        Y(v + SHEET.ROW_STEP / 2),
        X(SHEET.MARGIN_R - SHEET.MARGIN_L),
        2,
      );
      ctx.globalAlpha = 1;
    }
  }

  return canvas;
}

/** A label plaque painted to a canvas — the score numeral and the graded pill. */
function paintPlaque(
  text: string,
  opts: { font: string; color: string; background: string | null },
): { canvas: HTMLCanvasElement; aspect: number } | null {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return null;
  measure.font = opts.font;
  const fontPx = parseInt(opts.font.match(/(\d+)px/)?.[1] ?? "48", 10);
  const padX = Math.round(fontPx * (opts.background ? 0.62 : 0.2));
  const padY = Math.round(fontPx * (opts.background ? 0.34 : 0.14));
  const w = Math.ceil(measure.measureText(text).width) + padX * 2;
  const h = Math.round(fontPx * 1.2) + padY * 2;

  const dpr = 2; // supersampled: these render small on screen and must stay crisp
  const canvas = document.createElement("canvas");
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  if (opts.background) {
    roundRect(ctx, 1.5, 1.5, w - 3, h - 3, h / 2);
    ctx.fillStyle = opts.background;
    ctx.fill();
  }

  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 1);

  return { canvas, aspect: w / h };
}

/**
 * A checkmark, as a filled polygon.
 *
 * Two crossed boxes would be cheaper and would show their seam at the elbow; a
 * stroked line cannot be extruded. The points below are the outline of a
 * constant-width stroke through (0, .38) → (.26, .10) → (.76, .80), walked down
 * the outer edge and back up the inner one.
 */
function tickShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.051, 0.332);
  s.lineTo(0.28, 0.0);
  s.lineTo(0.817, 0.759);
  s.lineTo(0.703, 0.841);
  s.lineTo(0.22, 0.26);
  s.lineTo(0.051, 0.428);
  s.closePath();
  return s;
}

/* ========================================================================= */

export default function HeroScene({
  className,
  labels,
}: {
  className?: string;
  labels?: HeroLabels;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Primitive deps, not the object, so the scene only rebuilds when the text
  // actually changes — a language switch — and not on every parent re-render.
  const quizLabel = labels?.quiz ?? "";
  const gradedLabel = labels?.graded ?? "";

  // `resolvedTheme` collapses "system" to a concrete theme. It is undefined
  // until the provider hydrates; the scene is client-only anyway, and treating
  // that first frame as light matches the CSS bloom sitting behind the canvas.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const P = PALETTES[isDark ? "dark" : "light"];
    const title = quizLabel;
    const pillText = gradedLabel;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // No WebGL — the CSS bloom behind the canvas stays visible.
    }

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // updateStyle=false: never let three.js write inline px onto the canvas. The
    // CSS below keeps it locked to the container, so it cannot overflow the
    // viewport when the layout shrinks (the buffer still resizes for crispness).
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(P.AMBIENT, isDark ? 1.15 : 0.95));
    const key = new THREE.DirectionalLight(P.KEY, isDark ? 1.05 : 1.5);
    key.position.set(2.5, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(P.VIOLET_LIGHT, isDark ? 26 : 14, 40);
    rim.position.set(-4.5, -2, 4);
    scene.add(rim);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const fontFamily =
      (typeof document !== "undefined" && getComputedStyle(document.body).fontFamily) ||
      "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

    /** Everything the scene owns and must release on unmount. */
    const disposables: { dispose(): void }[] = [];
    const track = <O extends { dispose(): void }>(o: O) => {
      disposables.push(o);
      return o;
    };

    const root = new THREE.Group();
    scene.add(root);

    /* --- The page ---------------------------------------------------------- */

    const SHEET_Y = 0.5;
    const sheetGroup = new THREE.Group();
    sheetGroup.position.set(-0.45, SHEET_Y, 0);
    root.add(sheetGroup);

    const faceTexture = track(new THREE.CanvasTexture(paintSheet(P, title, fontFamily)));
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    faceTexture.anisotropy = maxAnisotropy;

    const edgeMat = track(
      new THREE.MeshStandardMaterial({ color: P.BAND, roughness: 0.92, metalness: 0 }),
    );
    const faceMat = track(
      new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.86, metalness: 0 }),
    );
    // BoxGeometry material order is [+X, −X, +Y, −Y, +Z, −Z]; only the front face
    // is printed. The other five give the page a real edge, which is the whole
    // reason this is a box and not a plane.
    const sheetMesh = new THREE.Mesh(
      track(new THREE.BoxGeometry(SHEET.W, SHEET.H, SHEET.THICK)),
      [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, edgeMat],
    );
    sheetGroup.add(sheetMesh);

    /* --- Marks: a filled bubble and a tick per row -------------------------- */

    const FRONT = SHEET.THICK / 2 + 0.012; // proud of the paper, never z-fighting
    const TICK_SCALE = 0.24;

    const bubbleGeo = track(new THREE.CircleGeometry(SHEET.BUBBLE_R * 0.8, 28));
    const tickGeo = track(
      new THREE.ExtrudeGeometry(tickShape(), {
        depth: 0.035,
        bevelEnabled: false,
        curveSegments: 2,
      }),
    );
    tickGeo.center();

    const marks: { bubble: THREE.Mesh; tick: THREE.Mesh }[] = [];

    for (let i = 0; i < SHEET.ROWS; i++) {
      const v = rowV(i);

      const bubbleMat = track(
        new THREE.MeshStandardMaterial({
          color: P.VIOLET,
          emissive: P.VIOLET,
          emissiveIntensity: 0.5,
          roughness: 0.42,
          metalness: 0,
        }),
      );
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(ux(SHEET.BUBBLE_U[SHEET.PICKED[i]]), vy(v + SHEET.BUBBLE_DV), FRONT);
      sheetGroup.add(bubble);

      const tickMat = track(
        new THREE.MeshStandardMaterial({
          color: P.SUCCESS,
          emissive: P.SUCCESS,
          emissiveIntensity: 0.35,
          roughness: 0.4,
          metalness: 0,
        }),
      );
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(ux(SHEET.TICK_U), vy(v + SHEET.TICK_DV), FRONT + 0.02);
      tick.scale.setScalar(TICK_SCALE);
      sheetGroup.add(tick);

      marks.push({ bubble, tick });
    }

    /* --- The score ring ----------------------------------------------------
       Kept out of `sheetGroup` on purpose: the page tilts and leans, and a score
       you have to read at an angle is a score you squint at. This stays square
       to the camera and floats beside the page's lower corner. */

    const RING_X = 1.16;
    const RING_Y = -1.42;
    const RING_R = 0.66;
    const RING_SEGMENTS = 56;

    const ringGroup = new THREE.Group();
    ringGroup.position.set(RING_X, RING_Y, 0.85);
    root.add(ringGroup);

    const step = (Math.PI * 2) / RING_SEGMENTS;
    // 1.08 of a step per arc: neighbours overlap slightly, so the ring reads as
    // one stroke instead of fifty-six tiles.
    const segGeo = track(new THREE.TorusGeometry(RING_R, 0.05, 8, 4, step * 1.08));
    const segMat = track(
      new THREE.MeshStandardMaterial({
        color: P.VIOLET,
        emissive: P.VIOLET,
        emissiveIntensity: 0.75,
        roughness: 0.35,
        metalness: 0,
      }),
    );
    const segments: THREE.Mesh[] = [];
    for (let i = 0; i < RING_SEGMENTS; i++) {
      const seg = new THREE.Mesh(segGeo, segMat);
      // Start at twelve o'clock and sweep clockwise, the way a gauge fills.
      seg.rotation.z = Math.PI / 2 - i * step;
      seg.visible = false;
      ringGroup.add(seg);
      segments.push(seg);
    }

    // The bright point riding the leading edge — what makes the sweep read as
    // drawn rather than as segments switching on.
    const headMat = track(
      new THREE.MeshBasicMaterial({ color: P.VIOLET_LIGHT, transparent: true, toneMapped: false }),
    );
    const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.085, 16, 12)), headMat);
    head.visible = false;
    ringGroup.add(head);

    /** A camera-facing plaque built from a painted canvas. */
    const makePlaque = (
      text: string,
      worldH: number,
      opts: { font: string; color: string; background: string | null },
    ) => {
      const group = new THREE.Group();
      const painted = text ? paintPlaque(text, opts) : null;
      if (painted) {
        const texture = track(new THREE.CanvasTexture(painted.canvas));
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = maxAnisotropy;
        const mat = track(
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          }),
        );
        const geo = track(new THREE.PlaneGeometry(worldH * painted.aspect, worldH));
        group.add(new THREE.Mesh(geo, mat));
      }
      group.visible = false;
      return group;
    };

    const scorePlaque = makePlaque(`${SCORE}%`, 0.46, {
      font: `800 74px ${fontFamily}`,
      color: P.SCORE_TEXT,
      background: null,
    });
    ringGroup.add(scorePlaque);

    const gradedPill = makePlaque(pillText, 0.3, {
      font: `700 44px ${fontFamily}`,
      color: P.PLAQUE_TEXT,
      background: P.VIOLET_CSS,
    });
    gradedPill.position.set(0, -RING_R - 0.36, 0);
    ringGroup.add(gradedPill);

    /* --- Ambient motes ------------------------------------------------------ */

    const moteMat = track(
      new THREE.MeshBasicMaterial({
        color: P.MOTE,
        transparent: true,
        opacity: 0.5,
        toneMapped: false,
      }),
    );
    const moteGeo = track(new THREE.SphereGeometry(0.05, 10, 8));
    // Fixed offsets rather than Math.random(): a hero that composes differently
    // on every load is a hero nobody can art-direct.
    const MOTE_AT: [number, number, number][] = [
      [-2.15, 1.5, 0.9],
      [1.95, 1.05, -0.5],
      [-1.75, -1.6, 0.4],
      [2.35, -0.35, 0.7],
      [0.35, 2.15, -0.3],
    ];
    const motes = MOTE_AT.map((at, i) => {
      const mesh = new THREE.Mesh(moteGeo, moteMat);
      mesh.position.set(at[0], at[1], at[2]);
      root.add(mesh);
      return { mesh, baseY: at[1], phase: i * 1.27, amp: 0.09 + (i % 3) * 0.035 };
    });

    /* --- Frame -------------------------------------------------------------- */

    const baseTilt = { x: -0.16, y: 0.3 };

    /**
     * Paints one frame of the cycle.
     *
     * @param p  position in the loop, 0–1
     * @param t  absolute seconds, for the drifts that never reset
     */
    const applyFrame = (p: number, t: number) => {
      // A single clear ramp at the end of the cycle takes everything back to
      // nothing, so the loop restarts on an empty page rather than cutting.
      const clear = 1 - clamp01((p - T.CLEAR_FROM) / (1 - T.CLEAR_FROM));

      for (let i = 0; i < SHEET.ROWS; i++) {
        const from = T.MARK_FROM + i * T.ROW_GAP;
        const fill = easeOutCubic(clamp01((p - from) / T.ROW_FILL)) * clear;
        const tickIn = easeOutBack(clamp01((p - (from + T.TICK_LAG)) / T.ROW_FILL)) * clear;

        const { bubble, tick } = marks[i];
        bubble.scale.setScalar(Math.max(0.0001, fill));
        bubble.visible = fill > 0.004;
        tick.scale.setScalar(Math.max(0.0001, tickIn * TICK_SCALE));
        tick.visible = tickIn > 0.004;
      }

      // Ring: how far round the sweep has travelled, 0–1.
      const sweep = easeOutCubic(clamp01((p - T.RING_FROM) / (T.RING_TO - T.RING_FROM))) * clear;
      const lit = Math.round(sweep * RING_SEGMENTS);
      for (let i = 0; i < RING_SEGMENTS; i++) segments[i].visible = i < lit;

      const sweeping = sweep > 0.001 && sweep < 0.999;
      head.visible = sweeping;
      if (sweeping) {
        const a = Math.PI / 2 - sweep * Math.PI * 2;
        head.position.set(Math.cos(a) * RING_R, Math.sin(a) * RING_R, 0);
      }

      const scoreIn = easeOutBack(clamp01((p - T.SCORE_AT) / 0.05)) * clear;
      scorePlaque.visible = scoreIn > 0.004;
      scorePlaque.scale.setScalar(Math.max(0.0001, scoreIn));

      const pillIn = easeOutBack(clamp01((p - T.PILL_AT) / 0.05)) * clear;
      gradedPill.visible = pillIn > 0.004;
      gradedPill.scale.setScalar(Math.max(0.0001, pillIn));

      // Drifts. Slow enough to be felt rather than watched.
      sheetGroup.position.y = SHEET_Y + Math.sin(t * 0.62) * 0.052;
      ringGroup.position.y = RING_Y + Math.sin(t * 0.62 + 0.9) * 0.036;
      for (const m of motes) {
        m.mesh.position.y = m.baseY + Math.sin(t * 0.5 + m.phase) * m.amp;
        m.mesh.scale.setScalar(0.85 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.4 + m.phase)));
      }
    };

    /**
     * Scales and recentres the model so it fills the frame without clipping.
     *
     * Measured at the square aspect — the tightest breakpoint the hero box
     * reaches — and in the *complete* pose, because that is when the model is
     * largest. Fit it at rest and the ring grows out of frame later.
     */
    const fitToFrame = (margin: number) => {
      const prevAspect = camera.aspect;
      camera.aspect = 1;
      camera.updateProjectionMatrix();

      applyFrame(SETTLED, 0);
      sheetGroup.rotation.set(baseTilt.x, baseTilt.y, 0);
      root.scale.setScalar(1);
      root.position.set(0, 0, 0);
      root.updateMatrixWorld(true);

      const centred = new THREE.Box3().setFromObject(root);
      root.position.x = -(centred.max.x + centred.min.x) / 2;
      root.position.y = -(centred.max.y + centred.min.y) / 2;
      root.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(root);
      const corner = new THREE.Vector3();
      let maxNdc = 0;
      for (let i = 0; i < 8; i++) {
        corner.set(
          i & 1 ? box.max.x : box.min.x,
          i & 2 ? box.max.y : box.min.y,
          i & 4 ? box.max.z : box.min.z,
        );
        corner.project(camera);
        maxNdc = Math.max(maxNdc, Math.abs(corner.x), Math.abs(corner.y));
      }
      if (maxNdc > 0) {
        const s = margin / maxNdc;
        root.scale.setScalar(s);
        root.position.multiplyScalar(s);
      }

      camera.aspect = prevAspect;
      camera.updateProjectionMatrix();
    };

    fitToFrame(0.94);

    /* --- Interaction, fenced to the hero box --------------------------------
       The hero rect is the border. Inside it the pointer steers the page's lean;
       beyond a small feather band outside it all influence decays to zero, so
       once the cursor travels down the page the sheet simply settles home. */

    const FEATHER = 0.12;
    let onScreen = false;
    const pointer = { x: 0, y: 0, influence: 0 };
    const target = { x: 0, y: 0, influence: 0 };

    const onPointerMove = (e: PointerEvent) => {
      if (!onScreen) return; // scrolled away — the border is closed
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const excess = Math.max(Math.abs(nx), Math.abs(ny)) - 1;
      if (excess >= FEATHER) {
        target.influence = 0;
        return;
      }
      target.influence = excess <= 0 ? 1 : 1 - excess / FEATHER;
      target.x = THREE.MathUtils.clamp(nx, -1, 1);
      target.y = THREE.MathUtils.clamp(ny, -1, 1);
    };
    const onPointerLeaveWindow = () => {
      target.influence = 0;
    };

    let clock = SETTLED * CYCLE;
    // Clicking restarts the marking pass — the one thing here worth seeing twice.
    const onPointerDown = () => {
      if (prefersReduced) return;
      clock = T.MARK_FROM * CYCLE;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerLeaveWindow, { passive: true });
    container.addEventListener("pointerdown", onPointerDown, { passive: true });

    /* --- Loop --------------------------------------------------------------- */

    let frame = 0;
    let running = false;
    let last = 0;

    const renderFrame = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      clock += dt;
      const t = clock;
      const p = (clock % CYCLE) / CYCLE;

      // Smooth the pointer rather than following it: a hero that snaps to the
      // cursor reads as a widget, not as an object with weight.
      pointer.influence += (target.influence - pointer.influence) * Math.min(1, dt * 6);
      pointer.x += (target.x - pointer.x) * Math.min(1, dt * 5);
      pointer.y += (target.y - pointer.y) * Math.min(1, dt * 5);

      applyFrame(p, t);

      const lean = pointer.influence;
      sheetGroup.rotation.y = baseTilt.y + pointer.x * 0.22 * lean + Math.sin(t * 0.4) * 0.022;
      sheetGroup.rotation.x = baseTilt.x - pointer.y * 0.16 * lean + Math.sin(t * 0.33) * 0.016;
      sheetGroup.rotation.z = pointer.x * 0.03 * lean;
      sheetGroup.position.z = lean * 0.22;
      ringGroup.position.x = RING_X + pointer.x * 0.1 * lean;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(renderFrame);
    };

    const startLoop = () => {
      if (running || prefersReduced) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(renderFrame);
    };
    const stopLoop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    };

    // Always compose one correct frame before the loop runs — this is also the
    // single static frame under reduced motion and while paused.
    applyFrame(SETTLED, SETTLED * CYCLE);
    sheetGroup.rotation.set(baseTilt.x, baseTilt.y, 0);
    renderer.render(scene, camera);

    // Only animate while the scene is on-screen AND the tab is visible.
    const sync = () => {
      if (onScreen && !document.hidden) startLoop();
      else stopLoop();
    };
    let io: IntersectionObserver | undefined;
    if (!prefersReduced) {
      io = new IntersectionObserver(
        (entries) => {
          onScreen = (entries[0]?.intersectionRatio ?? 0) >= 0.1;
          if (!onScreen) target.influence = 0;
          sync();
        },
        { threshold: [0, 0.1, 0.25] },
      );
      io.observe(container);
      document.addEventListener("visibilitychange", sync);
    }

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (!running) renderer.render(scene, camera); // keep the paused frame correct
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      io?.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerLeaveWindow);
      container.removeEventListener("pointerdown", onPointerDown);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [quizLabel, gradedLabel, isDark]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
