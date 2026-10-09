---
name: Delacour UI docs
description: A graphite instrument panel for a component library — greyscale, hairline-ruled, set entirely in mono, headings included.
colors:
  page-dark: "oklch(0.188 0 0)"
  page-light: "oklch(1 0 0)"
  surface-dark: "oklch(0.204 0 0)"
  surface-light: "oklch(1 0 0)"
  tray-dark: "oklch(0.226 0 0)"
  tray-light: "oklch(0.968 0 0)"
  hairline-dark: "oklch(1 0 0 / 10%)"
  hairline-light: "oklch(0 0 0 / 12%)"
  ink-dark: "oklch(0.97 0 0)"
  ink-light: "oklch(0.269 0 0)"
  ink-muted-dark: "oklch(0.708 0 0)"
  ink-muted-light: "oklch(0.439 0 0)"
  primary-dark: "oklch(0.97 0 0)"
  primary-light: "oklch(0.269 0 0)"
  on-primary-dark: "oklch(0.269 0 0)"
  on-primary-light: "oklch(0.985 0 0)"
  error-dark: "oklch(0.704 0.191 22.216)"
  error-light: "oklch(0.637 0.237 25.331)"
  capture-dark: "oklch(0.188 0 0)"
  capture-light: "oklch(1 0 0)"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: "56px"
    letterSpacing: "0"
  headline:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "0"
  title:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "0"
  body:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "22px"
  lede:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"
  kicker:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.22em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
rounded:
  control: "0.625rem"
  tile: "0.875rem"
  card: "1.125rem"
  phone: "2.5rem"
spacing:
  section-gap: "2.5rem"
  section-sm: "4rem"
  section: "6rem"
  reading: "36rem"
  column: "48rem"
  page: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.card}"
    padding: "16px"
  tray:
    backgroundColor: "{colors.tray-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.card}"
    padding: "4px"
  preset-tile:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.tile}"
    padding: "12px"
  kicker:
    textColor: "{colors.ink-muted-dark}"
    typography: "{typography.kicker}"
  header:
    backgroundColor: "{colors.page-dark}"
    textColor: "{colors.ink-muted-dark}"
    height: "56px"
    padding: "0 24px"
---

# Design System: Delacour UI docs

## Overview

**Creative North Star: "The Instrument Panel"**

The documentation site is drawn in the design language of devl.dev — dense, calm, greyscale — and
written from its token values and density, not its source. A near-black graphite ground (white in
light), surfaces a half-step above it, hairlines drawn as alpha strokes at about 65% opacity, and
no accent colour at all: the primary is the foreground itself, so a call to action is a dark pill
on white or a light pill on graphite. Colour belongs to status and to charts, nowhere else.

The whole UI is set in JetBrains Mono, headings included, at tracking normal. Small
tracked-caps mono kickers (10px, 0.22em) open every section, label every counter and form the
docs breadcrumb. Controls are dense — h-8 in the header and the customiser, h-9 for the two calls
to action — and corners come from one 10px radius.

Surfaces carry one material: a 1px inner highlight under a very faint shadow (a bottom edge in
light, a top edge in dark), and the primary control adds a 16% inset white highlight. A *tray* is
the nested frame — a muted wrapper with a 4px inset around a rounded panel — used for the
customiser's panels, the promo cards and the component index's grid cards.

Every colour on the site is `resolveTokens(HOUSE_CONFIG)`, generated into `src/styles/house.css`
(`/theme?preset=AQgHGRkTEwPe`). The things the axes cannot express — the hairline at 65%, the
hover fills, the highlight, the ambient wash behind the page — are `color-mix()` of the tokens,
never a hex.

**Key Characteristics:**
- Dark first; light is the same system with the roles swapped.
- Greyscale. No accent; colour only for status and charts.
- JetBrains Mono for everything, headings included (600, tracking normal).
- Kickers: 10px mono caps, +0.22em, muted ink.
- Alpha hairlines at 65%; hover fills the foreground at 4–5%.
- 10px base radius; controls 1×, tiles 1.4×, cards and trays 1.8×.
- Header is a sticky frosted h-14 bar (85% page under a blur) with a tracked wordmark, a live
  component-and-category counter and a ⌘K pill.
- Motion is 150ms ease-out, press scale .97, plus the scroll reveal.

## Colors

A neutral ramp from the design system's `graphite` base; the `graphite` theme maps the primary to
the foreground.

### Primary
- **Primary** (`{colors.primary-dark}` / `{colors.primary-light}`): the primary control, the
  active tab underline, the selected customiser tile's ring, the caret. It is the ink colour.
- **On Primary** (`{colors.on-primary-dark}` / `{colors.on-primary-light}`): the only text set on
  the primary control.

### Neutral
- **Page** (`{colors.page-dark}` / `{colors.page-light}`): the ground.
- **Surface** (`{colors.surface-dark}` / `{colors.surface-light}`): cards, popovers, the phone
  bezel, the docs sidebar's inner panel sits on a 1.5% foreground fill instead.
- **Tray** (`{colors.tray-dark}` / `{colors.tray-light}`, at 72%): the nested frame.
- **Hairline** (`{colors.hairline-dark}` / `{colors.hairline-light}`, drawn at 65%): every border,
  and the divider between rows.
- **Ink** / **Ink Muted**: headings and body; ledes, blurbs, kickers, links at rest.
- **Capture** (`{colors.capture-dark}` / `{colors.capture-light}`): the page the committed previews
  were photographed on — the house background, generated under its own name from `CAPTURE_CONFIG` in
  `scripts/gen-theme.ts` (`HOUSE_CONFIG`). A capture's frame is painted with it so the image meets its
  frame with no seam; if the capture preset moves again, only that line changes.
- **Error** (`{colors.error-dark}` / `{colors.error-light}`): Fumadocs' error callouts only.

### Named Rules
**The Greyscale Rule.** Nothing on the site has chroma except status and charts. A new accent is a
change to the house preset, not a class.

**The Mixed-Not-Typed Rule.** A colour the axes cannot name (`--hairline`, `--hover-fill`,
`--frost`, `--wash`, `--glow`, `--shadow`, `--highlight`) is a `color-mix()` of a `--color-fd-*`
token. `app.css` carries no hex and no `--color-fd-*` literal; the test fails if one appears.

**The Capture Rule.** A photographed preview sits on `bg-capture`, never on the page colour.

## Typography

**Display Font:** JetBrains Mono (600, tracking normal), for `h1`–`h4`
**Body / Label / Mono Font:** JetBrains Mono (400/500)

All load from Google Fonts through `src/lib/google-fonts.ts`; Google Fonts is the site's only
third-party origin.

### Hierarchy
- **Display** (mono 600, 48/56; 36/40 below `sm`): the landing headline.
- **Headline** (mono 600, 30/36): a landing section's heading (24/32 below `sm`); the page title
  of docs, the policy and the comparison is `text-3xl`.
- **Title** (mono 600, 20/28): card titles, policy section headings.
- **Lede** (mono 14/22 muted): the sentence under a heading; on dense pages 12/20.
- **Body** (mono 13/22): prose; docs prose is 13px/1.7.
- **Kicker** (mono 500, 10/16, +0.22em, uppercase, muted): the section opener, with a 16px
  hairline mark before it; counters; the docs breadcrumb; an axis name in the customiser.
- **Code** (mono 13): blocks, inline `code`, the preset code chip.

### Named Rules
**The Heading Face Rule.** `h1`–`h4` are JetBrains Mono 600, tracking normal and balanced, by one base rule in
`app.css`; no element re-declares a heading face.

**The Line-Height Rule.** Every px type step carries its own line height (`--text-*--line-height`).

## Layout

`PAGE_SECTION` is the one browsing container: 72rem with 1.5rem gutters, so the header's wordmark
and every section begin on one line. `COLUMN_SECTION` is the document column — a centred
`max-w-3xl` — for the policy and the comparison's opening: a kicker over a text-3xl heading, then
prose. `max-w-reading` (36rem) caps a line of prose inside either.

The hero is a two-column grid above `lg` (the column, then the phone at 300px). Under it, two
promo cards in trays carry a soft blurred glow mixed from the foreground. The showcase is a
2 → 4 column grid of 16:10 captures. The component index is category sections — a bordered icon
tile, the category name, a mono count pill — in two densities: *stack* (the default, one h-8 row
per component) and *grid* (a tray per component around a 16:10 capture).

`/theme` is an app shell: a 22rem axis sidebar with a hairline and a faint fill, a sticky h-14
topbar under the site header, and nested-tray panels on the right. Below `lg` the shell stacks
and the axes move under the work.

Vertical rhythm is three tokens — `section`, `section-sm`, `section-gap` — and sections separate
by space, not by rules or tinted bands.

The docs keep Fumadocs' notebook layout — sidebar, navbar tabs, table of contents — restyled
through its own CSS variables and rules scoped to its ids: a 256px sidebar on a 1.5% fill with a
hairline, h-8 rows, a mono-caps breadcrumb as the page kicker, and a text-3xl mono title.

## Elevation & Depth

Surfaces are told from the page by a hairline and a *highlight* — a 1px inner edge (bottom in
light, top in dark) under a 1–2px shadow at 5%. Nothing floats on a large shadow except the hero
phone.

### Shadow Vocabulary
- **Raised** (`.raised`): `var(--highlight), 0 1px 2px 0 var(--shadow)` — cards, ghost controls,
  the active segment of a toggle.
- **Primary highlight** (`--highlight-primary`): an inset 16% white top edge on the primary
  control.
- **Phone lift** (`box-shadow: 0 24px 48px -20px var(--shadow)`): under the hero phone only.

### Named Rules
**The Highlight Rule.** A surface has a hairline *and* a highlight; neither alone, and no wide
shadow.

**The Wash Rule.** The ground is one wide radial of `--wash` (foreground at 6–7%) fading to
nothing at the top of `body`. It is the site's only texture and belongs to every route.

## Shapes

Corners come from one number, the house radius `0.625rem` (10px), and scale by the library's own
multipliers: a control 1× (`rounded-control`), a tile 1.4× (`rounded-tile`), a card or tray 1.8×
(`rounded-card`, ~18px). A panel inside a tray is `rounded-xl`. Search and call-to-action pills
are `rounded-lg`; no element is fully round except a status dot. Scrollbars are 8px pills.

## Components

### Buttons
- **Shape:** `rounded-lg`, h-9, 16px padding, 13px/500.
- **Primary:** the primary colour on `on-primary` text with the inset highlight; hover lowers it
  to 90%; press scales to .97.
- **Ghost:** `raised` on the card colour with a hairline; hover fills the foreground at 4%.
- **Text link ("GitHub →"):** muted ink at 12px that brightens to ink on hover.
- **Focus:** a 2px outline in `ring`, offset 2px, on every focusable element.

### Kicker
A 16px hairline mark, 10px gap, the kicker style. Above every landing section heading, each
policy and comparison page, each customiser panel and the docs page title (as the breadcrumb).

### Cards, trays and containers
- **Card:** `rounded-card`, hairline, `raised`; the capture stage inside is `capture`.
- **Tray:** `.tray` — muted at 72%, 4px inset, hairline, `rounded-card` — around a `rounded-xl`
  panel.
- **Hover:** a linked card's border moves to 25% foreground; press scales to .99.

### Header
Fumadocs' sticky h-14 bar, `--frost` (85% page) under a blur, a 65% hairline below. Left: the mark
and "DELACOUR UI" in tracked caps (+0.28em), then from `xl` a hairline-divided counter — "NN
COMPONENTS · NN CATEGORIES" computed from `COMPONENTS` and `COMPONENT_GROUPS`. Right: the h-8 ⌘K
pill (the hot keys as `kbd` chips), the theme toggle, GitHub.

### Docs sidebar
256px, a 1.5% foreground fill, a hairline on its inner edge, h-8 rows at 12px with a 4% hover
fill, and the active row at 6% foreground under ink.

### Device Bezel
The phone frame every whole-screen capture sits in: `surface` at `2.5rem`, a 6px inset to a
`2.1rem` clip, a hairline, and the phone-lift shadow.

### Scroll Reveal
Every landing section is a `Reveal`: marked `out` (opacity 0, 16px down) at mount below the fold
and `in` as it enters, over 0.7s. `prefers-reduced-motion` removes it.

### Social Card
`/og/docs?title=` renders a 1200×630 PNG: the page in dark, the mark, the site name and the page
title in Inter, one Inter line under an amber dot (the mark's own colour, which is brand, not UI).

## Do's and Don'ts

### Do:
- **Do** take every colour from `house.css` (`--color-fd-*`) or a `color-mix()` of one; regenerate
  with `bun run gen-theme` when the house preset moves.
- **Do** open a section with a kicker; set headings in mono 600 and everything else in mono 400/500.
- **Do** draw a surface with a hairline plus the highlight, and group panels in a tray.
- **Do** keep controls dense: h-8 in chrome, h-9 for a call to action.
- **Do** put a captured preview on `bg-capture`, in a 16:10 frame.
- **Do** keep prose in `max-w-reading` inside `PAGE_SECTION`, or in a `COLUMN_SECTION`.

### Don't:
- **Don't** type a hex or an `oklch()` for a `--color-fd-*` in `app.css` or a component.
- **Don't** add an accent colour, a gradient text or a glow brighter than 14% foreground.
- **Don't** add a wide shadow to a card that already has a hairline and a highlight.
- **Don't** set weight 600 or 700 in mono; it ships 400 and 500.
- **Don't** restyle Fumadocs by replacing its structure; theme it through its variables and rules
  scoped to `#nd-*` ids.
- **Don't** reword landing copy without updating `components/landing/copy.test.ts`; the strings
  are held verbatim.
