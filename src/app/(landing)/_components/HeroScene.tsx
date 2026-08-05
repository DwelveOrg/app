"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as THREE from "three";

/**
 * Hero centerpiece: the Dwelve pipeline tower.
 *
 * Five floating slabs stack into an exploded diagram of the product, bottom to
 * top: the teacher's lesson material → the AI drafting deck → the reviewed test
 * ("In review" flips to "Approved") → the class grid (each seat lights green as
 * it is graded) → the analytics deck (bars surge, a "92%" token pops). A single
 * energy bead rides the glowing spine through all five stages on a short
 * (~4.4s) heartbeat loop, so the whole story reads in one glance and repeats
 * quickly instead of unfolding as a long film.
 *
 * Interaction is deliberately fenced:
 *   - While the pointer is inside the hero box, the tower leans toward it
 *     (hard-clamped tilt), the deck fans open, and the layer nearest the cursor
 *     lifts and glows. A click/tap fires an immediate extra pulse up the spine.
 *   - The hero's edge is the border: crossing it (e.g. moving the mouse down
 *     the page) fades all influence to zero across a small feather band and the
 *     tower eases back to neutral. Scrolled mostly off-screen, the loop pauses.
 *   - Under reduced motion the scene paints one settled "story complete" frame.
 *
 * Built in raw three.js (no R3F) so it stays a single lazy chunk; mounted via
 * `next/dynamic({ ssr: false })` so it never blocks first paint. Labels are
 * canvas textures on plaques attached to the slabs, so text tilts with the
 * model. The canvas is transparent; the CSS glow behind it (in MainPage) gives
 * depth and is the graceful fallback when WebGL is unavailable.
 */

/**
 * Scene palette, per theme.
 *
 * The scene used to hard-code one set of colours, so in dark mode it stayed a light-mode object —
 * white sheets and near-white cards — floating on a near-black canvas. The decks now take their
 * surfaces from the theme while the violet identity accent stays put in both.
 *
 * These are literals rather than reads of `getComputedStyle`, because three.js needs numeric
 * colours at construction time and the CSS variables are hex strings that would need parsing on
 * every material. They mirror the `--brand-*` ramp in globals.css; keep them in step with it.
 */
type ScenePalette = {
  VIOLET: number;
  VIOLET_LIGHT: number;
  VIOLET_BRIGHT: number;
  VIOLET_DEEP: number;
  SUCCESS: number;
  LINE: number;
  SHEET_SURFACE: number;
  CARD_SURFACE: number;
  CLASS_SURFACE: number;
  TILE_IDLE: number;
  WHITE_CSS: string;
  VIOLET_CSS: string;
  VIOLET_DEEP_CSS: string;
  SUCCESS_CSS: string;
  GRADIENT_FROM: string;
  /** Colour of text drawn onto label plaques — must read on SHEET_SURFACE. */
  INK_CSS: string;
};

const PALETTES: Record<"light" | "dark", ScenePalette> = {
  light: {
    VIOLET: 0x5f40d5, // --brand / --primary
    VIOLET_LIGHT: 0x8163ff, // --brand-gradient from
    VIOLET_BRIGHT: 0x7b5ff0, // --ring
    VIOLET_DEEP: 0x452ba5, // --brand-violet-800
    SUCCESS: 0x25793a, // --success
    LINE: 0xd9d7e6,
    SHEET_SURFACE: 0xffffff, // --card
    CARD_SURFACE: 0xf7f6ff,
    CLASS_SURFACE: 0xededf7,
    TILE_IDLE: 0xdedcec,
    WHITE_CSS: "#FFFFFF",
    VIOLET_CSS: "#5F40D5",
    VIOLET_DEEP_CSS: "#452BA5",
    SUCCESS_CSS: "#25793A",
    GRADIENT_FROM: "#8163FF",
    INK_CSS: "#15151B", // --foreground
  },
  dark: {
    VIOLET: 0xa191ff, // --brand / --primary
    VIOLET_LIGHT: 0xc9bcff, // --brand-violet-300
    VIOLET_BRIGHT: 0xd8ceff,
    VIOLET_DEEP: 0x8e72ff, // --brand-violet-600
    SUCCESS: 0x5fcb63, // --success
    LINE: 0x37344a,
    SHEET_SURFACE: 0x232130,
    CARD_SURFACE: 0x1c1a28,
    CLASS_SURFACE: 0x181624,
    TILE_IDLE: 0x2c293c,
    WHITE_CSS: "#EEEDF2",
    VIOLET_CSS: "#A191FF",
    VIOLET_DEEP_CSS: "#C9BCFF",
    SUCCESS_CSS: "#5FCB63",
    GRADIENT_FROM: "#C9BCFF",
    INK_CSS: "#EEEDF2", // --foreground
  },
};

/**
 * The active palette. Module-scoped because the scene builders below are plain functions called
 * during construction, and threading a palette argument through all of them would be a far larger
 * change than this earns. Set once at the top of the build effect, before anything reads it; only
 * one hero scene is ever mounted.
 */
let P: ScenePalette = PALETTES.light;

let VIOLET = P.VIOLET;
let VIOLET_LIGHT = P.VIOLET_LIGHT;
let VIOLET_BRIGHT = P.VIOLET_BRIGHT;
let VIOLET_DEEP = P.VIOLET_DEEP;
let SUCCESS = P.SUCCESS;
let LINE = P.LINE;
let SHEET_SURFACE = P.SHEET_SURFACE;
let CARD_SURFACE = P.CARD_SURFACE;
let CLASS_SURFACE = P.CLASS_SURFACE;
let TILE_IDLE = P.TILE_IDLE;
let WHITE_CSS = P.WHITE_CSS;
let VIOLET_CSS = P.VIOLET_CSS;
let VIOLET_DEEP_CSS = P.VIOLET_DEEP_CSS;
let SUCCESS_CSS = P.SUCCESS_CSS;

function applyScenePalette(isDark: boolean) {
  P = PALETTES[isDark ? "dark" : "light"];
  VIOLET = P.VIOLET;
  VIOLET_LIGHT = P.VIOLET_LIGHT;
  VIOLET_BRIGHT = P.VIOLET_BRIGHT;
  VIOLET_DEEP = P.VIOLET_DEEP;
  SUCCESS = P.SUCCESS;
  LINE = P.LINE;
  SHEET_SURFACE = P.SHEET_SURFACE;
  CARD_SURFACE = P.CARD_SURFACE;
  CLASS_SURFACE = P.CLASS_SURFACE;
  TILE_IDLE = P.TILE_IDLE;
  WHITE_CSS = P.WHITE_CSS;
  VIOLET_CSS = P.VIOLET_CSS;
  VIOLET_DEEP_CSS = P.VIOLET_DEEP_CSS;
  SUCCESS_CSS = P.SUCCESS_CSS;
}

// --- Easing -----------------------------------------------------------------
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const easeOutBack = (t: number) => {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
/** Smooth symmetric pulse: 1 at `c`, easing to 0 at `c ± w`. */
const bell = (p: number, c: number, w: number) => {
  const d = Math.abs(p - c) / w;
  return d >= 1 ? 0 : 1 - d * d * (3 - 2 * d);
};

// --- Geometry helpers ---------------------------------------------------------

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const radius = Math.min(r, w / 2, h / 2);
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/** Rounded slab lying in the XZ plane with its thickness along Y. */
function slabGeometry(w: number, d: number, r: number, thick: number): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
}

function surfaceMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.05,
    emissive: new THREE.Color(VIOLET_LIGHT),
    emissiveIntensity: 0,
  });
}

function additiveMaterial(color: number, opacity = 0): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

/** Flat content bar lying on a slab's top face. */
function addFlatBar(
  parent: THREE.Object3D,
  w: number,
  d: number,
  color: number,
  x: number,
  y: number,
  z: number,
  emissive = false,
): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0,
    emissive: new THREE.Color(emissive ? color : 0x000000),
    emissiveIntensity: emissive ? 0.5 : 0,
  });
  const mesh = new THREE.Mesh(slabGeometry(w, d, Math.min(w, d) / 2, 0.03), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/** The brand gradient (violet-300 → primary) for the AI deck's top face. */
function makeGradientTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, P.GRADIENT_FROM);
  grad.addColorStop(1, VIOLET_CSS);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawRoundedCanvasRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

type PillOpts = {
  /** World height of the pill. */
  height: number;
  /** Hard cap on world width; longer translations shrink to fit. */
  maxWidth: number;
  color: string;
  background: string;
  weight?: number;
};

type Pill = { group: THREE.Group; mat: THREE.MeshBasicMaterial };

// -----------------------------------------------------------------------------

type HeroLabels = { quiz: string; review: string; approved: string; graded: string; average: string };

const LAYERS = 5;
const GAP = 0.78; // rest distance between slab centers (pitched decks need the air)
const SPLAY_EXTRA = 0.17; // additional per-step gap when the deck fans open
const BASE_Y = (i: number) => (i - (LAYERS - 1) / 2) * GAP;

// Decks are never fully horizontal: they rest tipped toward the camera, and the
// deck the bead is visiting pivots further up — a horizontal→vertical
// "presentation" transition that rolls up the tower once per cycle. Hover focus
// pitches a deck the same way, so pointing at a stage turns it to face you.
const BASE_PITCH = 0.24;
const PRESENT_PITCH = 0.62;
const FOCUS_PITCH = 0.4;
const MAX_PITCH = 1.05; // ≈60° — approaching vertical, never past it
const PRESENT_PUSH = 0.3; // neighbors accordion apart so a presenting deck never clips them

/** How strongly deck `i` is presenting at loop phase `p` (with the click pulse
 *  at `burstQ` adding its own smaller wave). Pure in its inputs. */
const presentEnvAt = (p: number, burstQ: number, i: number) => {
  const a = ARRIVAL(i);
  const rise = easeOutCubic(clamp01((p - (a - 0.015)) / 0.055));
  const fall = 1 - easeInOutCubic(clamp01((p - (a + 0.09)) / 0.1));
  let env = rise * fall;
  if (burstQ >= 0 && burstQ <= 1) env += 0.6 * bell(easeInOutCubic(burstQ), i / (LAYERS - 1), 0.12);
  return clamp01(env);
};

// Heartbeat: one bead ride bottom → top, then a soft exhale before the next.
const CYCLE = 4.4; // seconds — deliberately short
const BEAD_START = 0.03;
const BEAD_END = 0.78;
const ARRIVAL = (i: number) => BEAD_START + (BEAD_END - BEAD_START) * (i / (LAYERS - 1));
const RESET_AT = 0.93;
const SETTLED_P = 0.88; // the "story complete" frame used when paused / reduced
const BURST_SECONDS = 0.95; // click-triggered pulse duration

export default function HeroScene({ className, labels }: { className?: string; labels?: HeroLabels }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Primitive deps (not the object) so the scene only rebuilds when the text
  // actually changes — e.g. a language switch — not on every parent re-render.
  const quizLabel = labels?.quiz ?? "";
  const reviewLabel = labels?.review ?? "";
  const approvedLabel = labels?.approved ?? "";
  const gradedLabel = labels?.graded ?? "";
  const averageLabel = labels?.average ?? "";

  // `resolvedTheme` collapses "system" to the concrete theme. It is undefined until the theme
  // provider hydrates; the scene is client-only anyway, and treating that first frame as light
  // matches the server-rendered CSS glow sitting behind the canvas.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Must run before any builder below reads a colour.
    applyScenePalette(isDark);

    // Local copy: the react-hooks immutability lint forbids passing effect
    // dependencies straight into helper closures.
    const text = {
      quiz: quizLabel,
      review: reviewLabel,
      approved: approvedLabel,
      graded: gradedLabel,
      average: averageLabel,
    };

    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL — the CSS glow fallback behind the canvas stays visible.
    }

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // updateStyle=false: never let three.js write an inline px width/height onto
    // the canvas. CSS below keeps it locked to the container, so it can't overflow
    // the viewport when the layout shrinks (the buffer still resizes for crispness).
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.35, 7.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 5);
    scene.add(key);
    const rim = new THREE.PointLight(VIOLET_LIGHT, 16, 30);
    rim.position.set(-4, -1, 3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(VIOLET_LIGHT, 0.4);
    fill.position.set(-2, 3, 4);
    scene.add(fill);

    // --- Text pill helper -------------------------------------------------------
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const fontFamily =
      (typeof document !== "undefined" && getComputedStyle(document.body).fontFamily) ||
      "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

    const makePill = (text: string, opts: PillOpts): Pill => {
      const group = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false });
      if (!text) return { group, mat };
      const { height: worldH, maxWidth, color, background, weight = 800 } = opts;

      const fontPx = 64;
      const font = `${weight} ${fontPx}px ${fontFamily}`;
      const padX = 34;
      const padY = 14;
      const measure = document.createElement("canvas").getContext("2d");
      if (!measure) return { group, mat };
      measure.font = font;
      const textW = Math.max(1, Math.ceil(measure.measureText(text).width));
      const logicalW = textW + padX * 2;
      const logicalH = Math.round(fontPx * 1.28) + padY * 2;

      const dpr = 2; // supersample for crispness at small on-screen sizes
      const canvas = document.createElement("canvas");
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return { group, mat };
      ctx.scale(dpr, dpr);

      drawRoundedCanvasRect(ctx, 0, 0, logicalW, logicalH, logicalH / 2);
      ctx.fillStyle = background;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = font;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(15,20,48,0.18)";
      ctx.lineWidth = 3;
      ctx.strokeText(text, logicalW / 2, logicalH / 2);
      ctx.fillStyle = color;
      ctx.fillText(text, logicalW / 2, logicalH / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;

      const aspect = logicalW / logicalH;
      let w = worldH * aspect;
      let h = worldH;
      if (w > maxWidth) {
        w = maxWidth;
        h = maxWidth / aspect;
      }
      mat.map = texture;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      // Slight backward tilt so plaques face the raised camera.
      mesh.rotation.x = -0.2;
      group.add(mesh);
      return { group, mat };
    };
    // ---------------------------------------------------------------------------

    const root = new THREE.Group();
    scene.add(root);
    const baseRotY = -0.1;
    root.rotation.y = baseRotY;

    // --- The five decks ---------------------------------------------------------
    const gradientTex = makeGradientTexture();

    type Deck = {
      holder: THREE.Group;
      slabMat: THREE.MeshStandardMaterial;
      baseEmissive: number;
      ringMat: THREE.MeshBasicMaterial;
      ring: THREE.Mesh;
    };
    const decks: Deck[] = [];
    // Plaques counter-rotate against their deck's pitch so text always faces
    // the camera while the deck underneath transitions horizontal → vertical.
    const counterPlaques: Array<{ group: THREE.Group; deck: number }> = [];

    const DECK_DIMS: Array<{ w: number; d: number; thick: number }> = [
      { w: 2.95, d: 1.5, thick: 0.11 }, // 0 lesson material
      { w: 3.15, d: 1.62, thick: 0.13 }, // 1 AI drafting engine
      { w: 2.95, d: 1.52, thick: 0.12 }, // 2 reviewed test
      { w: 3.2, d: 1.66, thick: 0.12 }, // 3 class grid
      { w: 2.75, d: 1.42, thick: 0.12 }, // 4 analytics
    ];

    for (let i = 0; i < LAYERS; i++) {
      const holder = new THREE.Group();
      holder.position.y = BASE_Y(i);
      root.add(holder);

      const dims = DECK_DIMS[i];
      let slabMat: THREE.MeshStandardMaterial;
      let baseEmissive = 0;
      if (i === 1 && gradientTex) {
        // ExtrudeGeometry UVs are the shape's XY coords; remap them into 0..1.
        gradientTex.repeat.set(1 / dims.w, 1 / dims.d);
        gradientTex.offset.set(0.5, 0.5);
        baseEmissive = 0.3;
        slabMat = new THREE.MeshStandardMaterial({
          map: gradientTex,
          roughness: 0.4,
          metalness: 0.08,
          emissive: new THREE.Color(0xffffff),
          emissiveMap: gradientTex,
          emissiveIntensity: baseEmissive,
        });
      } else {
        slabMat = surfaceMaterial(i === 0 ? SHEET_SURFACE : i === 3 ? CLASS_SURFACE : CARD_SURFACE);
      }
      const slab = new THREE.Mesh(slabGeometry(dims.w, dims.d, 0.14, dims.thick), slabMat);
      holder.add(slab);

      // Arrival ring — flares outward when the bead reaches this deck.
      const ringMat = additiveMaterial(VIOLET_BRIGHT, 0);
      const ringGeo = new THREE.TorusGeometry(0.6, 0.016, 8, 48);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.03;
      holder.add(ring);

      decks.push({ holder, slabMat, baseEmissive, ringMat, ring });
    }

    const topOf = (i: number) => DECK_DIMS[i].thick / 2 + 0.02;

    // Deck 0 — the teacher's material: printed lines + a violet file tab, and a
    // shimmer bar that sweeps across as the bead reads it.
    const d0 = decks[0];
    addFlatBar(d0.holder, 0.5, 0.14, VIOLET, -1.05, topOf(0), -0.52, true);
    for (let i = 0; i < 4; i++) {
      const w = 2.3 * (i === 3 ? 0.55 : 0.92 - (i % 2) * 0.14);
      addFlatBar(d0.holder, w, 0.07, LINE, -1.32 + w / 2, topOf(0), -0.2 + i * 0.24);
    }
    const shimmerMat = additiveMaterial(VIOLET_BRIGHT, 0);
    const shimmer = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.1), shimmerMat);
    shimmer.rotation.x = -Math.PI / 2;
    shimmer.position.set(0, topOf(0) + 0.03, 0.05);
    d0.holder.add(shimmer);

    // Deck 1 — AI drafting: a spinning spark above the gradient deck and three
    // question rows that type themselves in as the bead passes.
    const d1 = decks[1];
    const sparkMat = new THREE.MeshStandardMaterial({
      color: VIOLET_LIGHT,
      roughness: 0.25,
      metalness: 0.1,
      emissive: new THREE.Color(VIOLET_BRIGHT),
      emissiveIntensity: 0.9,
    });
    const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), sparkMat);
    spark.position.set(-1.15, 0.34, -0.3);
    d1.holder.add(spark);
    const draftRows: THREE.Group[] = [];
    const draftWidths = [2.1, 1.6, 1.85];
    for (let r = 0; r < 3; r++) {
      const rowHolder = new THREE.Group();
      rowHolder.position.set(-0.85, topOf(1), -0.32 + r * 0.34);
      const w = draftWidths[r];
      addFlatBar(rowHolder, w, 0.09, 0xffffff, w / 2, 0, 0, true);
      rowHolder.scale.x = 0;
      d1.holder.add(rowHolder);
      draftRows.push(rowHolder);
    }

    // Deck 2 — the reviewed test: question lines + answer chips on the face,
    // "quiz" pill and the review→approved status plaques standing at the front.
    const d2 = decks[2];
    for (let i = 0; i < 3; i++) {
      const w = 1.6 - (i % 2) * 0.25;
      addFlatBar(d2.holder, w, 0.07, LINE, -1.28 + w / 2, topOf(2), -0.2 + i * 0.3);
    }
    const chips: Array<{ mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }> = [];
    const CHIP_IDLE = 0xbfc7e6; // darker than the tiles so options read on the card
    const chipIdleColor = new THREE.Color(CHIP_IDLE);
    for (let c = 0; c < 4; c++) {
      const mat = new THREE.MeshStandardMaterial({
        color: CHIP_IDLE,
        roughness: 0.45,
        metalness: 0,
        emissive: new THREE.Color(SUCCESS),
        emissiveIntensity: 0,
      });
      const chip = new THREE.Mesh(slabGeometry(0.24, 0.24, 0.07, 0.06), mat);
      chip.position.set(0.4 + c * 0.3, topOf(2) + 0.01, -0.46);
      d2.holder.add(chip);
      chips.push({ mesh: chip, mat });
    }
    const quizPill = makePill(text.quiz, {
      height: 0.21,
      maxWidth: 1.25,
      color: WHITE_CSS,
      background: VIOLET_CSS,
    });
    quizPill.group.position.set(-0.78, 0.2, DECK_DIMS[2].d / 2 + 0.05);
    d2.holder.add(quizPill.group);
    counterPlaques.push({ group: quizPill.group, deck: 2 });
    const reviewPill = makePill(text.review, {
      height: 0.19,
      maxWidth: 1.15,
      color: WHITE_CSS,
      background: VIOLET_DEEP_CSS,
    });
    reviewPill.group.position.set(0.82, 0.19, DECK_DIMS[2].d / 2 + 0.05);
    d2.holder.add(reviewPill.group);
    counterPlaques.push({ group: reviewPill.group, deck: 2 });
    const approvedPill = makePill(text.approved, {
      height: 0.19,
      maxWidth: 1.15,
      color: WHITE_CSS,
      background: SUCCESS_CSS,
    });
    approvedPill.group.position.set(0.82, 0.19, DECK_DIMS[2].d / 2 + 0.06);
    d2.holder.add(approvedPill.group);
    counterPlaques.push({ group: approvedPill.group, deck: 2 });

    // Deck 3 — the class: a grid of student seats that light green as the bead
    // grades them, plus a "Graded" plaque.
    const d3 = decks[3];
    const tiles: Array<{ mat: THREE.MeshStandardMaterial; mesh: THREE.Mesh; order: number }> = [];
    const idleTileColor = new THREE.Color(TILE_IDLE);
    const successColor = new THREE.Color(SUCCESS);
    const TILE_COLS = 4;
    const TILE_ROWS = 3;
    for (let r = 0; r < TILE_ROWS; r++) {
      for (let c = 0; c < TILE_COLS; c++) {
        const mat = new THREE.MeshStandardMaterial({
          color: TILE_IDLE,
          roughness: 0.45,
          metalness: 0,
          emissive: new THREE.Color(SUCCESS),
          emissiveIntensity: 0,
        });
        const mesh = new THREE.Mesh(slabGeometry(0.4, 0.22, 0.07, 0.05), mat);
        mesh.position.set(-0.99 + c * 0.66, topOf(3), -0.44 + r * 0.44);
        d3.holder.add(mesh);
        const idx = r * TILE_COLS + c;
        tiles.push({ mat, mesh, order: ((idx * 7) % (TILE_COLS * TILE_ROWS)) / (TILE_COLS * TILE_ROWS) });
      }
    }
    const gradedPill = makePill(text.graded, {
      height: 0.19,
      maxWidth: 0.95,
      color: WHITE_CSS,
      background: SUCCESS_CSS,
    });
    gradedPill.group.position.set(1.05, 0.2, DECK_DIMS[3].d / 2 + 0.05);
    d3.holder.add(gradedPill.group);
    counterPlaques.push({ group: gradedPill.group, deck: 3 });

    // Deck 4 — analytics: bars that surge when the bead lands, plus the floating
    // "92%" token and "Class average" caption above the tower.
    const d4 = decks[4];
    type Bar = { holder: THREE.Group; mat: THREE.MeshStandardMaterial; baseEmissive: number };
    const bars: Bar[] = [];
    const barHeights = [0.38, 0.55, 0.46, 0.72];
    const barColors = [VIOLET_LIGHT, VIOLET, VIOLET_LIGHT, VIOLET_DEEP];
    const barEmissives = [0.25, 0.32, 0.25, 0.5];
    for (let i = 0; i < barHeights.length; i++) {
      const holder = new THREE.Group();
      holder.position.set(-0.9 + i * 0.46, topOf(4) - 0.02, 0.12);
      const mat = new THREE.MeshStandardMaterial({
        color: barColors[i],
        roughness: 0.42,
        metalness: 0.12,
        emissive: new THREE.Color(barColors[i]),
        emissiveIntensity: barEmissives[i],
      });
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, barHeights[i], 0.26),
        mat,
      );
      mesh.position.y = barHeights[i] / 2;
      holder.add(mesh);
      holder.scale.y = 0.5;
      d4.holder.add(holder);
      bars.push({ holder, mat, baseEmissive: barEmissives[i] });
    }
    // Token + caption live on the root (not the deck) so they hold their spot
    // above the tower while the analytics deck pitches; layoutDecks tracks them
    // to the deck's position each frame.
    const token = makePill("92%", { height: 0.4, maxWidth: 1.3, color: WHITE_CSS, background: VIOLET_CSS });
    token.group.scale.setScalar(0);
    root.add(token.group);
    const caption = makePill(text.average, {
      height: 0.18,
      maxWidth: 1.5,
      color: VIOLET_DEEP_CSS,
      background: WHITE_CSS,
      weight: 700,
    });
    caption.group.scale.setScalar(0);
    root.add(caption.group);
    const TOKEN_OFFSET = new THREE.Vector3(0.95, 1.0, 0.42);
    const CAPTION_OFFSET = new THREE.Vector3(1.02, 0.55, 0.42);

    // --- The spine and its travelers ---------------------------------------------
    const spineGroup = new THREE.Group();
    root.add(spineGroup);
    const SPINE_H = 3.4;
    const spineOuterMat = additiveMaterial(VIOLET_LIGHT, 0.16);
    const spineOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, SPINE_H, 12, 1, true), spineOuterMat);
    spineGroup.add(spineOuter);
    const spineCoreMat = additiveMaterial(VIOLET_BRIGHT, 0.4);
    const spineCore = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, SPINE_H, 8, 1, true), spineCoreMat);
    spineGroup.add(spineCore);

    const makeBead = () => {
      const g = new THREE.Group();
      const coreMat = additiveMaterial(0xffffff, 0.9);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), coreMat));
      const glowMat = additiveMaterial(VIOLET_BRIGHT, 0.4);
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), glowMat));
      g.visible = false;
      root.add(g);
      return { group: g, coreMat, glowMat };
    };
    const bead = makeBead(); // the heartbeat
    const burstBead = makeBead(); // the click-triggered pulse

    // Helix particles slowly rising around the spine — continuous ambient energy.
    const HELIX = 18;
    const helixSeeds = new Float32Array(HELIX * 2);
    for (let i = 0; i < HELIX; i++) {
      helixSeeds[i * 2] = i / HELIX;
      helixSeeds[i * 2 + 1] = (i * 2.399963) % (Math.PI * 2); // golden-angle spread
    }
    const helixGeo = new THREE.BufferGeometry();
    const helixPos = new THREE.BufferAttribute(new Float32Array(HELIX * 3), 3);
    helixPos.setUsage(THREE.DynamicDrawUsage);
    helixGeo.setAttribute("position", helixPos);
    const helixMat = new THREE.PointsMaterial({
      color: VIOLET_BRIGHT,
      size: 0.07,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    root.add(new THREE.Points(helixGeo, helixMat));

    // A few distant motes for depth.
    type Mote = { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; phase: number };
    const motes: Mote[] = [];
    const moteDefs = [
      { x: -1.78, y: 0.6, z: -0.4, r: 0.09 },
      { x: 1.82, y: -0.85, z: -0.3, r: 0.08 },
      { x: 1.68, y: 1.42, z: -0.5, r: 0.07 },
    ];
    for (const m of moteDefs) {
      const mat = new THREE.MeshStandardMaterial({
        color: VIOLET_LIGHT,
        roughness: 0.35,
        metalness: 0.1,
        emissive: new THREE.Color(VIOLET_LIGHT),
        emissiveIntensity: 0.7,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(m.r, 16, 16), mat);
      mesh.position.set(m.x, m.y, m.z);
      root.add(mesh);
      motes.push({ mesh, mat, phase: m.x * 2.1 + m.y });
    }

    // --- Layout: rest ↔ fanned-open deck, presentation pitch, focus, idle bob ----
    // Each deck's pitch = rest tilt + presentation wave (the bead's beat, from
    // `p`/`burstQ`) + hover focus; presenting decks push their neighbors apart.
    // `fitAll` poses every deck at full presentation for worst-case auto-fit.
    const focus = new Float32Array(LAYERS); // smoothed per-deck pointer highlight
    const layoutDecks = (splay: number, t: number, p: number, burstQ: number, fitAll = false) => {
      for (let i = 0; i < LAYERS; i++) {
        const holder = decks[i].holder;
        // Fit pose = realistic worst case, not "all five presenting at once"
        // (which never happens and would over-shrink the model): one mid deck
        // fully presenting + hover focus, everything fanned open.
        const present = fitAll ? (i === 2 ? 1 : 0) : presentEnvAt(p, burstQ, i);
        const focusAmt = fitAll ? 1 : focus[i];
        // The analytics deck pitches less — its 3D bars shouldn't aim at the camera.
        const depthFactor = i === LAYERS - 1 ? 0.72 : 1;
        const pitch = Math.min(
          MAX_PITCH,
          BASE_PITCH + (PRESENT_PITCH * present + FOCUS_PITCH * focusAmt) * depthFactor,
        );
        holder.rotation.x = pitch;
        holder.rotation.y = (i % 2 ? -1 : 1) * 0.045 * splay;

        let push = 0;
        for (let j = 0; j < LAYERS; j++) {
          if (j === i) continue;
          const pj = fitAll ? (j === 2 ? 1 : 0) : presentEnvAt(p, burstQ, j);
          push += Math.sign(i - j) * PRESENT_PUSH * pj;
        }
        const bob = Math.sin(t * 0.7 + i * 1.35) * 0.025;
        holder.position.y =
          BASE_Y(i) + (i - (LAYERS - 1) / 2) * SPLAY_EXTRA * splay + push + bob + focus[i] * 0.07;
        holder.position.x = (i % 2 ? 1 : -1) * 0.05 * splay;
      }
      for (const plaque of counterPlaques) {
        plaque.group.rotation.x = -decks[plaque.deck].holder.rotation.x;
      }
      const topHolder = decks[LAYERS - 1].holder;
      token.group.position.copy(topHolder.position).add(TOKEN_OFFSET);
      caption.group.position.copy(topHolder.position).add(CAPTION_OFFSET);
      const yBot = decks[0].holder.position.y;
      const yTop = topHolder.position.y;
      spineGroup.position.y = (yBot + yTop) / 2;
      spineGroup.scale.y = (yTop - yBot + 0.7) / SPINE_H;
    };

    // --- The heartbeat ------------------------------------------------------------
    // `applyFrame(p, burstQ, t)` is a pure function of the loop phase p∈[0,1),
    // the click-pulse phase burstQ (or -1 when inactive) and time t, so the
    // settled/reduced-motion frame is just applyFrame(SETTLED_P, -1, ...).
    const beadTravelY = (q: number) => {
      const yBot = decks[0].holder.position.y - 0.3;
      const yTop = decks[LAYERS - 1].holder.position.y + 0.2;
      return lerp(yBot, yTop, q);
    };

    const applyFrame = (p: number, burstQ: number, t: number) => {
      const settle = p >= RESET_AT ? 1 - easeInOutCubic((p - RESET_AT) / (1 - RESET_AT)) : 1;
      const burstActive = burstQ >= 0 && burstQ <= 1;

      // Beads ride the spine.
      const beadQ = (p - BEAD_START) / (BEAD_END - BEAD_START);
      bead.group.visible = beadQ > 0 && beadQ < 1;
      if (bead.group.visible) {
        bead.group.position.y = beadTravelY(beadQ);
        const throb = 1 + 0.14 * Math.sin(t * 9);
        bead.group.scale.setScalar(throb);
        bead.glowMat.opacity = 0.35 + 0.2 * Math.sin(t * 7);
      }
      burstBead.group.visible = burstActive;
      if (burstActive) {
        burstBead.group.position.y = beadTravelY(easeInOutCubic(burstQ));
        burstBead.group.scale.setScalar(1.1);
        burstBead.glowMat.opacity = 0.5 * (1 - burstQ * 0.5);
      }

      // Spine glow follows the traffic.
      const beadActive = bead.group.visible ? 1 : 0;
      spineOuterMat.opacity = 0.13 + 0.06 * Math.sin(t * 1.9) + 0.08 * beadActive + (burstActive ? 0.1 : 0);
      spineCoreMat.opacity = 0.3 + 0.1 * Math.sin(t * 2.3) + 0.15 * beadActive + (burstActive ? 0.2 : 0);

      // Per-deck arrival flash + expanding ring (main pulse and click pulse).
      for (let i = 0; i < LAYERS; i++) {
        const deck = decks[i];
        const flashMain = bell(p, ARRIVAL(i), 0.05);
        const flashBurst = burstActive ? bell(easeInOutCubic(burstQ), i / (LAYERS - 1), 0.1) : 0;
        const flash = Math.min(1, flashMain + flashBurst);
        deck.slabMat.emissiveIntensity = deck.baseEmissive + 0.3 * flash + 0.14 * focus[i];

        const ringMain = clamp01((p - (ARRIVAL(i) - 0.01)) / 0.1);
        const ringBurst = burstActive ? clamp01((easeInOutCubic(burstQ) - i / (LAYERS - 1)) / 0.14) : 0;
        // Whichever wave is currently brighter drives the ring.
        const rT =
          ringMain > 0 && ringMain < 1 && (1 - ringMain) * 1 >= (ringBurst > 0 && ringBurst < 1 ? 1 - ringBurst : 0)
            ? ringMain
            : ringBurst;
        if (rT > 0 && rT < 1) {
          deck.ring.visible = true;
          deck.ring.scale.setScalar(0.5 + 1.1 * easeOutCubic(rT));
          deck.ringMat.opacity = 0.75 * (1 - rT);
        } else {
          deck.ring.visible = false;
          deck.ringMat.opacity = 0;
        }
      }

      // Deck 0 — shimmer sweeps across the material as it is read.
      const readT = clamp01((p - 0.0) / 0.16);
      shimmer.position.x = lerp(-0.85, 0.85, readT);
      shimmerMat.opacity = 0.7 * bell(p, ARRIVAL(0) + 0.05, 0.09);

      // Deck 1 — the spark spins up and the draft rows type in.
      const draftEnergy = bell(p, ARRIVAL(1), 0.12) + (burstActive ? bell(easeInOutCubic(burstQ), 0.25, 0.12) : 0);
      spark.rotation.y = t * (1.2 + draftEnergy * 5);
      spark.rotation.z = t * 0.8;
      spark.position.y = 0.34 + Math.sin(t * 1.7) * 0.045;
      sparkMat.emissiveIntensity = 0.7 + draftEnergy * 0.9;
      for (let r = 0; r < draftRows.length; r++) {
        const w = easeOutCubic(clamp01((p - (ARRIVAL(1) + 0.012 + r * 0.045)) / 0.07)) * settle;
        draftRows[r].scale.x = Math.max(0.0001, w);
        draftRows[r].visible = w > 0.002;
      }

      // Deck 2 — "In review" is stamped into "Approved"; one answer chip turns green.
      const approveT = clamp01((p - (ARRIVAL(2) + 0.012)) / 0.05);
      const approvedS = easeOutBack(approveT) * settle;
      approvedPill.group.scale.setScalar(Math.max(0.0001, approvedS));
      approvedPill.group.visible = approvedS > 0.002;
      const reviewS = Math.max(1 - easeInOutCubic(clamp01((p - ARRIVAL(2)) / 0.04)), 1 - settle);
      reviewPill.group.scale.setScalar(Math.max(0.0001, reviewS));
      reviewPill.group.visible = reviewS > 0.002;
      const punch = 1 + 0.03 * bell(p, ARRIVAL(2) + 0.02, 0.035);
      decks[2].holder.scale.setScalar(punch);
      for (let c = 0; c < chips.length; c++) {
        const isKey = c === 1;
        const flip = isKey ? clamp01((p - (ARRIVAL(2) + 0.035)) / 0.05) * settle : 0;
        chips[c].mat.color.lerpColors(chipIdleColor, successColor, flip);
        chips[c].mat.emissiveIntensity = 0.5 * flip;
        chips[c].mesh.scale.setScalar(1 + 0.25 * (isKey ? bell(p, ARRIVAL(2) + 0.055, 0.04) : 0));
      }

      // Deck 3 — seats light green in a scatter as submissions are graded.
      for (const tile of tiles) {
        const on = easeOutCubic(clamp01((p - (ARRIVAL(3) + tile.order * 0.09)) / 0.035)) * settle;
        tile.mat.color.lerpColors(idleTileColor, successColor, on);
        tile.mat.emissiveIntensity = 0.45 * on;
        tile.mesh.position.y = topOf(3) + 0.03 * on;
      }
      const gradedS = easeOutBack(clamp01((p - (ARRIVAL(3) + 0.09)) / 0.05)) * settle;
      gradedPill.group.scale.setScalar(Math.max(0.0001, gradedS));
      gradedPill.group.visible = gradedS > 0.002;

      // Deck 4 — the analytics surge: bars overshoot to full, token + caption pop.
      for (let i = 0; i < bars.length; i++) {
        const surge = easeOutBack(clamp01((p - (ARRIVAL(4) + i * 0.018)) / 0.06));
        const breathe = 0.015 * Math.sin(t * 1.6 + i);
        bars[i].holder.scale.y = 0.5 + 0.5 * surge * settle + breathe;
        bars[i].mat.emissiveIntensity = bars[i].baseEmissive * (0.7 + 0.6 * surge * settle);
      }
      const tokenS = easeOutBack(clamp01((p - (ARRIVAL(4) + 0.045)) / 0.055)) * settle;
      token.group.scale.setScalar(Math.max(0.0001, tokenS));
      token.group.visible = tokenS > 0.002;
      const captionS = easeOutBack(clamp01((p - (ARRIVAL(4) + 0.028)) / 0.055)) * settle;
      caption.group.scale.setScalar(Math.max(0.0001, captionS));
      caption.group.visible = captionS > 0.002;

      // Helix particles rise continuously; brighter while a bead is in flight.
      const yBot = decks[0].holder.position.y - 0.2;
      const yTop = decks[LAYERS - 1].holder.position.y + 0.25;
      const arr = helixPos.array as Float32Array;
      for (let i = 0; i < HELIX; i++) {
        const q = (helixSeeds[i * 2] + t * 0.055) % 1;
        const ang = helixSeeds[i * 2 + 1] + t * 0.55 + q * 4.2;
        const radius = 0.5 + 0.06 * Math.sin(q * Math.PI);
        arr[i * 3] = Math.cos(ang) * radius;
        arr[i * 3 + 1] = lerp(yBot, yTop, q);
        arr[i * 3 + 2] = Math.sin(ang) * radius;
      }
      helixPos.needsUpdate = true;
      helixMat.opacity = 0.24 + 0.14 * beadActive + (burstActive ? 0.15 : 0);

      // Ambient motes pulse slowly.
      for (const m of motes) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + m.phase);
        m.mesh.scale.setScalar(0.85 + 0.35 * pulse);
        m.mat.emissiveIntensity = 0.45 + 0.65 * pulse;
      }
    };

    // Auto-fit: recenter the model (the "92%" token makes its bounds top-heavy)
    // and scale it so its projected bounds sit inside the frame at the square
    // aspect (the tightest breakpoint), evaluated with the deck fully fanned
    // open so interaction can never push content past the edges.
    const fitToFrame = (margin: number) => {
      const prevAspect = camera.aspect;
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      focus.fill(0);
      layoutDecks(1, 0, 0, -1, true);
      root.scale.setScalar(1);
      root.position.y = 0;
      root.updateMatrixWorld(true);
      const centerBox = new THREE.Box3().setFromObject(root);
      root.position.y = -(centerBox.max.y + centerBox.min.y) / 2;
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const corner = new THREE.Vector3();
      let maxNdc = 0;
      for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        corner.project(camera);
        maxNdc = Math.max(maxNdc, Math.abs(corner.x), Math.abs(corner.y));
      }
      if (maxNdc > 0) {
        const s = margin / maxNdc;
        root.scale.setScalar(s);
        root.position.y *= s; // the recenter shift scales with the model
      }
      layoutDecks(0, 0, SETTLED_P, -1);
      camera.aspect = prevAspect;
      camera.updateProjectionMatrix();
    };

    // 1.04 against the deliberately over-estimated fit pose ≈ full frame at rest
    // with no clipping in any real pose.
    fitToFrame(1.04);
    layoutDecks(0, SETTLED_P * CYCLE, SETTLED_P, -1);
    applyFrame(SETTLED_P, -1, SETTLED_P * CYCLE);

    // --- Interaction: fenced to the hero box -------------------------------------
    // The hero rect is the border. Inside it the pointer steers tilt/splay/focus;
    // beyond a small feather band outside it, all influence decays to zero, so
    // once the cursor travels down the page the tower simply settles home.
    const FEATHER = 0.12;
    let onScreen = false;
    const pointer = { x: 0, y: 0, influence: 0 }; // smoothed values used by the frame loop
    const target = { x: 0, y: 0, influence: 0 };

    const onPointerMove = (e: PointerEvent) => {
      if (!onScreen) return; // scrolled away — the border is closed
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const excess = Math.max(Math.abs(nx), Math.abs(ny)) - 1;
      if (excess >= FEATHER) {
        target.influence = 0; // outside the border — hands off
        return;
      }
      target.influence = excess <= 0 ? 1 : 1 - excess / FEATHER;
      target.x = THREE.MathUtils.clamp(nx, -1, 1);
      target.y = THREE.MathUtils.clamp(ny, -1, 1);
    };
    const onPointerLeaveWindow = () => {
      target.influence = 0;
    };

    // A tap/click inside the hero fires an immediate extra pulse up the spine.
    let burstAt = -Infinity;
    let elapsed = SETTLED_P * CYCLE;
    const onPointerDown = () => {
      if (elapsed - burstAt > BURST_SECONDS * 0.6) burstAt = elapsed;
    };

    if (!prefersReduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerout", onPointerLeaveWindow, { passive: true });
      container.addEventListener("pointerdown", onPointerDown, { passive: true });
    }

    const clock = new THREE.Clock();
    let splay = 0;
    let frame = 0;
    let running = false;
    const baseRotX = 0;
    const MAX_TILT_Y = 0.26;
    const MAX_TILT_X = 0.15;

    const stepFrame = (dt: number) => {
      elapsed += dt;
      const t = elapsed;
      const p = (elapsed % CYCLE) / CYCLE;
      const burstQ = elapsed - burstAt <= BURST_SECONDS ? (elapsed - burstAt) / BURST_SECONDS : -1;

      // Smooth the pointer toward its target; influence 0 = fully home.
      pointer.influence += (target.influence - pointer.influence) * 0.08;
      pointer.x += (target.x * target.influence - pointer.x) * 0.07;
      pointer.y += (target.y * target.influence - pointer.y) * 0.07;
      splay += (pointer.influence - splay) * 0.06;

      // Focus: the deck nearest the cursor's height lifts and glows.
      const layerAt = (1 - (pointer.y + 1) / 2) * (LAYERS - 1);
      for (let i = 0; i < LAYERS; i++) {
        const ft = pointer.influence > 0.02 ? Math.max(0, 1 - Math.abs(layerAt - i)) * pointer.influence : 0;
        focus[i] += (ft - focus[i]) * 0.1;
      }

      // Tilt is hard-clamped — the second border. Idle sway keeps it alive.
      const sway = Math.sin(t * 0.24) * 0.035;
      const targetRotY = THREE.MathUtils.clamp(baseRotY + pointer.x * 0.24 + sway, -MAX_TILT_Y, MAX_TILT_Y);
      const targetRotX = THREE.MathUtils.clamp(baseRotX + pointer.y * 0.12, -MAX_TILT_X, MAX_TILT_X);
      root.rotation.y += (targetRotY - root.rotation.y) * 0.07;
      root.rotation.x += (targetRotX - root.rotation.x) * 0.07;

      layoutDecks(splay, t, p, burstQ);
      applyFrame(p, burstQ, t);

      renderer.render(scene, camera);
    };

    const renderFrame = () => {
      stepFrame(clock.getDelta());
      frame = requestAnimationFrame(renderFrame);
    };

    const startLoop = () => {
      if (running || prefersReduced) return;
      running = true;
      clock.getDelta(); // drop the paused interval so motion resumes where it left off
      frame = requestAnimationFrame(renderFrame);
    };
    const stopLoop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    };

    // Always paint one composed frame so the hero is correct before the loop runs
    // (and is the single static frame under reduced motion / while paused).
    renderer.render(scene, camera);

    // Only animate while the scene is actually on-screen AND the tab is visible.
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
      if (!running) renderer.render(scene, camera); // keep the static/paused frame correct
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
      scene.traverse((obj) => {
        const withGeo = obj as Partial<THREE.Mesh>;
        if (withGeo.geometry) withGeo.geometry.dispose();
        const mat = (obj as Partial<THREE.Mesh>).material;
        if (mat) {
          const mats = Array.isArray(mat) ? mat : [mat];
          for (const m of mats) {
            const basic = m as THREE.MeshBasicMaterial;
            if (basic.map) basic.map.dispose();
            const standard = m as THREE.MeshStandardMaterial;
            if (standard.emissiveMap && standard.emissiveMap !== basic.map) standard.emissiveMap.dispose();
            m.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [quizLabel, reviewLabel, approvedLabel, gradedLabel, averageLabel, isDark]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
