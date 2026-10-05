# ColorPicker

- **Status**: spec, not started
- **Wave**: 1 (independent)
- **Depends on**: existing `Field`, `Input`, `Pressable`, `Text`, `Icon`, `BottomSheet` (optional peer `@delacour/react-native-bottom-sheet`), `react-native-svg`, Gesture Handler, Reanimated, Pulsar. No new peers.

## Purpose on mobile
Pick a colour by dragging, not typing: a saturation/brightness area, a hue track, an optional opacity track, a hex field and preset swatches. Used for theme accents, labels, drawing tools. Presents inline (a form section) or behind a trigger row that opens a `BottomSheet` (no Popover exists yet).

## Behaviour reference (summary)
- Saturation (x) / brightness (y) square over the current hue; thumb follows the finger, value updates every frame; a stationary tap also moves the thumb.
- Hue track (full rainbow) and alpha track (checkerboard under a fade of the current colour); each with a thumb.
- Optional hex text field: accepts `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, also `rgb()/rgba()/hsl()/hsla()`; invalid text does not change the value and shows invalid state; commits on blur/submit.
- Preview swatch of the current colour (with checkerboard for alpha).
- Preset swatches row (tap to set; selected swatch ringed).
- Two callbacks: per-frame change and on-gesture-end commit. Output format selectable: hex / rgb / hsl.
- Drag work runs on the UI thread; JS is only told at the callback boundary.
- Hue and saturation are remembered when brightness hits 0 or saturation hits 0 (greys do not snap hue to red).
- Disabled blocks every input path. Screen readers: area is adjustable in both axes, hue and alpha adjustable; value announced on gesture end, not per frame.

## API

```ts
export type ColorFormat = "hex" | "rgb" | "hsl";
export type ColorPickerSize = "sm" | "md" | "lg";
export type ColorPickerVariant = "primary" | "secondary";

/** Pure model. h 0-360, s/v/a 0-1. */
export type Hsva = { h: number; s: number; v: number; a: number };
export type Rgba = { r: number; g: number; b: number; a: number }; // r/g/b 0-255, a 0-1

export type ColorPickerProps = {
  /** CSS colour string in any accepted notation; emitted in `format`. */
  value?: string;
  defaultValue?: string;           // default "#000000"
  onValueChange?: (value: string) => void;   // every frame while dragging
  onValueCommit?: (value: string) => void;   // gesture end / hex submit / swatch tap
  format?: ColorFormat;            // default "hex"; "hex" emits #rrggbb, or #rrggbbaa when alpha < 1
  hasAlpha?: boolean;              // default false; false pins a=1 and Alpha part renders nothing
  size?: ColorPickerSize;
  variant?: ColorPickerVariant;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isReadOnly?: boolean;
  haptic?: false | HapticFeedback; // default selection tick at gesture begin/end
  /** Today only "inline" and "sheet". Reserved to grow ("popover") once Overlays' Popover lands. */
  presentation?: "inline" | "sheet";
  isOpen?: boolean; defaultOpen?: boolean; onOpenChange?: (isOpen: boolean) => void; // sheet only
  className?: string;
  children?: ReactNode;
};

export type ColorPickerSwatchesProps = { colors: readonly string[]; className?: string; children?: ReactNode };
export type ColorPickerSwatchProps = { color: string; className?: string };

export type ColorPickerState = {
  hsva: Hsva; rgba: Rgba; value: string;     // formatted
  hex: string;                               // #rrggbb[aa] always
  isDisabled: boolean; isInvalid: boolean; isReadOnly: boolean; hasAlpha: boolean;
  size: ColorPickerSize; variant: ColorPickerVariant;
  setHsva: (next: Hsva, opts?: { commit?: boolean }) => void;
};
export function useColorPicker(): ColorPickerState;       // throws outside root
```

Parts (Pattern B): `ColorPicker.Trigger` (sheet only; Pressable row: Preview + hex Text + chevron), `.Content` (inline: plain View; sheet: `BottomSheet.Container` + `BottomSheet.Content`), `.Area`, `.Hue`, `.Alpha`, `.Preview`, `.Input` (hex field), `.Swatches`, `.Swatch`.

Root with no children renders the default anatomy (Area, Hue, Alpha if `hasAlpha`, Input) so `<ColorPicker />` is complete (house rule, see Progress).

```tsx
<Field>
  <Field.Label>Accent</Field.Label>
  <ColorPicker defaultValue="#f59e0b" hasAlpha presentation="sheet" onValueCommit={save}>
    <ColorPicker.Trigger />
    <ColorPicker.Content>
      <ColorPicker.Area />
      <ColorPicker.Hue />
      <ColorPicker.Alpha />
      <ColorPicker.Input />
      <ColorPicker.Swatches colors={PRESETS} />
    </ColorPicker.Content>
  </ColorPicker>
</Field>
```
`BottomSheetProvider` must be mounted by the consumer for `presentation="sheet"` (documented, same as BottomSheet).

## Variants & sizes
- `size`: `sm|md|lg` drives area height (160/200/240 pt), track thickness, thumb diameter (reads the Slider thumb step names, imported via `../slider/slider.variants` leaf only if its resolvers are exported; otherwise own table pinned by a test), Input size (`input-*` tokens), swatch edge (24/32/40).
- `variant`: `primary|secondary` applies to the trigger row and hex `Input` (passed through), not to the gradients.
- Thumb: 2px ring `border-white`-equivalent is not allowed as raw palette; use a `bg-transparent` ring with `border-background` outer + `border-foreground` inner so it reads on any hue in both themes. The thumb interior shows the current colour.

## States
default; pressed/grabbed (thumb scales 1.15, spring); focused (hex Input focus ring); disabled (0.5 opacity, no gesture); invalid (trigger/Input destructive border, inherited from Field, own prop wins); readOnly (renders, ignores gestures and swatch taps, Input non-editable); invalid hex text (Input invalid until corrected, value untouched); empty n/a (always has a colour); loading n/a.

## Accessibility
- Area: `accessible`, `accessibilityRole="adjustable"`, label "Saturation and brightness" (prefixed by `useFieldContext().label`), `accessibilityValue.text` "Saturation 60 percent, brightness 80 percent"; `accessibilityActions` `increment`/`decrement` (saturation +-5%), custom `brighter`/`darker` (brightness +-5%). Android `onAccessibilityAction` equivalents.
- Hue: adjustable, min 0 max 360, `now`, text "Hue 210 degrees, blue-ish name" (name from a small pure `describeHue`). Alpha: adjustable 0-100 percent.
- Swatch: `accessibilityRole="radio"` inside a `radiogroup`-like container, label = hex (or caller `accessibilityLabel`), `selected` state.
- Value announced on commit via `AccessibilityInfo.announceForAccessibility`, never per frame.
- Hex Input label from Field; invalid state exposed via `accessibilityState`/Field.Error.
- Trigger: `accessibilityRole="button"`, label "Colour, #f59e0b, opens picker".

## Motion & haptics
- Thumb positions are Reanimated shared values written on the UI thread (`Gesture.Pan().minDistance(0)`, value written in `onBegin` as Slider does; `onFinalize` reports end). Area/track gradients never re-render during a drag: only the hue-dependent base colour of the area is an animated `fill` (use `useAnimatedProps` on the SVG stop) and the alpha gradient's end stop.
- Grab: thumb scale spring (behavioural, not gated). Haptic: Pulsar selection at begin, and a light tick at end; none while dragging (no per-frame buzz). Respect `haptic={false}`.
- Sheet open/close uses BottomSheet's own motion. Swatch selection ring fades (decorative; skip under `useCalmMotion()`).

## Reuses / new internal pieces / peer deps
- Reuses: `Pressable` (swatches, trigger), `Input` (hex), `Text`, `Icon` (Central chevron), `Field` context (`registerPress` opens the sheet or focuses the Input; `label`), and the `BottomSheet` compound.
  - `BottomSheet` is imported statically from `../bottom-sheet` in ONE file, `color-picker-sheet.tsx`, rendered only when `presentation === "sheet"`. No cycle exists (BottomSheet never imports ColorPicker). Metro resolves static imports regardless of the branch taken, so the `color-picker` subpath requires the sheet engine even for inline use — accepted, as with every picker (README decision 5); the docs page's Installation says so. No lazy `require`.
- New internal: `color-picker.color.ts` (pure math, below), `color-picker-gradient.tsx` (SVG gradient surfaces), `color-picker-checkerboard.tsx` (SVG pattern), `color-picker-thumb.tsx`.
- `lib/color.ts` was read: it only has `isLiteralColor` and `transparentOf` (hex/rgb), no HSV/HSL. It does not fit; do NOT extend it. Reuse the idea of `transparentOf`: the far stop of the alpha gradient must be the same RGB at alpha 0, never the keyword `transparent` (grey bloom). `color-picker.color.ts` exposes `withAlpha(rgba, a)` for that.
- Peer deps: none new (`react-native-svg`, Gesture Handler, Reanimated, worklets, Pulsar already peers; bottom-sheet engine already optional).

## Files
```
components/color-picker/
  AGENTS.md  index.ts
  color-picker.tsx            root + Object.assign, default anatomy
  color-picker.context.tsx    ColorPickerContext, useColorPicker(), useColorPickerPart()
  color-picker.types.ts       Hsva, Rgba, ColorFormat, shared prop types
  color-picker.color.ts        PURE leaf, no RN imports ('worklet' directives on hot functions)
  color-picker.color.test.ts
  color-picker.variants.ts    slotted tv(): root, area, track, thumb, swatches, swatch, trigger, content + size tables, pure resolvers
  color-picker.variants.test.ts
  color-picker-area.tsx  color-picker-hue.tsx  color-picker-alpha.tsx
  color-picker-preview.tsx  color-picker-input.tsx
  color-picker-swatches.tsx  color-picker-swatch.tsx
  color-picker-trigger.tsx  color-picker-content.tsx  color-picker-sheet.tsx
  color-picker-gradient.tsx  color-picker-checkerboard.tsx  color-picker-thumb.tsx   (internal)
```
Plus the repo-wide checklist in the brief: package AGENTS.md row, `gen-exports`, demos, route, index row, `gen-demos`, docs mdx + meta.json, registry ITEM_META (+ PACKAGE_INSTALL entries for svg, bottom-sheet engine) + `registry:build`, changeset (minor `@delacour/react-native-ui` and `delacour`).

## Pure logic to unit-test (`color-picker.color.test.ts`)
- `hexToRgba` / `rgbaToHex`: `#f00`, `#f008`, `#ff0000`, `#ff000080` (a = 128/255 ~ 0.502, round-trips to `80`); uppercase; no `#`-prefix returns null; 5/7-digit null.
- `parseColor(str): Hsva | null`: hex forms, `rgb(255 0 0)`, `rgba(255,0,0,.5)`, `hsl(120, 100%, 50%)`, `hsla(...)`, whitespace/case, garbage -> null, out-of-range clamps (`rgb(300,0,0)` -> 255).
- `rgbToHsv` / `hsvToRgb`: primaries, white, black, mid grey; round-trip every channel for a 17-step grid within 1 unit; hue wraps 360 -> 0.
- `hsvToHsl` / `hslToHsv`: known pairs (`#ff8000` = hsl 30,100%,50%), s=0 cases, v=0.
- `formatColor(hsva, format)`: `hex` omits alpha at a=1 and appends at a<1; `rgb` -> `rgb(r, g, b)` / `rgba(r, g, b, a)` (a to 2dp); `hsl` same.
- `areaToHsv(x, y, w, h, hue)`: corners (0,0)->s0,v1; (w,0)->s1,v1; (0,h)->v0; clamps outside; `hsvToArea` inverse within 1px.
- `trackToValue(x, w, max)` / `valueToTrack`, clamp, zero width returns 0 (no NaN).
- `stepHsva(hsva, "saturation"|"brightness"|"hue"|"alpha", direction, step)`: clamps, hue wraps.
- `preserveHue(next, previous)`: when s=0 or v=0 after parse, keeps previous h (and s when v=0); the value-resync guard `isSameColor(value, hsva, format)` stops an echoed controlled value from re-deriving hsva (no drift while dragging).
- `contrastForeground(rgba)`: picks black/white by relative luminance (for preview label); `relativeLuminance` known values.
- `describeHue(h)`: 0 red, 30 orange, 60 yellow, 120 green, 180 cyan, 240 blue, 300 magenta, 359 red.
- `color-picker.variants.test.ts`: every token a slot names exists in both themes (use the shared `theme-tokens` reader), size tables ascend, `sm|md|lg` set equals Input's size set, area height/thumb tables, resolvers for state ladder (own prop > Field > default), thumb ring classes contain no raw palette colour or `dark:`.

## Playground demos (`apps/playground/src/demos/color-picker/`)
`basic` (inline, hex readout) **hero**+capture; `with-alpha` capture; `swatches` capture; `sheet-trigger` capture (inside a Field; needs BottomSheetProvider, already in playground layout); `formats` (hex/rgb/hsl readouts) ; `sizes` capture; `disabled-invalid` (not captured); `controlled` (external Buttons set value, verifies no drift).

## Docs page outline (`color-picker.mdx`)
Intro + hero; Installation (CLI + manual; optional bottom-sheet peer note); Usage (inline, sheet, Field); Anatomy; Value & formats (accepted notations, `onValueCommit`); Alpha; Swatches; Sizes/variants; Accessibility; Presentation note; API tables per part; `useColorPicker`.

## Out of scope / follow-ups
Hue wheel, brightness-as-separate-track, HSL/OKLCH picking, eyedropper, recent-colours persistence, anchored popover presentation (follow-up once Overlays' Popover merges; `presentation` union grows), wide-gamut colours, copy-to-clipboard.

## Acceptance checklist
- [ ] `color-picker.color.ts` has no RN imports; all tests above green via `bun test`
- [ ] Drag never triggers a React re-render per frame (verify with React DevTools highlight on simulator)
- [ ] Tap without movement moves the thumb (value written in `onBegin`)
- [ ] Controlled `value` echo does not drift hue at s=0 / v=0
- [ ] Alpha fade ends at the same RGB at 0 alpha; no grey bloom on light and dark themes
- [ ] Hex input accepts all listed notations, rejects garbage without changing value
- [ ] `presentation="sheet"` works with BottomSheetProvider; `inline` never resolves the engine
- [ ] Field: label read, invalid cascades, `registerPress` opens/focuses
- [ ] VoiceOver: area increment/decrement + brighter/darker, hue/alpha adjustable, announce on commit
- [ ] displayName on every part (`display-name.test.ts` green), AGENTS.md + table row, exports, demos, docs, registry, changeset
- [ ] No comments in JSX; no `any`; semantic tokens only
