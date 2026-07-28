"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Hero centerpiece: "From material to mastery" — the whole product in one loop.
 *
 * The brand's open book (from the Dwelve mark) sits at the center as a glowing
 * engine. Each cycle tells the full story the landing page tells in sections:
 *
 *   1. A lesson sheet (the teacher's own material) dives into the book's seam —
 *      "draft tests from your own materials".
 *   2. Luminous particles rise out of the book and assemble a test card: header
 *      pill, question rows with AI sparks, then an "In review" tag — AI drafting.
 *   3. The tag is stamped over by a green "Approved" — teacher control:
 *      AI helps, teachers decide.
 *   4. Mini test sheets arc from the approved card to a phone and tablet; their
 *      screens fill and a small timer sweeps — share to any device, timed exams.
 *   5. Green checks pop on each device, a "Graded" pill lands, and light threads
 *      feed a rising bar chart with a "92%" grade token + "Class average"
 *      caption — instant grading flowing straight into analytics.
 *
 * The loop then softly resets and the next sheet enters. Under reduced motion
 * (or while paused) the scene paints one settled "story complete" frame.
 *
 * Built in raw three.js (no R3F) so it stays a single lazy chunk; mounted via
 * `next/dynamic({ ssr: false })` from the hero so it never blocks first paint.
 * Text lives *on* the surfaces (canvas textures) so labels tilt with the model.
 * The canvas is transparent; the CSS glow behind it (in MainPage) supplies depth
 * and is the graceful fallback when WebGL is unavailable.
 */

// Brand palette — strictly the design-system violet/ink/success tokens.
const VIOLET = 0x6a4ff0; // --primary
const VIOLET_LIGHT = 0x8e78ff; // --brand-violet-300
const VIOLET_BRIGHT = 0x9b80ff; // violet-400, for glow lines
const VIOLET_DEEP = 0x5739d6; // --primary-hover
const VIOLET_COVER = 0x4b36c9; // violet-800 — the book's cover boards
const SUCCESS = 0x16b981;
const LINE = 0xd7dcf2;
const CARD_SURFACE = 0xf7f8ff;
const PAGE_SURFACE = 0xffffff;

// CSS colours for the canvas-texture text and gradients drawn onto surfaces.
const WHITE_CSS = "#FFFFFF";
const INK_CSS = "#0F1430";
const VIOLET_CSS = "#6A4FF0";
const VIOLET_DEEP_CSS = "#4B36C9";
const VIOLET_LIGHT_CSS = "#8E78FF";
const SUCCESS_CSS = "#0A8F61";

// --- Easing -----------------------------------------------------------------
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
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

/** Draws crisp text onto a card/page face. Provided by the component (it needs
 *  the renderer's anisotropy + the page font), passed into the builders. */
type AddLabel = (
  parent: THREE.Object3D,
  text: string,
  opts: {
    x: number;
    y: number;
    z: number;
    /** World height of the text line box. */
    height: number;
    /** Hard cap on world width; longer translations shrink to fit the surface. */
    maxWidth: number;
    color?: string;
    weight?: number;
    anchor?: "left" | "center";
    background?: string;
    borderColor?: string;
    paddingX?: number;
    paddingY?: number;
    radius?: number;
    textStrokeColor?: string;
    textStrokeWidth?: number;
  },
) => void;

/** Rounded-rectangle profile used by every panel and bar in the scene. */
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

function roundedPanelGeometry(w: number, h: number, r: number, depth: number): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 14,
  });
  geo.center();
  return geo;
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

function surfaceMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
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

/** The brand gradient (violet-300 → primary), for the book's right page. */
function makeGradientTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, VIOLET_LIGHT_CSS);
  grad.addColorStop(1, VIOLET_CSS);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft radial glow used for the halo behind the book. */
function makeRadialTexture(): THREE.CanvasTexture | null {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(142,120,255,0.85)");
  grad.addColorStop(0.45, "rgba(122,90,255,0.30)");
  grad.addColorStop(1, "rgba(122,90,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A small content bar (text line, accent pill) sitting on a face. */
function addBar(
  parent: THREE.Object3D,
  w: number,
  h: number,
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
  const mesh = new THREE.Mesh(roundedPanelGeometry(w, h, Math.min(w, h) / 2, 0.015), mat);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/** White rounded badge carrying a green ✓, drawn from two bars. Returned as a
 *  group so callers can pop it in by scaling from 0. */
function makeCheckBadge(size: number): THREE.Group {
  const g = new THREE.Group();
  const badge = new THREE.Mesh(roundedPanelGeometry(size, size, size * 0.32, 0.05), surfaceMaterial(PAGE_SURFACE));
  g.add(badge);
  const s = size;
  addBar(badge, s * 0.42, s * 0.15, SUCCESS, -s * 0.05, -s * 0.07, 0.05, true).rotation.z = Math.PI * 0.32;
  addBar(badge, s * 0.24, s * 0.15, SUCCESS, s * 0.16, s * 0.02, 0.05, true).rotation.z = -Math.PI * 0.28;
  return g;
}

/** A rounded token carrying centred text (grade "92%", captions, status pills). */
function makeToken(
  addLabel: AddLabel,
  text: string,
  opts: { height: number; textColor: string; background?: string; weight?: number },
): THREE.Group {
  const g = new THREE.Group();
  addLabel(g, text, {
    x: 0,
    y: 0,
    z: 0.02,
    height: opts.height,
    maxWidth: 4,
    color: opts.textColor,
    weight: opts.weight ?? 800,
    anchor: "center",
    background: opts.background,
    borderColor: opts.background ? "rgba(255,255,255,0.5)" : undefined,
    paddingX: 34,
    paddingY: 14,
    textStrokeColor: opts.background ? "rgba(15,20,48,0.18)" : undefined,
    textStrokeWidth: opts.background ? 3 : 0,
  });
  g.scale.setScalar(0);
  return g;
}

// --- The book engine ---------------------------------------------------------

type BookRefs = {
  group: THREE.Group;
  seamMat: THREE.MeshBasicMaterial;
  haloMat: THREE.MeshBasicMaterial;
  ringMat: THREE.MeshBasicMaterial;
  ringMat2: THREE.MeshBasicMaterial;
  ring: THREE.Mesh;
  ring2: THREE.Mesh;
  /** Root-space point where absorbed sheets vanish / particles are born. */
  mouthY: number;
};

/** The Dwelve open book, standing half-open toward the camera: two fanned pages
 *  (right one carrying the logo's violet gradient), cover boards behind them, a
 *  glowing gutter seam, and a halo + orbit rings that flare when it "ingests". */
function makeBook(): BookRefs {
  const group = new THREE.Group();
  const pageW = 1.06;
  const pageH = 1.46;
  const fan = 0.52; // radians each page swings back from the seam

  const gradientTex = makeGradientTexture();

  for (const side of [-1, 1] as const) {
    const holder = new THREE.Group();
    holder.rotation.y = side * -fan;
    group.add(holder);

    // Cover board — deep violet, a touch larger, sitting behind the page.
    const cover = new THREE.Mesh(
      roundedPanelGeometry(pageW + 0.07, pageH + 0.09, 0.09, 0.05),
      new THREE.MeshStandardMaterial({
        color: VIOLET_COVER,
        roughness: 0.45,
        metalness: 0.1,
        emissive: new THREE.Color(VIOLET_COVER),
        emissiveIntensity: 0.22,
      }),
    );
    cover.position.set(side * (pageW / 2 + 0.005), -0.012, -0.055);
    holder.add(cover);

    // Page. The right page carries the brand gradient (the logo's book page);
    // the left page is paper with printed lines — the material being read.
    let pageMat: THREE.MeshStandardMaterial;
    if (side === 1 && gradientTex) {
      // ExtrudeGeometry UVs are the shape's XY coords; remap them into 0..1.
      const tex = gradientTex;
      tex.repeat.set(1 / pageW, 1 / pageH);
      tex.offset.set(0.5, 0.5);
      pageMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.4,
        metalness: 0.08,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: tex,
        emissiveIntensity: 0.34,
      });
    } else {
      pageMat = surfaceMaterial(PAGE_SURFACE);
    }
    const page = new THREE.Mesh(roundedPanelGeometry(pageW, pageH, 0.06, 0.04), pageMat);
    page.position.set(side * pageW / 2, 0, 0);
    holder.add(page);

    // Printed lines on the left page (the lesson being read by the engine).
    if (side === -1) {
      const inner = pageW - 0.3;
      for (let i = 0; i < 4; i++) {
        const w = inner * (i === 3 ? 0.55 : 0.85 - (i % 2) * 0.12);
        addBar(holder, w, 0.055, LINE, -0.16 - w / 2, pageH / 2 - 0.34 - i * 0.24, 0.045);
      }
      addBar(holder, 0.34, 0.1, VIOLET_LIGHT, -0.34, -pageH / 2 + 0.28, 0.045, true);
    }
  }

  // Gutter seam — the glowing slot the material dives into.
  const seamMat = additiveMaterial(VIOLET_BRIGHT, 0.3);
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.1, pageH * 0.94), seamMat);
  seam.position.set(0, 0, 0.07);
  group.add(seam);

  // Halo + two counter-rotating orbit rings — the engine's ambient energy.
  const haloTex = makeRadialTexture();
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex ?? undefined,
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), haloMat);
  halo.position.set(0, 0, -0.5);
  group.add(halo);

  const ringMat = new THREE.MeshBasicMaterial({
    color: VIOLET_LIGHT,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    toneMapped: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.05, 72), ringMat);
  ring.position.set(0, 0, -0.38);
  group.add(ring);

  const ringMat2 = new THREE.MeshBasicMaterial({
    color: VIOLET_BRIGHT,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    toneMapped: false,
  });
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.76, 0.8, 64), ringMat2);
  ring2.position.set(0, 0, -0.32);
  group.add(ring2);

  return { group, seamMat, haloMat, ringMat, ringMat2, ring, ring2, mouthY: pageH * 0.18 };
}

// --- The lesson material sheet (transient) -----------------------------------

/** The teacher's own material: a small white sheet with text lines and a violet
 *  file tab. It flies from the upper-left into the book's seam each cycle. */
function makeLessonSheet(): THREE.Group {
  const g = new THREE.Group();
  const W = 0.8;
  const H = 1.02;
  const body = new THREE.Mesh(roundedPanelGeometry(W, H, 0.09, 0.05), surfaceMaterial(PAGE_SURFACE));
  g.add(body);
  addBar(g, 0.3, 0.11, VIOLET, W / 2 - 0.24, H / 2 - 0.16, 0.045, true); // file tab
  const inner = W - 0.24;
  for (let i = 0; i < 4; i++) {
    const w = inner * (i === 0 ? 0.62 : 0.9 - (i % 2) * 0.16);
    addBar(g, w, 0.05, LINE, -W / 2 + 0.12 + w / 2, H / 2 - 0.38 - i * 0.17, 0.045);
  }
  return g;
}

// --- The drafted test card ---------------------------------------------------

type CardLabels = { quiz: string; review: string; approved: string };

type CardRefs = {
  group: THREE.Group;
  rows: THREE.Group[];
  sparks: THREE.Mesh[];
  reviewPill: THREE.Group;
  approvedPill: THREE.Group;
};

/** The test the book drafts: header pill, question rows (AI spark + text line),
 *  and a status pill that flips "In review" → "Approved" (teacher control). */
function makeTestCard(addLabel: AddLabel, labels: CardLabels): CardRefs {
  const group = new THREE.Group();
  const W = 1.66;
  const H = 2.0;
  const depth = 0.12;

  const body = new THREE.Mesh(roundedPanelGeometry(W, H, 0.16, depth), surfaceMaterial(CARD_SURFACE));
  group.add(body);

  // Violet spine — the brand edge, echoing the book at a smaller scale.
  const edge = new THREE.Mesh(
    roundedPanelGeometry(0.11, H - 0.2, 0.05, depth * 0.9),
    new THREE.MeshStandardMaterial({
      color: VIOLET,
      roughness: 0.4,
      metalness: 0.1,
      emissive: new THREE.Color(VIOLET),
      emissiveIntensity: 0.25,
    }),
  );
  edge.position.set(-W / 2 + 0.12, 0, 0.01);
  group.add(edge);

  const faceZ = depth / 2 + 0.03;
  const padX = 0.32;

  // Header pill — the test's name ("Weekly quiz").
  addLabel(group, labels.quiz, {
    x: -W / 2 + padX,
    y: H / 2 - 0.32,
    z: faceZ + 0.008,
    height: 0.26,
    maxWidth: W - padX - 0.22,
    color: WHITE_CSS,
    weight: 800,
    background: VIOLET_CSS,
    borderColor: "rgba(255,255,255,0.6)",
    paddingX: 30,
    paddingY: 11,
    textStrokeColor: "rgba(15,20,48,0.2)",
    textStrokeWidth: 3,
  });

  // Question rows: an AI spark + a drafted text line, popped in one by one.
  const rows: THREE.Group[] = [];
  const sparks: THREE.Mesh[] = [];
  const rowTop = H / 2 - 0.74;
  const rowGap = 0.315;
  const widths = [0.94, 0.76, 0.88, 0.64];
  for (let i = 0; i < 4; i++) {
    const row = new THREE.Group();
    row.position.set(0, rowTop - i * rowGap, faceZ);
    const spark = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.055),
      new THREE.MeshStandardMaterial({
        color: VIOLET_LIGHT,
        roughness: 0.3,
        metalness: 0.1,
        emissive: new THREE.Color(VIOLET_LIGHT),
        emissiveIntensity: 0.8,
      }),
    );
    spark.position.set(-W / 2 + padX + 0.03, 0, 0.02);
    row.add(spark);
    sparks.push(spark);
    const w = widths[i];
    addBar(row, w, 0.07, LINE, -W / 2 + padX + 0.22 + w / 2, 0, 0);
    row.scale.setScalar(0);
    group.add(row);
    rows.push(row);
  }

  // Status pills, same anchor: violet "In review" flips to green "Approved".
  const pillPos = new THREE.Vector3(-W / 2 + padX, -H / 2 + 0.34, faceZ + 0.02);
  const reviewPill = new THREE.Group();
  reviewPill.position.copy(pillPos);
  addLabel(reviewPill, labels.review, {
    x: 0,
    y: 0,
    z: 0.01,
    height: 0.23,
    maxWidth: W - padX - 0.2,
    color: WHITE_CSS,
    weight: 800,
    background: VIOLET_DEEP_CSS,
    borderColor: "rgba(255,255,255,0.55)",
    paddingX: 28,
    paddingY: 10,
  });
  reviewPill.scale.setScalar(0);
  group.add(reviewPill);

  const approvedPill = new THREE.Group();
  approvedPill.position.copy(pillPos);
  approvedPill.position.z += 0.01;
  addLabel(approvedPill, labels.approved, {
    x: 0,
    y: 0,
    z: 0.01,
    height: 0.23,
    maxWidth: W - padX - 0.2,
    color: WHITE_CSS,
    weight: 800,
    background: SUCCESS_CSS,
    borderColor: "rgba(255,255,255,0.55)",
    paddingX: 28,
    paddingY: 10,
  });
  approvedPill.scale.setScalar(0);
  group.add(approvedPill);

  return { group, rows, sparks, reviewPill, approvedPill };
}

// --- Student devices ---------------------------------------------------------

type DeviceRefs = {
  group: THREE.Group;
  screenMat: THREE.MeshStandardMaterial;
  rows: THREE.Mesh[];
  timerMat: THREE.MeshBasicMaterial;
  hand: THREE.Group;
  handMat: THREE.MeshStandardMaterial;
  check: THREE.Group;
  idle: THREE.Mesh;
};

/** A student device (phone or tablet): body, screen, tiny question rows, a
 *  sweeping timer up top, and a green check when the submission is graded. */
function makeDevice(kind: "phone" | "tablet"): DeviceRefs {
  const group = new THREE.Group();
  const W = kind === "phone" ? 0.52 : 0.88;
  const H = kind === "phone" ? 1.0 : 0.62;

  const body = new THREE.Mesh(
    roundedPanelGeometry(W, H, 0.11, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xe9ebf8, roughness: 0.45, metalness: 0.1 }),
  );
  group.add(body);

  const screenMat = new THREE.MeshStandardMaterial({
    color: PAGE_SURFACE,
    roughness: 0.35,
    metalness: 0,
    emissive: new THREE.Color(VIOLET_LIGHT),
    emissiveIntensity: 0.03,
  });
  const screen = new THREE.Mesh(roundedPanelGeometry(W - 0.09, H - 0.09, 0.08, 0.03), screenMat);
  screen.position.z = 0.045;
  group.add(screen);

  const faceZ = 0.09;

  // Idle mark — a soft violet dot that waits on the empty screen until the
  // test arrives, so the device never reads as a blank slab.
  const idle = new THREE.Mesh(
    new THREE.CircleGeometry(0.055, 24),
    new THREE.MeshStandardMaterial({
      color: VIOLET_LIGHT,
      roughness: 0.4,
      metalness: 0,
      emissive: new THREE.Color(VIOLET_LIGHT),
      emissiveIntensity: 0.55,
    }),
  );
  idle.position.set(0, 0, 0.09);
  group.add(idle);

  // Timer — thin ring + a sweeping hand at the top of the screen.
  const timerY = H / 2 - 0.17;
  const timerMat = additiveMaterial(VIOLET_BRIGHT, 0);
  const timerRing = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.095, 40), timerMat);
  timerRing.position.set(0, timerY, faceZ);
  group.add(timerRing);
  const hand = new THREE.Group();
  hand.position.set(0, timerY, faceZ + 0.01);
  const handMat = new THREE.MeshStandardMaterial({
    color: VIOLET,
    roughness: 0.4,
    metalness: 0,
    emissive: new THREE.Color(VIOLET),
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0,
  });
  const handMesh = new THREE.Mesh(roundedPanelGeometry(0.06, 0.022, 0.011, 0.012), handMat);
  handMesh.position.x = 0.032;
  hand.add(handMesh);
  group.add(hand);

  // Tiny question rows filling the screen when the test arrives.
  const rows: THREE.Mesh[] = [];
  const innerW = W - 0.24;
  const rowCount = kind === "phone" ? 3 : 2;
  for (let i = 0; i < rowCount; i++) {
    const w = innerW * (0.95 - (i % 2) * 0.22);
    const bar = addBar(group, w, 0.045, LINE, -W / 2 + 0.13 + w / 2, timerY - 0.24 - i * 0.15, faceZ);
    bar.scale.setScalar(0);
    rows.push(bar);
  }

  // Graded check — pops over the screen once the submission is scored.
  const check = makeCheckBadge(kind === "phone" ? 0.24 : 0.22);
  check.position.set(0, -H / 2 + (kind === "phone" ? 0.26 : 0.2), faceZ + 0.04);
  check.scale.setScalar(0);
  group.add(check);

  return { group, screenMat, rows, timerMat, hand, handMat, check, idle };
}

// --- Mini sheets flying card → devices ---------------------------------------

function makeMiniSheet(): THREE.Group {
  const g = new THREE.Group();
  const W = 0.3;
  const H = 0.38;
  const body = new THREE.Mesh(roundedPanelGeometry(W, H, 0.06, 0.03), surfaceMaterial(PAGE_SURFACE));
  g.add(body);
  addBar(g, 0.16, 0.045, VIOLET_LIGHT, -0.02, 0.09, 0.03, true);
  addBar(g, 0.18, 0.04, LINE, 0, -0.03, 0.03);
  addBar(g, 0.12, 0.04, LINE, -0.03, -0.12, 0.03);
  return g;
}

// --- Performance chart -------------------------------------------------------

type Bar = { group: THREE.Group; fullH: number; mat: THREE.MeshStandardMaterial; baseEmissive: number };

type ChartRefs = {
  group: THREE.Group;
  bars: Bar[];
  ribbonMat: THREE.MeshBasicMaterial;
  apex: THREE.Group;
};

/** The class-performance chart the graded submissions feed: bars, a glowing
 *  trend ribbon, and a green upward apex chevron. */
function makePerfChart(): ChartRefs {
  const group = new THREE.Group();
  const bars: Bar[] = [];
  const heights = [0.52, 0.8, 0.68, 1.08];
  const colors = [VIOLET_LIGHT, VIOLET, VIOLET_LIGHT, VIOLET_DEEP];
  const emissives = [0.24, 0.32, 0.26, 0.5];
  const barW = 0.24;
  const gap = 0.12;

  const tops: THREE.Vector3[] = [];
  for (let i = 0; i < heights.length; i++) {
    const fullH = heights[i];
    const x = i * (barW + gap);
    const holder = new THREE.Group();
    holder.position.set(x, 0, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: colors[i],
      roughness: 0.42,
      metalness: 0.12,
      emissive: new THREE.Color(colors[i]),
      emissiveIntensity: emissives[i],
    });
    const mesh = new THREE.Mesh(roundedPanelGeometry(barW, fullH, 0.05, 0.14), mat);
    mesh.position.y = fullH / 2;
    holder.add(mesh);
    holder.scale.y = 0.05;
    group.add(holder);
    bars.push({ group: holder, fullH, mat, baseEmissive: emissives[i] });
    tops.push(new THREE.Vector3(x, fullH + 0.05, 0.1));
  }

  // Trend ribbon: rides the bar tops then lifts to the apex.
  const lastX = (heights.length - 1) * (barW + gap);
  const apexPos = new THREE.Vector3(lastX + 0.38, heights[heights.length - 1] + 0.44, 0.12);
  const curvePts = [new THREE.Vector3(-0.24, 0.26, 0.1), ...tops, apexPos];
  const curve = new THREE.CatmullRomCurve3(curvePts, false, "catmullrom", 0.4);
  const ribbonMat = additiveMaterial(VIOLET_BRIGHT, 0);
  const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.027, 7, false), ribbonMat);
  group.add(ribbon);

  // Apex chevron — a small green "up" arrow marking the positive trend.
  const apex = new THREE.Group();
  apex.position.copy(apexPos);
  const chevron = new THREE.Shape();
  chevron.moveTo(0, 0.15);
  chevron.lineTo(0.15, -0.09);
  chevron.lineTo(0.055, -0.09);
  chevron.lineTo(0, 0.018);
  chevron.lineTo(-0.055, -0.09);
  chevron.lineTo(-0.15, -0.09);
  chevron.closePath();
  const chevronGeo = new THREE.ExtrudeGeometry(chevron, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 1,
    steps: 1,
  });
  chevronGeo.center();
  apex.add(
    new THREE.Mesh(
      chevronGeo,
      new THREE.MeshStandardMaterial({
        color: SUCCESS,
        roughness: 0.35,
        metalness: 0.1,
        emissive: new THREE.Color(SUCCESS),
        emissiveIntensity: 0.6,
      }),
    ),
  );
  apex.scale.setScalar(0);
  group.add(apex);

  return { group, bars, ribbonMat, apex };
}

// -----------------------------------------------------------------------------

type HeroLabels = { quiz: string; review: string; approved: string; graded: string; average: string };

const quadBezier = (out: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, t: number) => {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
};

export default function HeroScene({ className, labels }: { className?: string; labels?: HeroLabels }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Primitive deps (not the object) so the scene only rebuilds when the text
  // actually changes — e.g. a language switch — not on every parent re-render.
  const quizLabel = labels?.quiz ?? "";
  const reviewLabel = labels?.review ?? "";
  const approvedLabel = labels?.approved ?? "";
  const gradedLabel = labels?.graded ?? "";
  const averageLabel = labels?.average ?? "";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL — CSS glow fallback behind the canvas stays visible.
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
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.6);

    // Lighting: soft ambient fill + a key light for form + a violet rim for brand glow.
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(VIOLET_LIGHT, 17, 30);
    rim.position.set(-4, -1.5, 3);
    scene.add(rim);
    const topViolet = new THREE.DirectionalLight(VIOLET_LIGHT, 0.5);
    topViolet.position.set(-2, 5, 2);
    scene.add(topViolet);

    // --- Text-on-surface helper -------------------------------------------------
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const fontFamily =
      (typeof document !== "undefined" && getComputedStyle(document.body).fontFamily) ||
      "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

    const addLabel: AddLabel = (parent, text, opts) => {
      if (!text) return;
      const {
        x,
        y,
        z,
        height: lineWorldH,
        maxWidth,
        color = INK_CSS,
        weight = 700,
        anchor = "left",
        background,
        borderColor,
        paddingX = background ? 26 : 0,
        paddingY = background ? 10 : 0,
        radius,
        textStrokeColor,
        textStrokeWidth = 0,
      } = opts;

      const fontPx = 64;
      const font = `${weight} ${fontPx}px ${fontFamily}`;
      const lineH = Math.round(fontPx * 1.28);

      const measureCtx = document.createElement("canvas").getContext("2d");
      if (!measureCtx) return;
      measureCtx.font = font;
      const textW = Math.max(1, Math.ceil(measureCtx.measureText(text).width));
      const logicalW = textW + paddingX * 2;
      const logicalH = lineH + paddingY * 2;

      const dpr = 2; // supersample for crispness at small on-screen sizes
      const canvas = document.createElement("canvas");
      canvas.width = logicalW * dpr;
      canvas.height = logicalH * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      if (background) {
        drawRoundedCanvasRect(ctx, 0, 0, logicalW, logicalH, radius ?? logicalH / 2);
        ctx.fillStyle = background;
        ctx.fill();
        if (borderColor) {
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      if (textStrokeColor && textStrokeWidth > 0) {
        ctx.lineJoin = "round";
        ctx.strokeStyle = textStrokeColor;
        ctx.lineWidth = textStrokeWidth;
        ctx.strokeText(text, paddingX, logicalH / 2);
      }
      ctx.fillText(text, paddingX, logicalH / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      texture.needsUpdate = true;

      const aspect = logicalW / logicalH;
      let worldW = lineWorldH * aspect;
      let worldH = lineWorldH;
      if (worldW > maxWidth) {
        worldW = maxWidth;
        worldH = maxWidth / aspect;
      }

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH), mat);
      mesh.position.set(anchor === "left" ? x + worldW / 2 : x, y, z);
      parent.add(mesh);
    };
    // ---------------------------------------------------------------------------

    const root = new THREE.Group();
    scene.add(root);

    // --- Composition -----------------------------------------------------------
    // The book anchors the center-bottom. The lesson sheet enters top-left and
    // dives into it; the drafted card floats above-left; the devices sit right;
    // the chart + grade token rise top-right. Everything faces the camera so the
    // labels read; the rig sways rather than spins, so text never turns away.
    const book = makeBook();
    const BOOK_POS = new THREE.Vector3(0.12, -0.92, 0);
    book.group.position.copy(BOOK_POS);
    book.group.rotation.set(-0.1, 0, 0);
    root.add(book.group);

    const lesson = makeLessonSheet();
    lesson.position.set(0.1, -0.5, 0.12); // parked at the seam; applyCycle animates it
    lesson.scale.setScalar(0.2);
    lesson.visible = false;
    root.add(lesson);

    const card = makeTestCard(addLabel, { quiz: quizLabel, review: reviewLabel, approved: approvedLabel });
    const CARD_POS = new THREE.Vector3(-0.74, 1.14, 0.18);
    card.group.position.copy(CARD_POS);
    card.group.rotation.set(-0.04, 0.14, 0.02);
    card.group.scale.setScalar(0);
    root.add(card.group);

    const phone = makeDevice("phone");
    const PHONE_POS = new THREE.Vector3(2.02, -0.38, 0.35);
    phone.group.position.copy(PHONE_POS);
    phone.group.rotation.set(-0.04, -0.3, 0.05);
    root.add(phone.group);

    const tablet = makeDevice("tablet");
    const TABLET_POS = new THREE.Vector3(1.66, -1.42, 0.2);
    tablet.group.position.copy(TABLET_POS);
    tablet.group.rotation.set(-0.06, -0.2, -0.05);
    root.add(tablet.group);
    const devices = [phone, tablet];

    // Mini test sheets that arc from the approved card to each device.
    const miniPaths = devices.map((d, j) => ({
      a: new THREE.Vector3(0.08, 0.52 - j * 0.14, 0.3),
      b: new THREE.Vector3(1.2, 0.75 - j * 0.45, 0.55),
      c: d.group.position.clone().add(new THREE.Vector3(0, 0.12, 0.12)),
    }));
    const minis = devices.map(() => {
      const m = makeMiniSheet();
      m.visible = false;
      m.scale.setScalar(0.1);
      m.position.set(1.2, 0.4, 0.4); // parked mid-path; applyCycle animates it
      root.add(m);
      return m;
    });

    const chart = makePerfChart();
    const CHART_POS = new THREE.Vector3(1.26, 0.32, 0.12);
    chart.group.position.copy(CHART_POS);
    chart.group.rotation.set(-0.05, -0.12, 0);
    root.add(chart.group);

    // Grade token ("92%") + "Class average" caption near the chart's apex, and
    // a green "Graded" pill by the devices — the instant-grading confirmation.
    const gradeToken = makeToken(addLabel, "92%", {
      height: 0.42,
      textColor: WHITE_CSS,
      background: VIOLET_CSS,
      weight: 800,
    });
    gradeToken.position.set(2.34, 1.96, 0.4);
    root.add(gradeToken);

    const caption = makeToken(addLabel, averageLabel, {
      height: 0.22,
      textColor: VIOLET_DEEP_CSS,
      background: WHITE_CSS,
      weight: 700,
    });
    caption.position.set(1.8, 1.54, 0.38);
    root.add(caption);

    const gradedPill = makeToken(addLabel, gradedLabel, {
      height: 0.22,
      textColor: WHITE_CSS,
      background: SUCCESS_CSS,
      weight: 800,
    });
    gradedPill.position.set(2.36, -1.14, 0.42);
    root.add(gradedPill);

    // Draft particles — the book's "thinking": points streaming seam → card.
    const PARTICLES = 56;
    const particleSeeds = new Float32Array(PARTICLES * 2);
    for (let i = 0; i < PARTICLES; i++) {
      particleSeeds[i * 2] = Math.random();
      particleSeeds[i * 2 + 1] = Math.random() * Math.PI * 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new THREE.BufferAttribute(new Float32Array(PARTICLES * 3), 3);
    particlePos.setUsage(THREE.DynamicDrawUsage);
    particleGeo.setAttribute("position", particlePos);
    const particleMat = new THREE.PointsMaterial({
      color: VIOLET_BRIGHT,
      size: 0.105,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particles.visible = false;
    root.add(particles);
    const PARTICLE_FROM = new THREE.Vector3(0.1, -0.62, 0.2);

    // Ambient data nodes — a soft violet constellation for depth.
    type Node = { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; phase: number };
    const nodes: Node[] = [];
    const nodeDefs = [
      { x: -2.2, y: 1.3, z: 0.25, r: 0.11, c: VIOLET_LIGHT },
      { x: -1.95, y: -1.42, z: 0.3, r: 0.1, c: VIOLET_LIGHT },
      { x: 2.45, y: -0.22, z: 0.25, r: 0.1, c: VIOLET },
      { x: -0.68, y: 2.08, z: 0.3, r: 0.12, c: VIOLET },
    ];
    for (const d of nodeDefs) {
      const mat = new THREE.MeshStandardMaterial({
        color: d.c,
        roughness: 0.35,
        metalness: 0.1,
        emissive: new THREE.Color(d.c),
        emissiveIntensity: 0.7,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(d.r, 20, 20), mat);
      mesh.position.set(d.x, d.y, d.z);
      root.add(mesh);
      nodes.push({ mesh, mat, phase: d.x * 1.7 + d.y });
    }

    // Light threads tying the story together: book → card while drafting, and
    // each device → chart once grading feeds analytics. Endpoints are rewritten
    // every frame so the lines track the bobbing groups (cheap).
    type Thread = {
      posAttr: THREE.BufferAttribute;
      mat: THREE.LineBasicMaterial;
      from: THREE.Object3D;
      fromOffset: THREE.Vector3;
      to: THREE.Object3D;
      toOffset: THREE.Vector3;
    };
    const threads: Thread[] = [];
    const makeThread = (
      from: THREE.Object3D,
      fromOffset: THREE.Vector3,
      to: THREE.Object3D,
      toOffset: THREE.Vector3,
    ): Thread => {
      const geo = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(new Float32Array(6), 3);
      geo.setAttribute("position", posAttr);
      const mat = new THREE.LineBasicMaterial({ color: VIOLET_LIGHT, transparent: true, opacity: 0 });
      root.add(new THREE.Line(geo, mat));
      const th = { posAttr, mat, from, fromOffset, to, toOffset };
      threads.push(th);
      return th;
    };
    const bookCardThread = makeThread(
      book.group,
      new THREE.Vector3(0, 0.6, 0.1),
      card.group,
      new THREE.Vector3(0.2, -0.95, -0.05),
    );
    const deviceThreads = [
      makeThread(phone.group, new THREE.Vector3(0.1, 0.4, 0), chart.group, new THREE.Vector3(0.72, 0.55, 0)),
      makeThread(tablet.group, new THREE.Vector3(0.2, 0.25, 0), chart.group, new THREE.Vector3(0.36, 0.4, 0)),
    ];

    const tmpFrom = new THREE.Vector3();
    const tmpTo = new THREE.Vector3();
    const updateThreads = () => {
      for (const th of threads) {
        const arr = th.posAttr.array as Float32Array;
        tmpFrom.copy(th.fromOffset).applyMatrix4(th.from.matrix);
        tmpTo.copy(th.toOffset).applyMatrix4(th.to.matrix);
        arr[0] = tmpFrom.x;
        arr[1] = tmpFrom.y;
        arr[2] = tmpFrom.z;
        arr[3] = tmpTo.x;
        arr[4] = tmpTo.y;
        arr[5] = tmpTo.z;
        th.posAttr.needsUpdate = true;
      }
    };

    const baseRotY = -0.08;
    const baseRotX = 0.04;
    root.rotation.set(baseRotX, baseRotY, 0);

    // Auto-fit: scale the whole model so its projected bounding box sits inside the
    // frame with margin, evaluated at the square aspect (the tightest breakpoint).
    // Guarantees nothing is clipped at any width, with headroom for the float motion.
    const fitToFrame = (margin: number) => {
      const prevAspect = camera.aspect;
      camera.aspect = 1;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      root.scale.setScalar(1);
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const corner = new THREE.Vector3();
      let maxNdc = 0;
      for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
        corner.project(camera);
        maxNdc = Math.max(maxNdc, Math.abs(corner.x), Math.abs(corner.y));
      }
      if (maxNdc > 0) root.scale.setScalar(margin / maxNdc);
      camera.aspect = prevAspect;
      camera.updateProjectionMatrix();
    };

    // --- The story cycle -------------------------------------------------------
    // One loop: material dives into the book → particles draft the card → teacher
    // approves → minis fly to devices → timers sweep → checks + "Graded" → chart,
    // token and caption rise → hold → reset. `applyCycle(p)` is a pure function of
    // the loop phase p∈[0,1) so it is safe to evaluate at any fixed p for the
    // static/reduced-motion frame.
    const CYCLE = 12.5; // seconds
    const SETTLED_P = 0.9; // the "story complete" frame used when paused / reduced

    // Flight path of the lesson sheet: upper-left → the book's seam.
    const LESSON_A = new THREE.Vector3(-2.35, 2.2, 0.4);
    const LESSON_B = new THREE.Vector3(-1.75, 0.5, 0.3);
    const LESSON_C = new THREE.Vector3(0.1, -0.52, 0.14);

    const applyCycle = (p: number, t: number) => {
      const inReset = p >= 0.93;
      const resetT = inReset ? easeInOutCubic((p - 0.93) / 0.07) : 0;
      const settle = 1 - resetT;

      // 1) Lesson sheet flies into the seam.
      const flyT = clamp01(p / 0.155);
      const flying = p < 0.16 && !inReset;
      lesson.visible = flying;
      if (flying) {
        const e = easeInOutCubic(flyT);
        quadBezier(lesson.position, LESSON_A, LESSON_B, LESSON_C, e);
        lesson.rotation.z = -0.16 + 0.22 * e;
        lesson.rotation.y = 0.25 - 0.25 * e;
        // Shrinks as the seam swallows it.
        lesson.scale.setScalar(0.92 * (1 - 0.85 * clamp01((e - 0.78) / 0.22)));
      }

      // Seam, halo and rings flare as the sheet is absorbed.
      const flare = bell(p, 0.155, 0.06);
      book.seamMat.opacity = 0.38 + 0.62 * flare + 0.07 * Math.sin(t * 7);
      book.haloMat.opacity = 0.5 + 0.4 * flare + 0.05 * Math.sin(t * 1.8);
      book.ringMat.opacity = 0.3 + 0.4 * flare;
      book.ringMat2.opacity = 0.22 + 0.35 * flare;

      // 2) Draft particles stream seam → card while the book "thinks".
      const pEnv = clamp01((p - 0.15) / 0.04) * (1 - clamp01((p - 0.3) / 0.05));
      particles.visible = pEnv > 0.01;
      particleMat.opacity = 0.95 * pEnv;
      if (particles.visible) {
        const arr = particlePos.array as Float32Array;
        const flow = (p - 0.15) / 0.2;
        for (let i = 0; i < PARTICLES; i++) {
          const seed = particleSeeds[i * 2];
          const phase = particleSeeds[i * 2 + 1];
          const q = (seed + flow * (1.1 + seed * 0.7)) % 1;
          const spread = (1 - q) * 0.4;
          arr[i * 3] = PARTICLE_FROM.x + (CARD_POS.x - PARTICLE_FROM.x) * q + Math.sin(q * 9 + phase) * 0.14 * spread * 3;
          arr[i * 3 + 1] = PARTICLE_FROM.y + (CARD_POS.y - PARTICLE_FROM.y) * q;
          arr[i * 3 + 2] = PARTICLE_FROM.z + Math.cos(q * 7 + phase) * 0.1;
        }
        particlePos.needsUpdate = true;
      }

      // Card assembles: body scales in, rows pop one by one, review pill lands.
      const approvePunch = 1 + 0.05 * bell(p, 0.41, 0.025);
      const cardShow = easeOutBack(clamp01((p - 0.165) / 0.05)) * settle;
      card.group.scale.setScalar(Math.max(0, cardShow * approvePunch));
      card.group.visible = cardShow > 0.002;
      for (let i = 0; i < card.rows.length; i++) {
        const s = easeOutBack(clamp01((p - (0.2 + i * 0.03)) / 0.045));
        card.rows[i].scale.setScalar(s);
        card.rows[i].visible = s > 0.002;
      }

      // 3) Teacher control: "In review" flips to "Approved".
      const reviewIn = easeOutBack(clamp01((p - 0.31) / 0.05));
      const reviewOut = 1 - easeInOutCubic(clamp01((p - 0.385) / 0.03));
      const reviewS = reviewIn * reviewOut;
      card.reviewPill.scale.setScalar(Math.max(0, reviewS));
      card.reviewPill.visible = reviewS > 0.002;
      const approvedS = easeOutBack(clamp01((p - 0.4) / 0.05));
      card.approvedPill.scale.setScalar(Math.max(0, approvedS));
      card.approvedPill.visible = approvedS > 0.002;

      // Book → card thread glows while drafting and reviewing.
      bookCardThread.mat.opacity = 0.3 * clamp01((p - 0.18) / 0.05) * settle;

      // 4) Mini sheets arc to the devices; screens light up; timers sweep.
      for (let j = 0; j < devices.length; j++) {
        const d = devices[j];
        const start = 0.455 + j * 0.028;
        const mT = clamp01((p - start) / 0.085);
        const inFlight = mT > 0 && mT < 1 && !inReset;
        minis[j].visible = inFlight;
        if (inFlight) {
          const e = easeInOutCubic(mT);
          quadBezier(minis[j].position, miniPaths[j].a, miniPaths[j].b, miniPaths[j].c, e);
          minis[j].rotation.z = 0.3 - 0.5 * e;
          const grow = clamp01(mT / 0.2);
          const absorb = 1 - 0.7 * clamp01((mT - 0.82) / 0.18);
          minis[j].scale.setScalar(0.9 * grow * absorb);
        }

        // Screen pulses violet on arrival, then rows appear (idle dot bows out).
        const arrival = start + 0.085;
        d.screenMat.emissiveIntensity = 0.03 + 0.3 * bell(p, arrival, 0.03);
        const contentIn = clamp01((p - arrival) / 0.03);
        const idleS = 1 - contentIn * settle;
        d.idle.scale.setScalar(Math.max(0.001, idleS));
        d.idle.visible = idleS > 0.01;
        for (let r = 0; r < d.rows.length; r++) {
          const s = easeOutBack(clamp01((p - (arrival + 0.012 + r * 0.014)) / 0.03)) * settle;
          d.rows[r].scale.setScalar(Math.max(0, s));
          d.rows[r].visible = s > 0.002;
        }

        // Timed exam: the little timer sweeps, then fades before the check.
        const tw = clamp01((p - (0.56 + j * 0.015)) / 0.075);
        const timerAlive = clamp01((p - (0.55 + j * 0.015)) / 0.02) * (1 - clamp01((p - (0.645 + j * 0.02)) / 0.025));
        d.timerMat.opacity = 0.75 * timerAlive * settle;
        d.handMat.opacity = timerAlive * settle;
        d.hand.rotation.z = -easeInOutCubic(tw) * Math.PI * 2.5;

        // 5) Graded the moment they submit: the check pops.
        const checkS = easeOutBack(clamp01((p - (0.655 + j * 0.03)) / 0.05)) * settle;
        d.check.scale.setScalar(Math.max(0, checkS));
        d.check.visible = checkS > 0.002;
      }

      // "Graded" pill by the devices.
      const gradedS = easeOutBack(clamp01((p - 0.71) / 0.05)) * settle;
      gradedPill.scale.setScalar(Math.max(0, gradedS));
      gradedPill.visible = gradedS > 0.002;

      // Device → chart threads carry the submissions into analytics.
      for (const th of deviceThreads) th.mat.opacity = 0.32 * clamp01((p - 0.7) / 0.05) * settle;

      // Chart bars grow (slight stagger + gentle breathing), ribbon + apex follow.
      // Hidden until they start growing so no collapsed slivers float in the sky.
      const barBase = clamp01((p - 0.71) / 0.15);
      for (let i = 0; i < chart.bars.length; i++) {
        const b = chart.bars[i];
        const grow = easeOutCubic(clamp01(barBase * 1.2 - i * 0.07));
        const breathe = 0.02 * Math.sin(t * 1.5 + i) * grow;
        b.group.scale.y = Math.max(0.05, (0.05 + 0.95 * grow + breathe) * (1 - resetT * 0.95));
        b.group.visible = grow * settle > 0.01;
        b.mat.emissiveIntensity = b.baseEmissive * (0.6 + 0.4 * grow);
      }
      chart.ribbonMat.opacity = 0.9 * easeOutCubic(clamp01((p - 0.75) / 0.12)) * settle;
      const apexShow = easeOutBack(clamp01((p - 0.85) / 0.05)) * settle;
      chart.apex.scale.setScalar(Math.max(0, apexShow));
      chart.apex.visible = apexShow > 0.002;

      // Grade token + caption settle last — the story's closing beat.
      const tokenShow = easeOutBack(clamp01((p - 0.82) / 0.06)) * settle;
      gradeToken.scale.setScalar(Math.max(0, tokenShow));
      gradeToken.visible = tokenShow > 0.002;
      const capShow = easeOutBack(clamp01((p - 0.79) / 0.06)) * settle;
      caption.scale.setScalar(Math.max(0, capShow));
      caption.visible = capShow > 0.002;
    };

    // Fit after content exists, then paint the settled frame so the hero is correct
    // before any motion (and is the single frame under reduced motion / no WebGL).
    // 0.9 fills the frame while leaving headroom for sway + bob so nothing clips.
    fitToFrame(0.9);
    book.group.updateMatrix();
    card.group.updateMatrix();
    phone.group.updateMatrix();
    tablet.group.updateMatrix();
    chart.group.updateMatrix();
    applyCycle(SETTLED_P, SETTLED_P * CYCLE);
    updateThreads();

    // True only while the hero is meaningfully on-screen (maintained by the
    // observer below). The pointer handler reads it so the model never tracks the
    // cursor while the scene is scrolled out of view.
    let onScreen = false;

    const pointer = { x: 0, y: 0 };
    const REACH = 1.6;
    const onPointerMove = (e: PointerEvent) => {
      if (!onScreen) return; // scrolled away — don't chase the cursor
      const rect = container.getBoundingClientRect();
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const dist = Math.hypot(nx, ny);

      if (dist > REACH) {
        pointer.x = 0;
        pointer.y = 0;
        return;
      }
      const linear = dist <= 1 ? 1 : (REACH - dist) / (REACH - 1);
      const falloff = linear * linear;
      pointer.x = THREE.MathUtils.clamp(nx, -1, 1) * falloff;
      pointer.y = THREE.MathUtils.clamp(ny, -1, 1) * falloff;
    };
    if (!prefersReduced) window.addEventListener("pointermove", onPointerMove, { passive: true });

    const clock = new THREE.Clock();
    // Start the accumulator at the settled phase so the first animated frame flows
    // out of the static frame (settled → reset → new cycle) with no jump on load.
    let elapsed = SETTLED_P * CYCLE;
    let frame = 0;
    let running = false;

    const renderFrame = () => {
      elapsed += clock.getDelta();
      const t = elapsed;
      const p = (elapsed % CYCLE) / CYCLE;

      const targetRotY = baseRotY + pointer.x * 0.16 + Math.sin(t * 0.25) * 0.04;
      const targetRotX = baseRotX + pointer.y * 0.11;
      root.rotation.y += (targetRotY - root.rotation.y) * 0.06;
      root.rotation.x += (targetRotX - root.rotation.x) * 0.06;

      // The book breathes and sways; its orbit rings slowly counter-rotate.
      book.group.position.y = BOOK_POS.y + Math.sin(t * 0.6) * 0.05;
      book.group.rotation.y = Math.sin(t * 0.3) * 0.05;
      book.group.rotation.x = -0.1 + Math.sin(t * 0.45) * 0.02;
      book.ring.rotation.z = t * 0.25;
      book.ring2.rotation.z = -t * 0.4;
      book.group.updateMatrix();

      // Card, devices and chart drift on their own subtle bobs.
      card.group.position.y = CARD_POS.y + Math.sin(t * 0.7 + 0.4) * 0.06;
      card.group.rotation.y = 0.14 + Math.sin(t * 0.34) * 0.04;
      card.group.updateMatrix();
      phone.group.position.y = PHONE_POS.y + Math.sin(t * 0.75 + 1.7) * 0.05;
      phone.group.updateMatrix();
      tablet.group.position.y = TABLET_POS.y + Math.sin(t * 0.7 + 2.6) * 0.04;
      tablet.group.updateMatrix();
      chart.group.position.y = CHART_POS.y + Math.sin(t * 0.6 + 1.2) * 0.05;
      chart.group.updateMatrix();
      gradeToken.position.y = 1.96 + Math.sin(t * 0.8 + 0.6) * 0.06;
      caption.position.y = 1.54 + Math.sin(t * 0.8 + 1.1) * 0.05;

      applyCycle(p, t);

      // AI sparks twinkle on the drafted rows.
      for (let i = 0; i < card.sparks.length; i++) {
        const s = card.sparks[i];
        s.rotation.y = t * 1.4 + i;
        s.rotation.z = t * 0.9 + i * 0.7;
      }

      for (const n of nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + n.phase);
        n.mesh.scale.setScalar(0.85 + pulse * 0.4);
        n.mat.emissiveIntensity = 0.5 + pulse * 0.7;
      }

      updateThreads();

      renderer.render(scene, camera);
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
          if (!onScreen) {
            pointer.x = 0;
            pointer.y = 0;
          }
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
  }, [quizLabel, reviewLabel, approvedLabel, gradedLabel, averageLabel]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
