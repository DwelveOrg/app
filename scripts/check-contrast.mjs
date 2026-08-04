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

function toRgb(hex) {
  const h = hex.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
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

  ["--destructive-text", "--background", 4.5, "destructive as text on canvas"],
  ["--destructive-text", "--card", 4.5, "destructive as text on card"],
  ["--success-text", "--background", 4.5, "success as text on canvas"],
  ["--success-text", "--card", 4.5, "success as text on card"],
  ["--warning-text", "--background", 4.5, "warning as text on canvas"],
  ["--warning-text", "--card", 4.5, "warning as text on card"],
  ["--info-text", "--background", 4.5, "info as text on canvas"],
  ["--info-text", "--card", 4.5, "info as text on card"],

  ["--brand", "--background", 3.0, "brand violet as large accent on canvas"],
  ["--ring", "--background", 3.0, "focus ring against canvas"],
  ["--ring", "--card", 3.0, "focus ring against card"],
  ["--border", "--card", 1.2, "hairline visible on card"],
  ["--border", "--background", 1.2, "hairline visible on canvas"],

  ["--chart-1", "--card", 3.0, "chart 1 on card"],
  ["--chart-2", "--card", 3.0, "chart 2 on card"],
  ["--chart-3", "--card", 3.0, "chart 3 on card"],
  ["--chart-4", "--card", 3.0, "chart 4 on card"],

  // Ramp-as-label (seeded avatars, category chips): ramp-coloured text on a wash
  // of its own hue. Real text, so 4.5 — the 3.0 mark checks above do not cover it.
  ["--chart-1-ink", "--chart-1-tint", 4.5, "ramp 1 as text on its tint"],
  ["--chart-2-ink", "--chart-2-tint", 4.5, "ramp 2 as text on its tint"],
  ["--chart-3-ink", "--chart-3-tint", 4.5, "ramp 3 as text on its tint"],
  ["--chart-4-ink", "--chart-4-tint", 4.5, "ramp 4 as text on its tint"],
  ["--chart-5-ink", "--chart-5-tint", 4.5, "ramp 5 as text on its tint"],

  ["--selection-foreground", "--selection", 4.5, "selected text"],
];

/** Hue separation guards — colours that must never be confusable. */
function hue(hex) {
  const [r, g, b] = toRgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

const HUE_GUARDS = [
  ["--primary", "--success", 30, "action teal vs correct-answer green"],
  ["--success", "--destructive", 60, "correct vs incorrect"],
  ["--primary", "--info", 25, "action vs informational"],
];

let failures = 0;
let skipped = 0;

for (const [name, vars] of [
  ["LIGHT", light],
  ["DARK", dark],
]) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
  for (const [fgTok, bgTok, min, label] of CHECKS) {
    const fg = vars[fgTok];
    const bg = vars[bgTok];
    if (!fg || !bg) {
      console.log(`  \x1b[90mSKIP\x1b[0m ${label} — missing ${!fg ? fgTok : bgTok}`);
      skipped++;
      continue;
    }
    const r = ratio(fg, bg);
    if (r === null) {
      console.log(`  \x1b[90mSKIP\x1b[0m ${label} — non-hex (${fg} / ${bg})`);
      skipped++;
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
    if (!a || !b || !toRgb(a) || !toRgb(b)) {
      skipped++;
      continue;
    }
    let d = Math.abs(hue(a) - hue(b));
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

console.log(
  `\n${failures === 0 ? "\x1b[32m✓ all checks passed" : `\x1b[31m✗ ${failures} failure(s)`}\x1b[0m` +
    (skipped ? ` \x1b[90m(${skipped} skipped)\x1b[0m` : ""),
);
process.exit(failures === 0 ? 0 : 1);
