---
name: Delacour UI Playground
description: The library on a phone in the Devl material — graphite, hairlines, mono type under Inter headings, one inner highlight on every surface.
colors:
  ground-dark: "#131313"
  surface-dark: "oklch(0.204 0 0)"
  sidebar-dark: "oklch(0.178 0 0)"
  hairline-dark: "oklch(1 0 0 / 10%)"
  input-edge-dark: "oklch(1 0 0 / 12%)"
  text-dark: "oklch(0.97 0 0)"
  primary-dark: "oklch(0.97 0 0)"
  ground-light: "#ffffff"
  surface-light: "#ffffff"
  hairline-light: "oklch(0 0 0 / 12%)"
  input-edge-light: "oklch(0 0 0 / 14%)"
  text-light: "oklch(0.269 0 0)"
  primary-light: "oklch(0.269 0 0)"
  destructive-dark: "#ff6467"
  destructive-light: "#e7000b"
typography:
  large-title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: "41px"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
  row-title:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 500
  kicker:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.2em"
rounded:
  control: "10px"
  panel: "14px"
  tray: "18px"
spacing:
  gutter: "16px"
  section: "24px"
  tray-inset: "4px"
components:
  button-primary:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.ground-light}"
    rounded: "{rounded.control}"
    height: "36px"
  card:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.tray}"
---

# Design System: Delacour UI Playground

## Overview

**Creative North Star: "The instrument panel."**

The playground is the library's harness, and it looks like the instrument you would test a library
with: graphite grounds, hairline edges at low alpha, set type in a monospace face, with Inter reserved
for the one large title. Nothing here is decorated. Colour belongs to status and to charts; every
other surface is a step of grey, and depth is a single inner highlight rather than a shadow stack.

It replaces the earlier amber world (zinc, Outfit, one amber accent). That look survives as the
"Delacour amber" preset, one tap away in the customiser, and the library default is untouched.

What it refuses: a second accent colour on chrome, soft cards with large drop shadows, a heading
face used at body size, and a kicker that is not uppercase mono at ten points.

## Colors

A greyscale ramp named `graphite`. Primary is the foreground itself: near-black in light, near-white
in dark, so the primary button is a high-contrast slab and not a hue.

- **Ground.** White in light, `#131313` in dark. Cards sit one step above (dark `oklch(0.204 0 0)`),
  the sidebar one step below (`oklch(0.178 0 0)`).
- **Hairlines.** Black at 12% in light, white at 10% in dark; field edges 14% and 12%. Alpha rather
  than a grey, so an edge reads on any surface it lands on.
- **Muted and secondary fills** are opaque. A tray's frame is the muted fill at 70%.
- **Status colour** (blue, emerald, amber, red) appears only in badges, alerts and charts, as a soft
  8% (light) or 16% (dark) tint under a full-strength label.

Every value comes from `resolveTokens(HOUSE_CONFIG)`; the splash colours in `app.config.ts` are held
to it by `app.config.test.ts`.

## Typography

- **Body is JetBrains Mono**, embedded, at the Vela scale: 12, 13 and 15 points.
- **Headings are Inter**, tight-tracked. They reach the screen through `font-heading`, which the
  playground's `global.css` declares so the library's `Text.Display`, `Title` and `Header` resolve it.
- **The kicker** is the mono label over a group: ten points, uppercase, 0.2em tracking, muted. It is
  `Text.Kicker`. It names a group or a count and never decorates a heading.

## Layout

A sixteen-point gutter and twenty-four between blocks. Groups are a kicker over a **tray**: a muted
frame with four points of padding and an 18-point corner, holding a panel at the next corner in.
The nested corners keep one even gap round the edge. Controls are thirty-six points on a phone.

## Elevation & Depth

One mechanism: the **etched** edge. A one-pixel highlight set into a surface (a darkening on the
bottom edge in light, a lightening on the top edge in dark) plus a very soft drop. The primary button
adds a white inset top edge at 16%. Press feedback is a 0.97 scale. A surface carries either a
hairline or an etched edge, never a hairline under a wide shadow.

## Shapes

Ten-point controls, fourteen-point panels in a tray, eighteen-point trays and cards. Badges are the
small corner, not a capsule.

## Components

- **Buttons.** `material="etched"` in the house screens; ghost and destructive stay flat.
- **Cards and containers.** Etched, 18-point corner; a tray when several panels belong together.
- **Inputs.** The `etched` variant: card fill, field edge, and on focus a ring border with a
  three-point neutral halo. Placeholder is the muted foreground.
- **Navigation.** The library's `Screen.Navbar`, static; a large title that does not collapse.
- **Signature component: the axis strip.** The customiser's horizontal scroller, each tile drawing
  what its axis actually varies.

## Do's and Don'ts

### Do

- Set labels in mono and the one title in Inter.
- Group with a kicker and a tray rather than a heading and a divider.
- Let status carry the colour; keep chrome in graphite.
- Take every colour from the tokens, so a preset change repaints the whole app.

### Don't

- Add an accent to chrome, or restore the amber as the default; it is a preset.
- Stack a hairline under a wide drop shadow.
- Use the kicker above a heading as decoration.
- Put a hex value in a component. The splash is the only place hex restates a token, and a test holds it.
