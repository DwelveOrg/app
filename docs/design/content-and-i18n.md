# Dwelve — Content and Internationalization

Status: v1 · Last updated: 11 August 2026

Dwelve ships in **English**, **Russian**, and **Uzbek Latin** simultaneously. There is no "add the
other languages later" phase — a string that exists in one catalog and not the others is a bug the
build will not catch.

This file covers copy voice, translation-key conventions, the catalog contract, and the formatting
rules for dates, numbers, and names.

**Related:** [accessibility.md](./accessibility.md) · [design-system.md](./design-system.md) §1
(multilingual rule), §2 (typography) · [component-library.md](./component-library.md)

---

## 1. Setup

| Thing | Where |
|---|---|
| i18next init | `src/i18n/index.ts` (client-only, guarded by `isInitialized`) |
| Language list, default, resource map | `src/i18n/resources.ts` |
| Catalogs | `src/i18n/messages/{en,ru,uz}.ts` |
| Language persistence | `localStorage["gf-language"]`, synced in `src/app/providers.tsx` |
| `<html lang>` sync | `providers.tsx`, on every `languageChanged` |
| Switcher | `LanguageSegment` in the profile preferences tab |

Supported: `en` (default) · `ru` · `uz`. Fallback is `en`. Interpolation escaping is **off**
(`escapeValue: false`) because React already escapes.

i18n is **client-side**. Server components have no `t` in scope. That is why `ResourceStateView`
takes translation *keys* and `ConfirmDialog` takes rendered *strings* — the seam is different for
each, and both choices are deliberate.

---

## 2. The three-catalog rule

**Every new key lands in all three catalogs in the same change.** No English placeholders, no
"TODO: translate", no key that resolves in one language and falls back in two.

The catalogs are ~2,800 lines each and structurally identical. Keep them that way:

- Same key, same nesting, same order in all three files.
- Add the key in the same position in each file, so a diff of `en.ts` against `ru.ts` stays readable.
- If you cannot produce a real translation, that is a reason to ask — not a reason to ship English
  into `ru.ts`.

---

## 3. Key naming

Keys are dotted paths mirroring where the copy appears. The top-level namespaces:

| Namespace | Covers |
|---|---|
| `language` | The language names themselves |
| `root` | Everything in the authenticated shell, keyed by page: `root.dashboard`, `root.classes`, `root.classDetail`, `root.school`, `root.notifications`, `root.profile`, `root.tests` … |
| `tests` | Shared test vocabulary |
| `exam` | The exam room |
| `sidebar` | Nav labels |
| `landing` | Marketing site |
| `auth` | Login, signup, reset |

Within a page namespace, the recurring shapes:

```ts
root: {
  classDetail: {
    title: "…",
    subtitle: "…",
    back: "…",
    actions: { edit: "…", delete: "…" },     // buttons
    fields:  { name: { label: "…", placeholder: "…", hint: "…" } },
    states:  { forbidden: { title: "…", description: "…" },
               notFound:  { title: "…", description: "…" },
               error:     { title: "…", description: "…" },
               retry: "…" },
    toast:   { success: "…", error: "…" },
  },
}
```

Conventions:

- `title` / `subtitle` / `description` for headings and supporting copy.
- `actions.*` for buttons, `fields.*.{label,placeholder,hint}` for form controls.
- `states.<reason>.{title,description}` — **this shape is required** by `ResourceStateView`, which
  reads `${namespace}.states.${reason}.title`.
- `toast.*` for transient messages.
- `empty.*` for empty states.
- camelCase segments. No spaces, no dots inside a segment.

**Never build a key from a template literal** in component code. Search-and-replace and
"where is this string used" both depend on keys being greppable literals.

---

## 4. Interpolation and plurals

### Interpolation

```ts
welcome: "Welcome back, {{name}}",
progress: "{{done}} of {{total}} done",
```

```tsx
t("root.dashboard.welcome", { name: user.fullName })
```

Rules:

- Never concatenate translated fragments. `t("a") + " " + name` produces broken word order in
  Russian, which does not follow English's.
- Never put markup in a value. If a sentence needs a link inside it, split the layout, not the
  sentence — or use a `<Trans>` component if one is introduced (none is today).
- Name the placeholder for what it *is* (`{{school}}`, `{{count}}`), not where it goes.

### Plurals

i18next suffix plurals, driven by a `count` option:

```ts
// en.ts — 2 forms
questionCount_one:   "{{count}} question",
questionCount_other: "{{count}} questions",

// ru.ts — 4 forms, and all four are required
questionCount_one:   "{{count}} вопрос",
questionCount_few:   "{{count}} вопроса",
questionCount_many:  "{{count}} вопросов",
questionCount_other: "{{count}} вопросов",
```

```tsx
t("root.tests.questionCount", { count: questions.length })
```

**Russian needs `_one` / `_few` / `_many` / `_other`.** Supplying only `_one` / `_other` is the most
common i18n defect in this codebase's shape, and it produces grammatically wrong counts for most
numbers. Uzbek uses `_one` / `_other`.

Anything that renders a number followed by a noun is a plural key. "3 students", "1 point",
"12 min" — all of them.

---

## 5. Dates, times, numbers, names

Never hand-translate a formatted value. Every one of these has a locale-aware path:

| Value | Use |
|---|---|
| "2 hours ago" | `<RelativeTime date={…} />` (or `formatRelativeTime` from `@/lib/datetime`) |
| An absolute date/time | `Intl.DateTimeFormat(language, …)`, or `formatDateTime` in `studio/_lib/datetime.ts` |
| A datetime-local input value | `toLocalInputValue` / `toIsoOrNull` in `studio/_lib/datetime.ts` |
| Numbers in a fixed-width slot | `tabular-nums` (what `Badge shape="count"` does) |
| Initials | `getInitials` in `@/lib/utils` — takes whole code points, so surrogate pairs and combining marks don't get sliced into broken glyphs |

`formatRelativeTime` maps the i18n language onto a `date-fns` locale (`enUS` / `ru` / `uz`). It
replaced frozen hand-translated timestamp strings that used to sit in the catalogs — don't
reintroduce them.

`RelativeTime` carries `suppressHydrationWarning` because the SSR pass and the first client tick
legitimately differ. That is correct and specific to this component; don't copy the attribute
elsewhere to silence a real mismatch.

**People's names are data, not copy.** Never uppercase, truncate, or transliterate them. Never
assume a two-part name. `Avatar` handles one-word and multi-word names alike.

---

## 6. Script and typography constraints

From design-system §1 and §2, restated because they are content rules as much as design ones:

- **Manrope is the only font in the authenticated app**, and it carries latin, latin-ext, and
  cyrillic. Everything — headings, tables, student names, answers — is Manrope.
- **DM Serif Display is Latin-only marketing display.** It must never render Russian, Uzbek names,
  user-generated content, dashboard UI, table data, badges, inputs, or report-card names. It is
  allowed in exactly two places: the landing display headings and the auth panel headline.
- **Uzbek Latin uses the turned comma U+02BB `ʻ`** for `oʻ` and `gʻ` — never a straight apostrophe
  `'` and never a right single quote `'`. The `uz` catalog has 781 correct instances and zero
  straight-apostrophe violations; keep it that way.

Test strings to paste into any component that renders user text:

```
Ольга
Gʻulom
Oʻqituvchi
Student answer: Photosynthesis
```

**Length is a layout constraint.** Russian runs roughly 15–30% longer than English and Uzbek
compounds words. A row that fits in English at 375px may not in Russian. This is why `PageHeader`
and `EntityHeader` titles wrap rather than truncate, and why every grid child holding user text
needs `min-w-0`.

---

## 7. Voice

Dwelve talks to teachers and students mid-task, not to a marketing audience.

- **Say what happened and what to do.** "This page didn't load. Trying again often fixes it — if it
  keeps happening, the problem is on our side."
- **Plain, short, specific.** Prefer "Delete *IELTS Practice 1*?" over "Are you sure you want to
  proceed?".
- **No blame.** "That link does not lead anywhere," not "You entered an invalid URL."
- **No exclamation marks**, no jokes in error states, no "Oops".
- **Buttons are verbs**: "Create class", "Send invite", "Delete test". Not "OK", "Submit", "Yes".
- **Empty states teach.** Title says what's missing, description says why it matters, the action
  says what to do.
- **Don't promise what you don't know.** "Saved" appears only after the server acknowledged the
  write.
- Sentence case for everything except the `type-micro` eyebrows and badges, which are uppercase by
  the utility — don't uppercase in the catalog string.

The English catalog is the reference voice; `ru` and `uz` should read as naturally in their own
language, not as literal English.

---

## 8. What is *not* translated

- **Product name.** `BRAND_NAME` in `src/constants/brand.ts` — import it, don't type "Dwelve".
- **User-generated content**: names, class titles, question text, answers.
- **Codes and identifiers**: join codes, invite tokens, ids.
- **Log output and `console.error` messages.**
- **`global-error.tsx`** — it replaces the whole document and cannot mount i18n, so it is
  English-only by necessity. This is the one deliberate exception.

---

## 9. Adding copy — checklist

- [ ] Key added to `en.ts`, `ru.ts`, **and** `uz.ts`, in the same position
- [ ] Key path mirrors the page/namespace it appears in
- [ ] Plural keys carry all four Russian forms
- [ ] Interpolation used instead of concatenation
- [ ] No literal string left in JSX (`t("…")` everywhere)
- [ ] Dates/relative times go through the helpers, not the catalog
- [ ] Uzbek uses `ʻ` (U+02BB)
- [ ] Screen walked in `ru` and `uz` — no clipping, no overflow, no wrapping that breaks a row
- [ ] Nothing user-generated rendered in the display serif

Grep for regressions:

```sh
# keys present in en but missing in ru / uz — compare the shapes
diff <(grep -oE '^\s+[a-zA-Z_]+:' src/i18n/messages/en.ts) \
     <(grep -oE '^\s+[a-zA-Z_]+:' src/i18n/messages/ru.ts) | head

# straight apostrophes where Uzbek needs U+02BB
grep -nE "[ogOG]'" src/i18n/messages/uz.ts

# catalogs should stay roughly the same length
wc -l src/i18n/messages/*.ts
```
