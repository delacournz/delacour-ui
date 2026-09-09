---
name: Delacour UI Playground
description: The studio's own site continued onto a phone — one black ground, one amber, native structure throughout.
colors:
  ground-dark: "#09090b"
  surface-dark: "#18181b"
  raised-dark: "#27272a"
  hairline-dark: "rgba(255, 255, 255, 0.10)"
  text-dark: "#fafafa"
  text-muted-dark: "#9f9fa9"
  amber-dark: "#fbbf24"
  amber-on-dark: "#18181b"
  ground-light: "#fafafa"
  surface-light: "#ffffff"
  raised-light: "#f4f4f5"
  hairline-light: "#e4e4e7"
  text-light: "#09090b"
  text-muted-light: "#71717b"
  amber-light: "#d97706"
  amber-on-light: "#451a03"
  destructive-dark: "#ff6467"
  destructive-light: "#e7000b"
typography:
  large-title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: "41px"
    letterSpacing: "-0.025em"
  navbar-title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
  row-title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  section-header:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.025em"
  code:
    fontFamily: "Menlo, monospace"
    fontSize: "16px"
    fontWeight: 400
rounded:
  xs: "2.9px"
  sm: "4.3px"
  md: "5.8px"
  lg: "7.2px"
  xl: "10.1px"
  2xl: "13px"
  full: "9999px"
spacing:
  section: "8px"
  block: "24px"
  gutter: "20px"
  row-gap: "12px"
  navbar-row: "56px"
  control-sm: "36px"
  control-md: "44px"
  control-lg: "52px"
  specimen: "56px"
components:
  button-primary:
    backgroundColor: "{colors.amber-dark}"
    textColor: "{colors.amber-on-dark}"
    typography: "{typography.row-title}"
    rounded: "{rounded.lg}"
    height: "{spacing.control-md}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.lg}"
    height: "{spacing.control-md}"
  button-icon-navbar:
    backgroundColor: "transparent"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.lg}"
    size: "{spacing.control-md}"
  list-group:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  list-row-title:
    textColor: "{colors.text-dark}"
    typography: "{typography.row-title}"
  list-row-description:
    textColor: "{colors.text-muted-dark}"
    typography: "{typography.caption}"
  navbar:
    backgroundColor: "{colors.ground-dark}"
    textColor: "{colors.text-dark}"
    height: "{spacing.navbar-row}"
    padding: "0 20px"
  tabs-track:
    backgroundColor: "{colors.raised-dark}"
    rounded: "{rounded.full}"
  tabs-capsule:
    backgroundColor: "{colors.raised-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.full}"
  input-primary:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.lg}"
    height: "{spacing.control-md}"
  preset-tile:
    backgroundColor: "{colors.surface-dark}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
    height: "{spacing.specimen}"
    width: "112px"
---

# Design System: Delacour UI Playground

## Overview

**Creative North Star: "The Studio Site, Read Through the Platform"**

The playground is `delacour.co.nz` continued onto a phone, and it gets there by one route only: the studio's look is a preset — `HOUSE_CONFIG`, zinc under the `delacour` amber, Inter under Outfit, the small corner — pushed through the design system's own seven axes and nothing else. Nothing on the phone is styled by hand to look like the site. The site's black ground, its single amber, its near-white type and its zinc surfaces all arrive as token values, which is the pitch the app exists to prove: the theme you build here is the theme you ship.

Everything the eye reads as structure is the platform's. The navigation bar is the library's own `Screen.Navbar`, static, with the mark at the start and two 44pt ghost icon buttons at the end. The content is one column of grouped lists under iOS-style section headers, at the screen's 20pt gutter. Motion is opacity-only crossfades and the platform's own edge-swipe back. There is no particle field, no floating pill, no floating action button, no hero — the web contract's ornaments are refused on the phone because the platform has no such devices.

Density is a tool's: nineteen rows under eight headings on the home screen, one demo per page in the galleries, and on `/theme` a column of horizontal strips whose tiles draw exactly what their axis varies. The amber is spent on interactives and markers alone — a selected tile's ring, a primary button, the mark, a chart — and the type sits at one weight step of contrast against a ground that stays black.

**Key Characteristics:**
- One near-black ground (`#09090b`), zinc-900 surfaces, 10%-white hairlines, near-white type
- One amber (`#fbbf24` dark, `#d97706` light) and it is only ever on something interactive or marking
- Outfit 600 tight at the large-title step only; Inter for everything else the platform expects in its own face
- Corners from one number (7.2) — the "small" radius — through the library's multiplier ramp; buttons are rounded rectangles, not pills
- Flat: no shadows anywhere, depth by tonal step and one hairline
- Native structure — static navbar, 44pt targets, grouped lists, edge-swipe back, opacity-only fades
- Opens dark; light is the same system on a `#fafafa` ground

## Colors

Two greys and one amber: the zinc ramp supplies every surface, text and hairline, and the `delacour` accent repaints only `primary`, the five chart slots and their foregrounds.

### Primary
- **Studio Amber** (`{colors.amber-dark}` in dark, `{colors.amber-light}` in light): the one hue. In dark it fills the primary button, rings the selected tile on every strip, fills the theme disc and the mark; its own text is `{colors.amber-on-dark}`, near-black. In light it deepens to the `#d97706` the site's light mode uses, with `#451a03` type on it, so a primary button keeps its contrast without a second accent being invented.
- **Chart Ramp** (five amber steps, `oklch(0.879 0.153 91.605)` → `oklch(0.555 0.146 48.998)`, `#fbbf24` second): set by the house preset for `chart-1`…`chart-5`. **Unverified on device** — no capture in this round exercised a chart; recorded from the preset, not from a screen.

### Neutral
- **Ground** (`{colors.ground-dark}` / `{colors.ground-light}`): the page, the navbar's backing, the native root view and the splash. The same value paints all four, so a cold start, a bounce past a modal and a screen are one colour.
- **Surface** (`{colors.surface-dark}` / `{colors.surface-light}`): `card` — every `ListGroup`, every strip tile's box, every input. One tonal step above the ground in both modes; in light the ground is deliberately a hair below white so the card still reads as a card without a shadow.
- **Raised** (`{colors.raised-dark}` / `{colors.raised-light}`): `secondary` and `muted` — the tabs track, the secondary button, the specimen bars. In dark this is the lightest neutral surface, so the tabs capsule (`elevated`) is mixed a step lighter still to read as lifted out of the track.
- **Hairline** (`{colors.hairline-dark}` / `{colors.hairline-light}`): `border` — the card's edge, the navbar's bottom rule, the divider between rows. Dark's is a 10% white rather than a solid, so it holds on any surface tint the base-colour axis picks.
- **Text** (`{colors.text-dark}` / `{colors.text-light}`): titles, row titles, the large title, icons in a row's prefix.
- **Muted Text** (`{colors.text-muted-dark}` / `{colors.text-muted-light}`): row descriptions, the component count, section headers, an unselected tab, the trailing chevron.
- **Destructive** (`{colors.destructive-dark}` / `{colors.destructive-light}`): the only other hue, and only on the states that name it — an invalid field's ring and caption, a destructive button.

### Named Rules
**The One Amber Rule.** Amber is on a thing you can tap or a thing that marks a state. It is never a background, never a heading colour, never a decorative band. If an amber element cannot be pressed and does not mark a selection, it is wrong.

**The Tokens-Only Rule.** The house reaches the phone as `HOUSE_CONFIG` through the design system's axes. No screen names a hex; every colour above is a token a consumer's theme can repaint. A colour written into a component is a defect, not a decision.

**The Same Ground Rule.** Page, navbar, root view and splash are all `background`. A layer painted a different near-black shows at the first frame or on an over-scroll, and the phone reads it as a second material.

## Typography

**Display Font:** Outfit (falls back to the platform sans)
**Body Font:** Inter (falls back to the platform sans)
**Label/Mono Font:** Menlo on iOS, `monospace` on Android — the platform's own; the house preset sets no mono family

**Character:** Inter carries the whole interface at the platform's own sizes and weights, so the phone reads as native. Outfit appears once, semibold and tight, at the large-title step — the one place its geometry is legible as Outfit. At 18 and below the two faces are indistinguishable, so no smaller heading is set in it on purpose.

### Hierarchy
- **Large Title** (600, 34/41, tracking −0.025em, Outfit): the product name on the home screen, and nowhere else. The brand's one typeset lockup — the mark's geometry is binding and there is no wordmark.
- **Navbar Title** (600, 18, leading tight, Inter): the back button's title on every folder index and gallery, with a **Subtitle** (400, 14, muted) under it counting rows.
- **Row Title** (500, 16, Inter): a `ListGroup` row's first line; **Row Description** (400, 14, muted) under it.
- **Body** (400, 16): a paragraph — the customiser's one line of explanation.
- **Label** (500, 14): a strip's name on `/theme` ("Presets", "Style", "Radius"), a field label, a tab.
- **Caption** (400, 14, muted): the name under a strip tile, a style's description, a field's help.
- **Section Header** (600, 12, uppercase, tracking +0.025em, muted): `Text.Overline` — the group name over a `ListGroup` on the home screen (ACTIONS, FORMS, DATA DISPLAY…), and the demo's name on a pager's rail. This is an iOS grouped-list section header, not a marketing eyebrow: it labels the list under it and is never set over a paragraph or a title.
- **Code** (400, 16, mono on a `muted` fill): inline code in a demo's caption.

The library's steps are 12 / 14 / 16 / 18 / 20 / 24 / 30; the large title is an explicit 34/41 pair outside the scale, because the scale has no 34 and the platform's large-title step does.

### Named Rules
**The One Outfit Rule.** Outfit is set at the large-title step only. Any smaller heading is Inter, because at navbar size Outfit is Inter with a different name and a second font loaded for nothing.

**The Section Header Rule.** Uppercase 12pt semibold muted is a list's section header. It sits directly over a `ListGroup` or a rail, at `SECTION_GAP` (8pt). It is not a kicker, an eyebrow or a heading device, and it never sits over prose.

**The Scaled Chrome Rule.** Text follows Dynamic Type up to a 1.4× cap, because the chrome — 36/44/52pt controls, a 56pt navbar row — is fixed and past that a label clips rather than grows.

## Layout

One column at the screen's width, inset by the `gutter` (20pt) on both sides — the token every edge lines up against: the navbar's content, the scroll area's padding, the strips' first tile and the cards below them.

A scroll area stacks blocks at `block` (24pt): a `ListGroup`, a strip, a paragraph. Inside a block, a section header and the group under it sit at `section` (8pt). The home screen is the large title and its count, then eight of those blocks in the documentation site's group order.

Screen chrome is `static` — the navbar and any footer take their own space in the flow rather than overlaying the content, so a page's scroll frame is the clear band between them. The navbar row is 56pt tall on top of the safe-area band; its start slot holds the mark or the back button with a stacked title and subtitle, and its end slot holds one or two 44pt icon buttons at a 8pt gap.

Horizontal strips on `/theme` bleed into the gutter (`-mx-screen-gutter`) so a tile is cut by the screen edge rather than stopping short, and pad their content back by the same gutter so the first tile lines up with the cards. Tiles sit at `row-gap` (12pt); axis tiles are 80pt wide, preset tiles 112, and every specimen box is `specimen` (56pt) tall so the strips share one rhythm. A strip opens scrolled to the applied option, one slot in from the left.

The galleries are a pager: one demo per full-viewport page, centred or stretched by the demo's own `align`, under a sticky header that is the pager's sibling.

The home screen's large title is static and does not collapse into the bar on scroll. That needs a native navigation header, and the app mounts the library's `Screen.Navbar` instead so the bar on show is the one consumers get. A static large title over a static bar is an accepted trade for a tool, recorded here as such.

Every capture and every measurement in this round is from the iOS simulator. The Android half of the contract — Material structure, `sans-serif` fallbacks, the `res/font` weights — is unverified and owed.

## Elevation & Depth

Flat. No component draws a shadow, and three library tests assert it; the `--shadow-*` tokens are carried for a consumer's use and nothing here reads them. Depth is tonal: ground below surface below raised, one step each, and a single hairline (`border`) where two surfaces meet — a card's edge, the navbar's bottom rule, the divider between rows. In dark the steps are seven lightness points apart; in light they are one or two, which is why the light ground is `#fafafa` rather than white.

Two things read as above the page and both are gradients, not shadows: the `Screen.ScrollShadow` fade at a scroll area's ends, painted in the page's own `background` so content dissolves under the chrome, and the bottom-sheet scrim (`overlay`, black at 45%).

### Named Rules
**The Flat Ground Rule.** Surfaces are tonal steps and hairlines only. A shadow on the phone is a defect to remove, not a style to match.

**The Fade Under Chrome Rule.** Content passing under a navbar, a tab bar or a footer is dissolved by a fade in the page colour, sized to the chrome's full occupancy — including the safe-area strip — so no row runs crisp through the home indicator.

## Shapes

Every corner derives from one number: `--radius` is 7.2 (the "small" step of the radius axis), and the library's ramp multiplies it — 0.4, 0.6, 0.8, 1.0, 1.4, 1.8 — so the whole app squares or rounds together. In practice two steps are on screen: `md` (5.8) on a `ListGroup` and `lg` (7.2) on buttons, inputs and strip tiles. Corners are therefore tight, closer to square than soft.

Buttons are rounded rectangles, not capsules. The library's own default is a corner of half the height, but a named radius overrides the button corner as well, so under the house preset a 44pt primary button has a 7.2 corner, the same as a card. The one true pill is the `Tabs` primary variant: track and capsule are both `full`, so the capsule is concentric at any padding. Theme-strip discs and the specimen bars are also `full`.

Borders are one hairline wide, in `border`, and a card's border is transparent until the variant paints it, so the box never changes size when it does. A selected strip tile swaps its hairline for `primary` — the ring is the border itself, painted once, not a second element.

## Components

### Buttons
- **Shape:** rounded rectangle at the radius token (7.2) on every size; 36 / 44 / 52pt tall at 14 / 16 / 18pt semibold labels. Icon sizes are the same heights as squares.
- **Primary:** amber fill, near-black label; the "Generate CSS" footer action on `/theme` is the canonical instance.
- **Ghost:** transparent, `foreground` icon or label — the navbar's two actions (`ThemeTrigger`, `ThemeToggle`) at `icon-md`, because 44pt is the platform's minimum target and the 56pt row has room.
- **Press:** scale feedback on a lone button, fade on a grouped one; selection haptic on the navbar actions. No hover state exists on the phone.
- **Secondary / Outline / Destructive:** `raised` fill, hairline outline, and `destructive` fill respectively; on screen in the `/theme` preview, not in the app's own chrome.

### Chips
None. Strip tiles are the closest device and are documented under the Signature Component below.

### Cards / Containers
- **Corner Style:** `md` (5.8) on `ListGroup`; `lg` (7.2) on a strip tile or preset specimen.
- **Background:** `surface` (`card`), one step above the ground.
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** one hairline in `border`; `overflow-hidden`, so a pressed row fades to the card's own corner.
- **Internal Padding:** a row is 12pt vertical, 16pt horizontal, 56pt minimum height, with a 12pt gap between prefix icon (20pt), content and suffix chevron (16pt, muted). Dividers are the library's `Separator`, inset 16pt to match the row padding.

### Inputs / Fields
- **Style:** `surface` fill, hairline in `input`, corner at the radius token; 44pt tall at 16pt; placeholder and decorators in `muted`.
- **Focus:** the caret and selection take `primary`; the box does not glow.
- **Error:** border, caption and decorator icon turn `destructive`; the `/theme` preview keeps one field permanently invalid so the state is always on screen.

### Navigation
- **Navbar:** the library's `Screen.Navbar`, static, `background` fill with a hairline along its bottom; 56pt row over the safe-area band, at the gutter. Start slot: the mark (28pt) on the home screen, or a back chevron with a stacked 18pt title and 14pt muted subtitle everywhere else. End slot: ghost icon buttons — customiser and theme toggle on the screens that navigate (home, folder indexes), the toggle alone on galleries.
- **Tabs (on `/theme`):** the library's `Tabs` primary variant as a floating pill over the pager — `raised` track, `elevated` capsule, both fully round, labels at 16pt medium crossfading between `muted` and `elevated-foreground`. The bar is absolutely positioned; pages scroll under it and a fade the bar renders keeps rows from cutting past its sides.
- **Back:** the platform's edge-swipe, plus the navbar's back button whose whole title block is the target.
- **Theme toggle:** the glyph names the destination (a sun while dark), crossfaded through opacity with the exchange at the trough. No rotation.

### Signature Component: the axis strip
A horizontal scroller of tiles under a 14pt label, one per option on an axis. Each tile is a `surface` box, 56pt tall, hairline-edged at the radius token, drawing only what its axis varies: Style draws a life-size button and a surface corner, Radius an empty outlined box at the candidate corner, Base Colour a card carrying two foreground bars, Theme one `primary` disc, Chart Colour five bars at fixed heights, and Presets a miniature of the whole app — `Aa` in the preset's heading face over an amber pill and a muted bar. The applied tile's edge is `primary`; its caption switches from `muted` to `foreground`. Nothing else in the tile changes.

## Do's and Don'ts

### Do:
- **Do** paint every colour from a token the seven axes can repaint; the house is a preset, not a stylesheet.
- **Do** keep amber on interactives and markers only — a primary button, a selected ring, a disc, a chart.
- **Do** keep every tappable at 44pt or more; navbar actions are `icon-md`, never `icon-sm`.
- **Do** mount chrome `static` and let a fade in the page colour, sized to the chrome's full occupancy, dissolve content under it.
- **Do** set the large title in Outfit at 34/41 semibold tight, and every smaller title in Inter at the platform's step.
- **Do** derive every corner from the one radius (7.2) through the ramp; a button is a rounded rectangle under this preset.
- **Do** animate label and glyph swaps as opacity-only crossfades, out (90ms) before in (140ms).
- **Do** open dark; the light system is the same tokens on `#fafafa`.

### Don't:
- **Don't** port the web contract's ornaments: no particle field, no floating pill navigation, no floating action button, no hero, no glow.
- **Don't** float a control over content; the customiser's trigger lives in the navbar for that reason.
- **Don't** draw a shadow; depth is a tonal step and a hairline.
- **Don't** set Outfit below the large-title step, or any heading in a display face inside a navbar.
- **Don't** use the uppercase 12pt section header as an eyebrow, a kicker or a heading over prose; it labels the list under it.
- **Don't** write a hex, a point size or a corner into a screen; the library's tokens and `src/tokens.ts` hold the numbers.
- **Don't** translate or scale in a crossfade; Reduce Motion has nothing to object to only while the fades stay opacity-only.
