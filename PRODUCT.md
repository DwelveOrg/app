# Product

## Register

product

## Users

Schools and private learning centers in Uzbekistan and the wider CIS region — administrators, teachers, and students. Admins set up an organization and its classes; teachers author tests and review results; students take tests and track their performance. Users are in a task-focused workflow (creating, grading, or reviewing academic work), often on modest hardware and in one of three languages (English, Russian, Uzbek Latin).

## Product Purpose

Dwelve (`gf-frontend`) is a digital academic testing and performance-management platform: test creation, submission, automated grading, and student/class analytics. Success is teachers spending less time grading and more time teaching, and administrators getting trustworthy performance data. The interface should disappear into the task.

## Brand Personality

Structured, academic, modern, quietly premium. Two accents carry the whole system:
**violet is identity** (the logo, the wordmark, the auth panel, the landing bloom) and
**teal is action** (buttons, selection, focus, active navigation, primary data). Surfaces are calm
and tactile — warm paper under cool ink in light, a cool near-black under warmer accents in dark.
Confident and legible, never flashy.

## Anti-references

- Generic SaaS "bright blue + rainbow gradient" dashboards. No multi-hue decorative palettes; the
  only blue in the system is semantic Info, and category tints come from the chart ramp, not from
  raw Tailwind hues.
- Violet used as an action colour. Violet says *this is Dwelve*, never *click this*. If a violet
  thing is clickable, it is wrong.
- Glassmorphism as a default surface. Blur is for genuinely floating chrome (a sticky action bar,
  a scrolled nav) — never for ordinary panels.
- Ad-hoc hex colours, one-off `shadow-[…]` values, and arbitrary `text-[Npx]` sizes in components.
  Colour comes from the tokens in `globals.css`, elevation from `shadow-elev-*`, type from the
  `type-*` utilities.
- Nested cards. A bordered box inside a bordered box inside a bordered box is a hierarchy failure,
  not depth.

## Design Principles

- **One palette, everywhere.** Logo, marketing, and product UI share the token system. No component
  invents its own hex.
- **Depth is real, and it is cheap.** Surfaces sit above the canvas and carry `shadow-elev-1/2`.
  Elevation separates layers; hairline borders define edges. Neither is decoration, and levels are
  earned — most of a page lives at elevation 1.
- **Accent means action.** Teal `--primary` marks primary actions, current selection, and state.
  Inactive things are never fully saturated.
- **Everything you can touch responds.** Every interactive surface has default, hover, focus,
  active, disabled, and loading. The `interactive` / `interactive-flat` utilities are the single
  tactile recipe — lift on hover, settle on press — so the whole product presses the same way.
- **Motion conveys state, not personality.** 120–260ms. No page-load choreography: the app loads
  into a task.
- **Consistency over surprise.** The same button, card, and row vocabulary screen to screen. Delight
  is reserved for moments (empty-state artwork, the landing hero), not every surface.
- **Trilingual by default.** Every text surface must hold English, Russian, and Uzbek Latin
  (including U+02BB `ʻ`).

## Accessibility & Inclusion

WCAG AA for text contrast. Body text ≥ 4.5:1, large/bold text ≥ 3:1. Never signal correct/incorrect by color alone — pair success/danger with an icon or label. Respect `prefers-reduced-motion`. Dark mode is a first-class theme via the `.dark` class strategy.
