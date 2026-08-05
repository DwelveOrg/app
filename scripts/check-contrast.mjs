#!/usr/bin/env node
/**
 * WCAG contrast gate for Dwelve's token layer.
 * Parses the `:root` and `.dark` blocks of src/app/globals.css and asserts a
 * ratio for every foreground/background pair the design system relies on.
 *
 * Usage: node contrast.mjs [path/to/globals.css]
 */
import { readFileSync } from "node:fs";

const cssPath = process.argv[2] ?? new URL("../src/app/globals.css", import.meta.url).pathname;

const css = readFileSync(cssPath, "utf8");

function block(selector) {
  // Match `selector {` up to the matching close brace at column 0.
  const re = new RegExp(`(^|\\n)${selector}\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const m = css.match(re);
  if (!m) throw new Error(`Could not find "${selector}" block in ${cssPath}`);
  const vars = {};
  for (const line of m[2].split("\n")) {
    const v = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/i);
    if (v) vars[v[1]] = v[2].trim();
  }
  return vars;
}

/** Resolve `var(--x)` aliases down to a literal, so `--success-text: var(--success)` still checks. */
function resolve(vars) {
  const out = { ...vars };
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (const [k, v] of Object.entries(out)) {
      const m = typeof v === "string" && v.match(/^var\((--[a-z0-9-]+)\)$/i);
      if (m && out[m[1]] && out[m[1]] !== v) {
        out[k] = out[m[1]];
        changed = true;
      }
    }
    if (!changed) break;
  }
  return out;
}

const light = resolve(block(":root"));
const dark = resolve({ ...block(":root"), ...block("\\.dark") });

/* ---------------------------------------------------------------------------
   Colour parsing.

   This gate MUST understand every notation the token layer is allowed to use.
   A parser that silently returns null for a format we actually ship turns the
   whole gate into a no-op, because an unparseable pair is reported as SKIP and
   skips are counted as failures below — noisy on purpose, never silent.

   Supported: #rgb, #rrggbb, oklch(L C H[ / a]), rgb()/rgba().
   ------------------------------------------------------------------------- */

/** OKLCH → linear sRGB. Björn Ottosson's matrices. */
function oklchToLinearRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** linear sRGB → OKLab → OKLCH. Used by the hue guard, which needs real chroma. */
function linearRgbToOklch([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C: Math.hypot(A, B), h };
}

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** Any supported notation → linear-light sRGB triple, or null. */
function toLinearRgb(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();

  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [0, 2, 4].map((i) => srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255));
  }

  const oklch = v.match(
    /^oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+)(?:deg)?\s*(?:\/\s*[0-9.]+%?\s*)?\)$/i,
  );
  if (oklch) {
    const L = oklch[1].endsWith("%") ? parseFloat(oklch[1]) / 100 : parseFloat(oklch[1]);
    // Chroma may be written as a percentage of the 0.4 reference range.
    const C = oklch[2].endsWith("%") ? (parseFloat(oklch[2]) / 100) * 0.4 : parseFloat(oklch[2]);
    return oklchToLinearRgb(L, C, parseFloat(oklch[3]));
  }

  const rgb = v.match(/^rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/i);
  if (rgb) return [1, 2, 3].map((i) => srgbToLinear(parseFloat(rgb[i]) / 255));

  return null;
}

function luminance(value) {
  const lin = toLinearRgb(value);
  if (!lin) return null;
  // Out-of-gamut OKLCH can land slightly outside [0,1]; clamp as a display would.
  const [r, g, b] = lin.map((c) => Math.min(1, Math.max(0, c)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  if (a === null || b === null) return null;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * [ foreground token, background token, minimum ratio, label ]
 * 4.5 = normal body text · 3.0 = large/bold text, icons, UI boundaries
 */
const CHECKS = [
  ["--foreground", "--background", 4.5, "body text on canvas"],
  ["--foreground", "--card", 4.5, "body text on card"],
  ["--foreground", "--popover", 4.5, "body text on popover"],
  ["--foreground", "--muted", 4.5, "body text on muted fill"],
  ["--foreground", "--sidebar", 4.5, "body text on sidebar"],
  ["--muted-foreground", "--background", 4.5, "muted text on canvas"],
  ["--muted-foreground", "--card", 4.5, "muted text on card"],
  ["--muted-foreground", "--muted", 4.5, "muted text on muted fill"],
  ["--muted-foreground", "--sidebar", 4.5, "muted text on sidebar"],
  ["--card-foreground", "--card", 4.5, "card text on card"],
  ["--popover-foreground", "--popover", 4.5, "popover text on popover"],
  ["--sidebar-foreground", "--sidebar", 4.5, "sidebar text on sidebar"],

  ["--primary-foreground", "--primary", 4.5, "button label on primary"],
  ["--primary", "--background", 4.5, "primary as text on canvas"],
  ["--primary", "--card", 4.5, "primary as text on card"],
  ["--primary-hover", "--background", 4.5, "primary-hover as text on canvas"],
  ["--accent-foreground", "--accent", 4.5, "accent text on accent tint"],
  ["--secondary-foreground", "--secondary", 4.5, "secondary text on secondary"],

  ["--destructive-foreground", "--destructive", 4.5, "label on destructive fill"],
  ["--success-foreground", "--success", 4.5, "label on success fill"],
  ["--warning-foreground", "--warning", 4.5, "label on warning fill"],
  ["--info-foreground", "--info", 4.5, "label on info fill"],

  // The v2 `-text` aliases are gone (zero consumers); these assert the fills
  // themselves, which is what the aliases resolved to anyway.
  ["--destructive", "--background", 4.5, "destructive as text on canvas"],
  ["--destructive", "--card", 4.5, "destructive as text on card"],
  ["--success", "--background", 4.5, "success as text on canvas"],
  ["--success", "--card", 4.5, "success as text on card"],
  ["--warning", "--background", 4.5, "warning as text on canvas"],
  ["--warning", "--card", 4.5, "warning as text on card"],
  ["--info", "--background", 4.5, "info as text on canvas"],
  ["--info", "--card", 4.5, "info as text on card"],

  ["--brand", "--background", 3.0, "brand violet as large accent on canvas"],
  ["--ring", "--background", 3.0, "focus ring against canvas"],
  ["--ring", "--card", 3.0, "focus ring against card"],
  // The sidebar is where focus rings actually land on the nav rows, and it is a
  // different surface from both the canvas and the card. v2 never checked it.
  ["--ring", "--sidebar", 3.0, "focus ring against sidebar"],
  ["--ring", "--muted", 3.0, "focus ring against muted fill"],
  ["--border", "--card", 1.2, "hairline visible on card"],
  ["--border", "--background", 1.2, "hairline visible on canvas"],

  ["--chart-1", "--card", 3.0, "chart 1 on card"],
  ["--chart-2", "--card", 3.0, "chart 2 on card"],
  ["--chart-3", "--card", 3.0, "chart 3 on card"],
  ["--chart-4", "--card", 3.0, "chart 4 on card"],
  // chart-5 was defined, mapped, and never asserted.
  ["--chart-5", "--card", 3.0, "chart 5 on card"],

  // Ramp-as-label (seeded avatars, category chips): ramp-coloured text on a wash
  // of its own hue. Real text, so 4.5 — the 3.0 mark checks above do not cover it.
  ["--chart-1-ink", "--chart-1-tint", 4.5, "ramp 1 as text on its tint"],
  ["--chart-2-ink", "--chart-2-tint", 4.5, "ramp 2 as text on its tint"],
  ["--chart-3-ink", "--chart-3-tint", 4.5, "ramp 3 as text on its tint"],
  ["--chart-4-ink", "--chart-4-tint", 4.5, "ramp 4 as text on its tint"],
  ["--chart-5-ink", "--chart-5-tint", 4.5, "ramp 5 as text on its tint"],

  ["--selection-foreground", "--selection", 4.5, "selected text"],
];

/**
 * Hue separation guards — colours that must never be confusable.
 *
 * Measured in OKLCH, not HSL. HSL hue is chroma-blind: it reports a confident
 * angle for a colour with no perceivable hue at all, so an ink-black primary
 * would "fail" against blue at 22° while a pure grey "passes" at 218°. That is
 * rating how much blue is in your near-black, not whether two marks can be
 * mistaken for each other.
 *
 * Below NEUTRAL_C a colour reads as grey and cannot be confused with any hue,
 * so the guard does not apply rather than passing or failing on noise.
 */
const NEUTRAL_C = 0.04;

function hueOf(value) {
  const lin = toLinearRgb(value);
  if (!lin) return null;
  const { C, h } = linearRgbToOklch(lin);
  return { chroma: C, hue: h, neutral: C < NEUTRAL_C };
}

const HUE_GUARDS = [
  ["--primary", "--success", 30, "action teal vs correct-answer green"],
  ["--success", "--destructive", 60, "correct vs incorrect"],
  ["--primary", "--info", 25, "action vs informational"],
];

let failures = 0;
let unchecked = 0;
let notApplicable = 0;

/**
 * A check that could not run is a FAILURE, not a shrug.
 *
 * This previously printed SKIP and continued, and `skipped` never reached the
 * exit code — so expressing the identical palette in a notation the parser did
 * not understand produced "all checks passed" and exit 0 while asserting
 * nothing. A gate that cannot tell you it stopped working is worse than no gate.
 */
function unableToCheck(label, reason) {
  console.log(`  \x1b[31mUNCHECKED\x1b[0m ${label} — ${reason}`);
  unchecked++;
  failures++;
}

for (const [name, vars] of [
  ["LIGHT", light],
  ["DARK", dark],
]) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
  for (const [fgTok, bgTok, min, label] of CHECKS) {
    const fg = vars[fgTok];
    const bg = vars[bgTok];
    if (!fg || !bg) {
      unableToCheck(label, `missing token ${!fg ? fgTok : bgTok}`);
      continue;
    }
    const r = ratio(fg, bg);
    if (r === null) {
      const bad = luminance(fg) === null ? `${fgTok}: ${fg}` : `${bgTok}: ${bg}`;
      unableToCheck(label, `unparseable colour (${bad})`);
      continue;
    }
    const ok = r >= min;
    if (!ok) failures++;
    const tag = ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    console.log(
      `  ${tag} ${r.toFixed(2).padStart(5)}:1 (min ${min})  ${label}` +
        `  \x1b[90m${fgTok} ${fg} on ${bgTok} ${bg}\x1b[0m`,
    );
  }

  for (const [aTok, bTok, minDeg, label] of HUE_GUARDS) {
    const a = vars[aTok];
    const b = vars[bTok];
    if (!a || !b) {
      unableToCheck(label, `missing token ${!a ? aTok : bTok}`);
      continue;
    }
    const ha = hueOf(a);
    const hb = hueOf(b);
    if (!ha || !hb) {
      unableToCheck(label, `unparseable colour (${!ha ? `${aTok}: ${a}` : `${bTok}: ${b}`})`);
      continue;
    }
    // A near-neutral colour reads as grey; there is no hue to confuse.
    if (ha.neutral || hb.neutral) {
      const which = ha.neutral ? aTok : bTok;
      console.log(
        `  \x1b[90mN/A \x1b[0m       ${label}` +
          `  \x1b[90m${which} is achromatic (C ${(ha.neutral ? ha : hb).chroma.toFixed(3)} < ${NEUTRAL_C})\x1b[0m`,
      );
      notApplicable++;
      continue;
    }
    let d = Math.abs(ha.hue - hb.hue);
    if (d > 180) d = 360 - d;
    const ok = d >= minDeg;
    if (!ok) failures++;
    const tag = ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    console.log(
      `  ${tag} ${d.toFixed(0).padStart(5)}° (min ${minDeg}°) ${label}` +
        `  \x1b[90m${aTok} ${a} vs ${bTok} ${b}\x1b[0m`,
    );
  }
}

const summary =
  failures === 0
    ? "\x1b[32m✓ all checks passed"
    : `\x1b[31m✗ ${failures} failure(s)${unchecked ? ` — ${unchecked} could not be checked` : ""}`;
console.log(`\n${summary}\x1b[0m` + (notApplicable ? ` \x1b[90m(${notApplicable} n/a)\x1b[0m` : ""));
process.exit(failures === 0 ? 0 : 1);
