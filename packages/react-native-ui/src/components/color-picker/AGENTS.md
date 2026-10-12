# ColorPicker

Pick a colour by dragging: a saturation and brightness area, a hue track, an optional opacity
track, a hex field and preset swatches. Compound root plus nine parts. Presents inline, or in a
`BottomSheet` behind a trigger row.

`import { ColorPicker } from "@delacour/react-native-ui/color-picker";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/color-picker` |
| `color-picker.tsx` | Root, default anatomy, the `Object.assign` compound surface |
| `color-picker.context.tsx` | `ColorPickerContext`, `useColorPicker()`, `useColorPickerPart()` |
| `color-picker.types.ts` | `Hsva`, `Rgba`, `Hsla`, `ColorFormat`, `ColorPickerPresentation`, `HsvaChannel` |
| `color-picker.color.ts` | Pure colour maths — parse, convert, format, geometry, resync. No RN imports |
| `color-picker.variants.ts` | Slotted `tv()`, size tables, axis ladder, accessibility text. No RN imports |
| `color-picker-area.tsx` | `ColorPicker.Area` — the saturation/brightness pan |
| `color-picker-track.tsx` | The horizontal track both `Hue` and `Alpha` are. Internal |
| `color-picker-hue.tsx` / `color-picker-alpha.tsx` | `ColorPicker.Hue`, `ColorPicker.Alpha` |
| `color-picker-thumb.tsx` | The ring every drag surface positions. Internal |
| `color-picker-gradient.tsx` | The area's two static ramps and the hue rainbow, in SVG. Internal |
| `color-picker-checkerboard.tsx` | The transparency pattern, optionally faded along its width. Internal |
| `color-picker-preview.tsx` | `ColorPicker.Preview` |
| `color-picker-input.tsx` | `ColorPicker.Input` — the hex field |
| `color-picker-swatches.tsx` / `color-picker-swatch.tsx` | `ColorPicker.Swatches`, `ColorPicker.Swatch` |
| `color-picker-trigger.tsx` | `ColorPicker.Trigger` — the sheet's row |
| `color-picker-content.tsx` | `ColorPicker.Content` — a column inline, the sheet's panel otherwise |
| `color-picker-sheet.tsx` | The one file that imports `BottomSheet` |

## Design

- **Sizes** `sm | md | lg` and **variants** `primary | secondary | etched` are `Input`'s, and a test pins
  the sets equal. Size drives the area height (160/200/240), track and thumb thickness, the
  swatch and preview edge (24/32/40) and the field. Variant reaches only the trigger row and the
  hex field — the gradients are the colour, not chrome.
- **The model is HSV, not RGB.** Saturation and brightness are the two axes the area is dragged
  along, and HSV can hold a hue a grey has no RGB for. `preserveHue` carries the old hue across a
  grey and the old hue and saturation across black, so dragging into the black edge and back
  returns the colour that went down rather than red.
- **A drag never renders React.** The root owns one `live` shared value. Every pan writes it on
  the UI thread; every thumb, the preview, the area's hue layer and the alpha track read it in
  animated styles. JavaScript hears a frame only when `onValueChange` is passed
  (`hasChangeListener`), and the settled `hsva` state catches up in `endDrag`. A custom part that
  reads `useColorPicker().hsva` therefore lags the finger by design.
- **The value is written in `onBegin`**, Slider's rule: a pan activates on movement, so a
  stationary tap would never reach `onUpdate`. `onFinalize` ends the drag because it fires on
  every path, cancel included.
- **A controlled echo does not re-derive the model.** `resolveIncomingColor` returns null for a
  value the picker already holds (compared in the caller's format, after rounding) and for text
  that does not parse; the resync also skips while a drag is live. Without it a parent storing
  `onValueChange` output would round-trip every frame through hex and nudge the hue of a grey.
- **No animated SVG.** `react-native-svg` collects gradient stops in JavaScript at render, so a
  stop animated from the UI thread never reaches the native gradient. The area is a plain view
  whose `backgroundColor` is the hue, under two static ramps; the alpha track is the colour as a
  plain view under a checkerboard **masked** from opaque to clear. A checkerboard at `1 − a` over
  the colour is the same pixel as the colour at `a` over the checkerboard, with the same RGB the
  whole way — never a fade to the keyword `transparent`, which blooms grey.
- **Track gradients are inset to the thumb's travel** (`resolveTrackInset`), so the colour under
  the thumb's centre is the value it reports at both ends.
- **The thumb ring is two semantic borders** — `border-background` outside, `border-foreground`
  inside — so it reads on any hue in either theme. Never a raw white.
- **The checkerboard is two theme tokens** (`background`, `muted`), so it does not glare in dark.
- **The hex field commits on blur and submit, never per keystroke.** It accepts every notation
  `parseColor` does; unparseable text leaves the value alone and turns the field invalid until it
  parses again. Inside a sheet it is a `BottomSheet.TextInput`, so the keyboard lifts the panel.
- **The root has a floor width (`min-w-64`).** Every part is `w-full`, and 100% of a parent sized
  by its content is the content — inside an `items-center` column the area and the hex field folded
  to a sliver on device. The floor keeps a picker usable wherever it is dropped.
- **Disabled fades each drawn part, not the root.** The trigger row and the hex field are Input
  boxes that fade themselves; a faded root would compound them to a quarter. Read-only renders
  normally and ignores every drag, tap and keystroke.
- **`hasAlpha={false}` pins alpha at one on every path** — drag, field, swatch, controlled value —
  and `ColorPicker.Alpha` renders nothing, so one anatomy serves both kinds of picker.
- **Swatch selection is compared as hex**, so `rgb(245 158 11)` and `#f59e0b` select the same
  swatch. The ring is its own layer over a same-width transparent border, so it fades without the
  swatch moving, and snaps under `useCalmMotion()`.
- **Haptics**: `haptic` (default `selection`) at grab and a `light` tick on release; nothing per
  frame. `haptic={false}` silences both.

## Presentation

`presentation="inline"` (default) draws `Content` as a column. `"sheet"` wraps the parts in
`BottomSheet` — `Trigger` sits on the page, `Content` teleports into the panel — and needs
`BottomSheetProvider` mounted once in the app. The union is meant to grow a `"popover"` once an
anchored popover exists; nothing here imports one.

**The subpath requires the sheet engine even inline.** `color-picker-sheet.tsx` imports
`../bottom-sheet` statically, and Metro resolves static imports whichever branch renders — the
same trade `chart` makes with its engine. `BottomSheet` never imports `ColorPicker`, so there is
no cycle. Keep that import in the one file.

## Field

Inside `<Field>` the picker takes `isDisabled` / `isInvalid` (its own prop wins, via
`resolveColorPickerAxes`), prefixes each part's accessible name with the `Field.Label` text, and
registers a press: tapping the label opens the sheet, or focuses the hex field inline.

## Accessibility

- Area: `adjustable`; increment/decrement step saturation by 5%, custom `brighter` / `darker`
  step brightness. Value text "Saturation 60 percent, brightness 80 percent".
- Hue: `adjustable`, 0–360, 10° a step, wrapping; text "Hue 210 degrees, blue".
- Alpha: `adjustable`, 0–100 percent.
- Swatches: a `radiogroup` of `radio`s labelled by hex.
- Trigger: `button`, "Accent, #f59e0b, opens picker".
- The value is announced on commit, never per frame. Preview is hidden from assistive tech.

**A clipped surface never carries its own hairline.** The area, track, preview and swatch each
clip their colour layers with `overflow-hidden`, and the `border-border` hairline is a separate
`edge` view drawn last inside them. Dark's `border` is translucent, and iOS clips a rounded view
with a translucent border to a faceted path — every dark swatch drew as an octagon and the track
ends as flats. The variants test fails on a slot that both clips and draws `border-border`.

A `testID` on Area, Hue or Alpha also names the part's thumb, as `<testID>-thumb`. A test or a
preview flow drags from the thumb rather than a coordinate, so a change to the area's height or
the starting colour cannot leave the gesture starting on empty surface.

## Default anatomy

`<ColorPicker />` with no children draws Area, Hue, Alpha (when `hasAlpha`) and Input — behind a
Trigger in a sheet. Swatches and Preview are opt-in.

## Out of scope

A hue wheel, OKLCH or HSL picking, an eyedropper, recent colours, wide-gamut colours, and an
anchored popover presentation.
