# Dwelve Brand Assets

Status: draft
Last updated: 17 June 2026

This file is the asset inventory for the Dwelve logo package. Design decisions still live in [design-system.md](./design-system.md); this file names the actual files to use in code, metadata, and external exports.

All files below live under `public/`, so app URLs omit the `public` segment. For example, `public/dwelve_web_logo_assets/logos/dwelve-logo-horizontal.svg` is served as `/dwelve_web_logo_assets/logos/dwelve-logo-horizontal.svg`.

## Canonical Source

| Use | Repository path | Served URL |
|---|---|---|
| Master logo source | `public/dwelve_web_logo_assets/source/dwelve-logo-master.svg` | `/dwelve_web_logo_assets/source/dwelve-logo-master.svg` |
| Color palette reference | `public/images/dwelve-color-palette.png` | `/images/dwelve-color-palette.png` |

Use the master SVG as the reference for logo shape, spacing, and color. Do not redraw or re-cut the wordmark from a live font unless the design system is intentionally updated.

> **The `DwelveLogo` wordmark is live text, and this rule applies to it.** It is set in **Manrope 700** via the `font-wordmark` token (`BRAND_WORDMARK_CLASSES` in `src/constants/brand.ts`), *not* `font-sans`, because it sits beside a raster mark that CSS cannot restyle. It previously tracked `font-sans` — which meant retyping the product's UI face silently re-cut the wordmark next to an unchanged icon. Changing the UI font must not change this one.

## SVG Logo Variants

Prefer SVG for UI, website chrome, marketing pages, and any place the logo can remain vector.

| Variant | Repository path | Served URL | Use |
|---|---|---|---|
| Horizontal light | `public/dwelve_web_logo_assets/logos/dwelve-logo-horizontal.svg` | `/dwelve_web_logo_assets/logos/dwelve-logo-horizontal.svg` | Default logo on white, Mist, and other light surfaces. |
| Horizontal dark | `public/dwelve_web_logo_assets/logos/dwelve-logo-horizontal-dark.svg` | `/dwelve_web_logo_assets/logos/dwelve-logo-horizontal-dark.svg` | Logo on Ink and dark product surfaces. |
| Icon light | `public/dwelve_web_logo_assets/logos/dwelve-logo-icon.svg` | `/dwelve_web_logo_assets/logos/dwelve-logo-icon.svg` | Favicons, compact navigation, app badges, square placements on light surfaces. |
| Icon dark | `public/dwelve_web_logo_assets/logos/dwelve-logo-icon-dark.svg` | `/dwelve_web_logo_assets/logos/dwelve-logo-icon-dark.svg` | Compact logo on dark surfaces. |
| Stacked | `public/dwelve_web_logo_assets/logos/dwelve-logo-stacked.svg` | `/dwelve_web_logo_assets/logos/dwelve-logo-stacked.svg` | Narrow or centered brand layouts where horizontal space is limited. |
| Wordmark | `public/dwelve_web_logo_assets/logos/dwelve-logo-wordmark.svg` | `/dwelve_web_logo_assets/logos/dwelve-logo-wordmark.svg` | Text-only brand lockup when the icon already appears nearby. |
| One-color Ink | `public/dwelve_web_logo_assets/logos/dwelve-logo-black.svg` | `/dwelve_web_logo_assets/logos/dwelve-logo-black.svg` | Monochrome use on light backgrounds. Prefer Ink over pure black in product UI. |
| One-color white | `public/dwelve_web_logo_assets/logos/dwelve-logo-white.svg` | `/dwelve_web_logo_assets/logos/dwelve-logo-white.svg` | Monochrome use on dark backgrounds. |

## PNG Exports

Use PNG only where SVG is not accepted, such as some external upload fields, email tools, or raster-only documents.

| Variant | Sizes | Repository folder | Served folder |
|---|---:|---|---|
| Horizontal light | 512, 1024, 2048 | `public/dwelve_web_logo_assets/png/` | `/dwelve_web_logo_assets/png/` |
| Horizontal dark | 512, 1024, 2048 | `public/dwelve_web_logo_assets/png/` | `/dwelve_web_logo_assets/png/` |
| Icon light | 512, 1024, 2048 | `public/dwelve_web_logo_assets/png/` | `/dwelve_web_logo_assets/png/` |
| Icon dark | 512, 1024, 2048 | `public/dwelve_web_logo_assets/png/` | `/dwelve_web_logo_assets/png/` |

Choose the smallest PNG that is at least 2x the rendered display size.

## Favicons And App Icons

| Use | Repository path | Served URL |
|---|---|---|
| SVG favicon | `public/dwelve_web_logo_assets/favicon/favicon.svg` | `/dwelve_web_logo_assets/favicon/favicon.svg` |
| ICO favicon | `public/dwelve_web_logo_assets/favicon/favicon.ico` | `/dwelve_web_logo_assets/favicon/favicon.ico` |
| 16 px favicon | `public/dwelve_web_logo_assets/favicon/favicon-16x16.png` | `/dwelve_web_logo_assets/favicon/favicon-16x16.png` |
| 32 px favicon | `public/dwelve_web_logo_assets/favicon/favicon-32x32.png` | `/dwelve_web_logo_assets/favicon/favicon-32x32.png` |
| 48 px favicon | `public/dwelve_web_logo_assets/favicon/favicon-48x48.png` | `/dwelve_web_logo_assets/favicon/favicon-48x48.png` |
| Apple touch icon | `public/dwelve_web_logo_assets/app-icons/apple-touch-icon.png` | `/dwelve_web_logo_assets/app-icons/apple-touch-icon.png` |
| PWA icon 192 | `public/dwelve_web_logo_assets/app-icons/icon-192.png` | `/dwelve_web_logo_assets/app-icons/icon-192.png` |
| PWA icon 512 | `public/dwelve_web_logo_assets/app-icons/icon-512.png` | `/dwelve_web_logo_assets/app-icons/icon-512.png` |

The top-level icon files in `public/dwelve_web_logo_assets/` duplicate these favicon, app-icon, and social assets for compatibility. Prefer the foldered paths above in new code so the asset role is obvious.

## Social Images

| Use | Repository path | Served URL | Dimensions |
|---|---|---|---|
| Open Graph image | `public/dwelve_web_logo_assets/social/og-image.png` | `/dwelve_web_logo_assets/social/og-image.png` | 1200 x 630 |
| Twitter/X card | `public/dwelve_web_logo_assets/social/twitter-card.png` | `/dwelve_web_logo_assets/social/twitter-card.png` | 1200 x 675 |

Use these in metadata previews unless a route needs a custom page-specific image.

## Usage Rules

- Keep the horizontal light logo as the default brand mark for light pages.
- Use the dark logo only on dark backgrounds where the Ink wordmark would fail contrast.
- Use icon-only assets only where the wordmark would be too small or redundant.
- Preserve the violet book-page gradient from `#8E78FF` to `#6A4FF0`.
- Do not recolor the wordmark independently of the icon.
- Do not use the legacy `public/images/logo-black.png` or `public/images/logo-white.png` for new work; keep them only for existing references until they are migrated.
