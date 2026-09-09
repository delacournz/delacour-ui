---
name: Delacour UI docs
description: The studio's own site, continued into its component library — one dark ground, one amber, one reading column.
colors:
  page-dark: "oklch(0.141 0.005 285.823)"
  page-light: "oklch(0.985 0 0)"
  surface-dark: "oklch(0.21 0.006 285.885)"
  surface-light: "oklch(1 0 0)"
  raised-dark: "oklch(0.274 0.006 286.033)"
  raised-light: "oklch(0.967 0.001 286.375)"
  hairline-dark: "oklch(1 0 0 / 10%)"
  hairline-light: "oklch(0.92 0.004 286.32)"
  ink-dark: "oklch(0.985 0 0)"
  ink-light: "oklch(0.141 0.005 285.823)"
  ink-muted-dark: "oklch(0.705 0.015 286.067)"
  ink-muted-light: "oklch(0.552 0.016 285.938)"
  amber-dark: "oklch(0.837 0.164 84.429)"
  amber-light: "oklch(0.666 0.157 58.318)"
  on-amber-dark: "oklch(0.21 0.006 285.885)"
  on-amber-light: "oklch(0.279 0.074 45.635)"
  error-dark: "oklch(0.704 0.191 22.216)"
  error-light: "oklch(0.577 0.245 27.325)"
  capture-dark: "oklch(0.145 0 0)"
  capture-light: "oklch(0.985 0 0)"
typography:
  display:
    fontFamily: "Outfit, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: "56px"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Outfit, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "26px"
  lede:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "28px"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.08em"
  code:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
rounded:
  control: "0.45rem"
  tile: "0.63rem"
  card: "0.81rem"
  pill: "9999px"
  phone: "2.5rem"
spacing:
  section-gap: "2.5rem"
  section-sm: "4rem"
  section: "6rem"
  reading: "36rem"
  page: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.amber-dark}"
    textColor: "{colors.on-amber-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  button-ghost:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 20px"
  card:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.card}"
    padding: "16px"
  preset-tile:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.tile}"
    padding: "12px"
  eyebrow:
    textColor: "{colors.ink-muted-dark}"
    typography: "{typography.label}"
  nav-pill:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.ink-muted-dark}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 8px 0 14px"
---

# Design System: Delacour UI docs

## Overview

**Creative North Star: "The Studio, Continued"**

The documentation site is `delacour.co.nz` carried into the library it sells. One near-black
ground with a faint field of dots under everything, zinc surfaces a shade above it, hairlines a
shade above those, and a single amber that is spent only on what a reader can act on or must
notice: the primary pill, the active tab, the sidebar row you are on, the dot before an eyebrow,
the caret and the selection. Everything else is the near-white of the type and the greys between.
The site is dark by default because the studio is; light is a real theme behind the toggle and
inherits every rule here with the roles swapped.

The page is one reading column. Thirty-six rem of Inter, top to bottom, with Outfit at 600 set
tight for every heading — the phone capture sits beside the column only above 1024px, and the two
places the page widens (the showcase grid, the library index) are a picture wall and an index,
not prose. Nothing is decorated: no glow behind the hero, no grid, no gradient text, no tinted
band between sections. Motion is one gesture — sections lift into place as they enter — and it
disappears under reduced motion.

Every colour on the site is `resolveTokens(HOUSE_CONFIG)`, the customiser's own house preset,
generated into `src/styles/house.css`. That is the site's argument made literal: the theme you
build at `/theme` is the theme this page is wearing (`/theme?preset=AQACGBgCCgLk`). The three
things the axes cannot express — the dot field, the pill nav's translucency, the hover glow — are
`color-mix()` of the tokens, never a hex.

**Key Characteristics:**
- Dark first; light is the same system with the roles swapped, never a second design.
- One accent, amber, spent on interactives and markers only.
- One column of 36rem for prose; the page widens only for a picture wall or an index.
- Outfit 600, tracked −0.025em, for every heading; Inter body at 16/26; Geist Mono for code.
- 8px corners at the control, 1.8× that for a card, fully round for a pill.
- A faint dot field is the only material; depth is a hairline or an offset shadow, never both.
- One motion: the scroll reveal. No scattered hover effects.

## Colors

A zinc scale under one amber; the palette is the design system's `zinc` base with the `delacour`
accent laid over it, so every value below is a resolved token rather than a choice made here.

### Primary
- **Brand Amber** (`{colors.amber-dark}`, `#fbbf24` in dark; `{colors.amber-light}`, `#d97706` in
  light): the primary pill, the active navigation tab, the selected sidebar row's text, the
  selected customiser tile's ring, the eyebrow dot, the feature glyphs, the focus outline, the
  caret, the underline colour under a hover. The light value is two steps deeper so the same
  role clears contrast on a white card.
- **On Amber** (`{colors.on-amber-dark}` / `{colors.on-amber-light}`): the only text ever set on
  amber — the primary pill's label.

### Neutral
- **Page** (`{colors.page-dark}` `#09090b` / `{colors.page-light}` `#fafafa`): the ground. The
  studio site is `#000` / `#fff`; this is the zinc base's own page value, the cited adaptation of
  painting the whole site from the axes.
- **Surface** (`{colors.surface-dark}` `#18181b` / `{colors.surface-light}` `#ffffff`): cards,
  the pill nav at 70%, the phone bezel, the sidebar in dark, popovers.
- **Raised** (`{colors.raised-dark}` / `{colors.raised-light}`): a hover fill on a ghost pill or
  a customiser tile, the secondary button in the mock UI.
- **Hairline** (`{colors.hairline-dark}` 10% white / `{colors.hairline-light}`): every border on
  the site, at 1px, and the divider between list rows.
- **Ink** (`{colors.ink-dark}` `#fafafa` / `{colors.ink-light}`): headings, body, links at rest.
- **Ink Muted** (`{colors.ink-muted-dark}` `#a1a1aa` / `{colors.ink-muted-light}` `#71717a`):
  ledes, blurbs, eyebrows, the nav links at rest, captions.
- **Capture** (`{colors.capture-dark}` / `{colors.capture-light}`): the one non-house colour —
  the library *default's* page, because every preview under `public/previews/` was photographed
  on it. A capture's frame is painted with it so the image meets its frame with no seam.
- **Error** (`{colors.error-dark}` / `{colors.error-light}`): Fumadocs' error callouts only.

### Named Rules
**The One Amber Rule.** Amber marks what a reader can do or must notice — an action, an active
state, a marker — and nothing else. No amber band, no amber heading, no amber card.

**The Mixed-Not-Typed Rule.** A colour the axes cannot name (`--dot`, `--pill`, `--glow`,
`--shadow`, `--selection`) is a `color-mix()` of a `--color-fd-*` token. `app.css` carries no hex
and no `oklch()` of its own; the test fails if one appears.

**The Capture Rule.** A photographed preview sits on `bg-capture`, never on the page colour.

## Typography

**Display Font:** Outfit (with `ui-sans-serif, system-ui` fallback)
**Body Font:** Inter (with the same fallback stack)
**Label/Mono Font:** Geist Mono (with `ui-monospace, SFMono-Regular, Menlo` fallback)

**Character:** Outfit's round geometry at 600, tracked in, over Inter's neutral text face — the
headings have a voice and the body stays out of the way. Geist Mono is for code, data and the
preset code only, never for a "technical" costume.

All three load from Google Fonts through `src/lib/google-fonts.ts` at 400/500/600/700 (Geist
Mono ships 400/500); Google Fonts is the site's only third-party origin.

### Hierarchy
- **Display** (600, 48px/56px, −0.025em): the landing headline, the customiser's `Your theme`,
  the 404. `text-4xl` (36/40) below `sm`.
- **Headline** (600, 30px/36px, −0.025em, `text-4xl` 36/40 above `sm`): a landing section's
  heading, under its eyebrow.
- **Title** (600, 24px/32px): the customiser's section headings (`Presets`, `Axes`, …); the docs
  page title is Fumadocs' `DocsTitle`, also in Outfit.
- **Subtitle** (600, 16px): a principle's title, a card's name at 500/14px.
- **Lede** (400, 18px/28px, muted ink): the sentence under a heading.
- **Body** (400, 16px/26px): prose. The reading column holds it to about 70 characters.
- **Label** (500, 13px/16px, +0.08em, uppercase, muted ink): the eyebrow, always preceded by a
  6px amber dot; the group names in the component index and on `/docs/native/components`.
- **Code** (400, 13px, Geist Mono): code blocks, the inline `code` in prose and landing copy, the
  preset code chip, the `404` line.

### Named Rules
**The Heading Face Rule.** `h1`–`h4` are Outfit 600, tracked −0.025em and balanced, by one base
rule in `app.css`; no element re-declares a heading face.

**The Line-Height Rule.** Every px type step carries its own line height (`--text-*--line-height`)
so a size never inherits its parent's ratio.

## Layout

One centred reading column of 36rem (`max-w-reading`) for every prose section, inside a page
width of 72rem (`max-w-page`) with 1.5rem gutters. The hero is a two-column grid above `lg`
(the column, then the phone at its intrinsic 300px); below it the phone is not rendered. Two
sections leave the column on purpose: the showcase grid (2 → 4 columns, wide tiles spanning two)
and the library index (2 → 4 columns of names), each keeping its heading on the column's left
edge.

Vertical rhythm is three tokens — `section` (6rem, 4rem on a phone) between sections, `section-sm`
(4rem / 3rem) for the hero's top and the customiser, `section-gap` (2.5rem / 2rem) from a
heading block to what it introduces — and nothing else. Sections are separated by space, not by
rules or tinted bands; the one rule on the landing page is above the footer. Inside a section,
lists divide with a hairline and `py-5`; a heading block is `gap-4` (eyebrow, heading, lede).

The docs keep Fumadocs' notebook layout untouched — sidebar, navbar tabs, right-hand table of
contents — restyled through its own CSS variables and rules scoped to its ids.

## Elevation & Depth

Tonal, with one hairline. A surface is a step lighter than the ground (`surface` on `page`), and
its edge is a 1px `hairline`; that is the whole depth system for cards, tiles, the sidebar and the
code blocks. Two shadows exist and both carry an offset and a wide blur:

### Shadow Vocabulary
- **Phone lift** (`box-shadow: 0 24px 48px -20px var(--shadow)`): under the hero phone only.
  `--shadow` is mixed from the foreground in light (a darkening) and from the page in dark
  (black), so it never reads as a halo on the black ground.
- **Nav float** (`box-shadow: 0 8px 24px -16px var(--shadow)`): under the floating pill nav.
- **Amber glow, on hover only** (`box-shadow: 0 8px 24px -8px var(--glow)`): the primary pill
  and the copy button as they are hovered; `--glow` is 28% amber. The only glow on the site.

### Named Rules
**The Border-or-Shadow Rule.** A card has a hairline and no shadow. Only the two floating objects
— the phone and the nav — carry a shadow, and they carry it with a real offset.

**The Dot Field Rule.** The ground is a 28px dot grid of `--dot` (9% of the foreground in light,
7% in dark) on `body`. It is the site's one texture and belongs to every route; nothing else is
laid over the page.

## Shapes

Corners come from one number, the house radius `0.45rem` (7.2px, the design system's `small`),
and scale by the library's own multipliers: a control is 1× (`rounded-control`), a tile 1.4×
(`rounded-tile`, ~10px — customiser option tiles, preset tiles), a card 1.8× (`rounded-card`,
~13px — showcase and index cards, preview frames, code blocks, the mock UI). Pills — every call
to action, the nav, the alpha badge, the theme toggle — are fully round. The phone bezel is
`2.5rem` outside and `2.1rem` inside. Borders are always 1px; there are no thick or coloured
side stripes.

## Components

### Buttons
- **Shape:** fully round pill, 44px tall, 20px side padding, 14px/500 label.
- **Primary:** amber on `on-amber` text. Hover adds the amber glow shadow and a 5% brightness
  lift; nothing moves.
- **Ghost:** a hairline on a 60% surface fill with ink text; hover fills with `raised`.
- **Text link ("GitHub →"):** muted ink at 14px/500 that brightens to ink on hover; the arrow is
  part of the label.
- **Copy theme.css:** the primary pill at full width.
- **Focus:** a 2px amber outline, offset 2px, on every focusable element (`:focus-visible`).

### Eyebrow
- **Style:** a 6px amber dot, 8px, then the label style (13px/500, +0.08em, uppercase, muted ink).
- **Where:** above every landing section heading and above each group in the component index and
  the components page. It is the studio site's own device, measured from `delacour.co.nz`.

### Cards / Containers
- **Corner Style:** `rounded-card` (~13px).
- **Background:** `surface`; a captured preview's stage inside a card is `capture`.
- **Shadow Strategy:** none — a hairline only (see Elevation).
- **Border:** 1px `hairline`; hover moves it to 50% amber on a linked card.
- **Internal Padding:** 16px; a caption row is `p-4` with a hairline above it.
- **One card language:** the landing showcase tile and the components index tile share one class
  (`CARD`); the preset chip on the landing page and the preset tile on `/theme` are the same
  surface at `rounded-tile`.

### Inputs / Fields
- The site has no forms of its own. Fumadocs' search trigger and the mock field in
  `theme-preview.tsx` wear the tokens: `raised` fill, hairline border, control radius.
- **Caret and selection:** amber caret; selection is 35% amber under ink.

### Navigation
- **Home layout:** Fumadocs' header reframed as a floating pill — sticky 12px from the top,
  centred, shrink-wrapped to its content, 70% `surface` under a 12px backdrop blur, a hairline,
  the nav-float shadow; 48px tall with the mark and "Delacour UI" in Outfit, the links in muted
  ink (active in amber), search, the theme toggle, GitHub. Below `lg` it fills the width and
  rounds to 1.5rem when the menu opens.
- **Docs layout:** Fumadocs' bar and sidebar untouched; the active tab underlines in amber, the
  active sidebar row is 12% amber under amber text, the sidebar in dark lifts to `surface`.
- **Lockup:** the mark (from `@delacour/brand`, never redrawn) beside "Delacour UI" set in the
  heading face; there is no wordmark.

### Device Bezel
The phone frame every whole-screen capture sits in, on the landing hero and on a component page:
`surface` at `2.5rem`, a 6px inset to a `2.1rem` clip, a hairline, and the phone-lift shadow. On
the hero it rests at `rotate(2deg) scale(0.95)` and settles to flat on hover (and under reduced
motion).

### Scroll Reveal
Every landing section is a `Reveal`: below the fold at mount it is marked `out` (opacity 0,
16px down) and marked `in` as it enters, over 0.7s on `cubic-bezier(0.16, 1, 0.3, 1)`. Nothing
is hidden in the server HTML, sections already on screen never blink, and
`prefers-reduced-motion` removes the transition entirely.

### Social Card
`/og/docs?title=` renders a 1200×630 PNG of the same world: the page in dark, the mark, the site
name and the page title in Outfit 600, one Inter line under an amber dot.

## Do's and Don'ts

### Do:
- **Do** take every colour from `house.css` (`--color-fd-*`) or a `color-mix()` of one; regenerate
  with `bun run gen-theme` when the house preset moves.
- **Do** set every heading in Outfit 600, tracked −0.025em, and every code span in Geist Mono.
- **Do** keep prose in the 36rem column and separate sections with `py-section`, never with a
  rule or a tinted band.
- **Do** round a card at `rounded-card`, a tile at `rounded-tile`, a control at `rounded-control`
  and a call to action fully; keep every border at 1px.
- **Do** put a captured preview on `bg-capture`.
- **Do** precede a section heading with the eyebrow (dot + tracked label) on the landing page and
  the component index, and nowhere in docs prose.
- **Do** carry a shadow only with an offset and a blur, and only under something that floats.

### Don't:
- **Don't** type a hex or an `oklch()` in `app.css` or a component; the parity test fails on one.
- **Don't** add a second accent, an amber background band or gradient text.
- **Don't** put a glow behind the hero or a grid over the ground; the dot field is the only
  texture.
- **Don't** nest a card in a card, or add a shadow to a card that already has a hairline.
- **Don't** add a hover effect that moves, tilts or scales anything other than the hero phone;
  the reveal is the site's one motion.
- **Don't** restyle Fumadocs by replacing its structure; theme it through its variables and
  rules scoped to `#nd-*` ids.
- **Don't** reword landing copy without updating `components/landing/copy.test.ts`; the strings
  are held verbatim.
