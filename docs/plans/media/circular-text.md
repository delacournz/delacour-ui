# CircularText — design spec

Plan ID `media-circular-text`. Phase `media-circular-text-1`. Issue title: `CircularText 1 - ✨ feat:`.

## 1. Purpose on mobile

Text set around a circle, optionally turning: a seal, a badge, a "scroll down" ring, a loading ring, an
arc of text over a logo. A mark or icon can sit in the middle.

- **It is decoration plus a label.** The ring carries words, so it reads to assistive tech like any text;
  the spinning is decoration and holds still for calm motion.
- **It is not a charting primitive.** Labels along a chart arc belong to `@delacour/react-native-charts`.

## 2. Public API

`import { CircularText } from "@delacour/react-native-ui/circular-text";`

```tsx
<CircularText radius={72} speed={24} size="xs" weight="semibold">
  {"DELACOUR • UI • "}
  <Icon icon={IconStar} />
</CircularText>
```

```ts
export const CIRCULAR_TEXT_DIRECTIONS = ["clockwise", "counterclockwise"] as const;
export type CircularTextDirection = (typeof CIRCULAR_TEXT_DIRECTIONS)[number];

/** How much of the circle the text spans. */
export type CircularTextSpan =
  | { kind: "full" }                                    // text is spread to fill 360deg
  | { kind: "arc"; sweep: number; startAngle?: number } // degrees; startAngle 0 = 12 o'clock, default -sweep/2 (centred on top)
  | { kind: "natural"; startAngle?: number };           // glyphs at natural advance; may not close the ring

export type CircularTextSide = "outside" | "inside";   // glyph tops point away from / toward the centre

export type CircularTextSpin =
  | { kind: "none" }
  | { kind: "loop"; speed?: number }                    // deg/s, default 24; sign comes from `direction`
  | { kind: "controlled"; rotation: SharedValue<number> }; // degrees, caller-driven (scroll-linked, etc.)

export type CircularTextProps = Omit<ViewProps, "children"> & {
  /** Plain text. Repeat/separators are the caller's — or use `repeat`. */
  children: string;
  radius: number;                       // pt, centreline of the text. Required: a ring needs a size
  direction?: CircularTextDirection;    // default "clockwise"
  span?: CircularTextSpan;              // default { kind: "full" }
  side?: CircularTextSide;              // default "outside"
  spin?: CircularTextSpin;              // default { kind: "none" }
  /** Repeat `children` (with `separator`) until the circle is covered. "fill" estimates the count. */
  repeat?: number | "fill";             // default 1
  separator?: string;                   // default " • "
  pause?: { kind: "none" } | { kind: "press" } | { kind: "controlled"; isPaused: boolean }; // default none
  /** Rendered in the middle; the ring sizes to 2·radius + glyph height. */
  centerContent?: ReactNode;
  // typography, from Text's axes
  size?: TextProps["size"]; weight?: TextProps["weight"]; font?: TextProps["font"]; className?: string;
  accessibilityLabel?: string;          // default children
};
export const CircularText: ((props: CircularTextProps) => ReactElement) & { displayName: string };
```

Single component, pattern A+C (variants for typography only). `span`, `spin` and `pause` are discriminated
unions so `arc` without a `sweep` and `controlled` without a `rotation` do not typecheck. `radius` is a
number because an SVG path needs one; a class cannot carry it (see Sizing: a numeric size can never
become a class).

## 3. File map

| File | Holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/circular-text` |
| `circular-text.tsx` | `CircularText` — resolves, renders the rotating wrapper, the `Svg`, `centerContent` |
| `circular-text-ring.tsx` | Internal leaf: `Svg` + `Defs/Path` + `Text/TextPath` (memoised; props are static while spinning) |
| `circular-text-spin.ts` | `useCircularSpin(spin, isPaused)` — frame-callback integrator → rotation shared value |
| `circular-text.types.ts` | Shared prop types |
| `circular-text.variants.ts` | Pure geometry + resolvers, no RN imports |
| `circular-text.variants.test.ts` | |
| `AGENTS.md` | |

DisplayNames: `DelacourUI.CircularText`, `DelacourUI.CircularText.Ring`.

## 4. Variants & sizes

Typography is `Text`'s. The component reads the resolved style for `size`/`weight`/`font` with Uniwind's
`useResolveClassNames(resolveTextClass(...))` and hands `fontSize`, `fontFamily`, `fontWeight`,
`letterSpacing` and the colour to SVG `<Text>` — SVG text cannot take a `className`. Colour is a token
(`text-foreground` by default) resolved once. No `size` axis of its own: **the ring's size is the
`radius` prop**; typography size is `Text`'s ladder. The box is `2·(radius + fontSize·k)` where `k`
accounts for side (outside needs ascender room, inside needs descender room) — `resolveRingBox`.

## 5. States

| State | Behaviour |
| --- | --- |
| static | `spin: none` — drawn once, no animation, no frame callback |
| spinning | Rotation integrates at `speed` deg/s with sign from `direction` |
| paused | Velocity eases to 0 (`pause`) and resumes from the same angle — no snap |
| controlled | Rotation follows the caller's shared value; no internal clock |
| calm / reduce motion | `loop` becomes `none` at rotation 0; `controlled` still follows (the caller owns it) |
| arc | Text spans `sweep`, ends are open; rotation still turns the whole arc |
| invalid | `radius <= 0`, empty text → renders nothing (and `__DEV__` warning once) |

## 6. Accessibility

- **The container is one text element; the glyphs are not.** `accessible`, `accessibilityRole="text"`,
  `accessibilityLabel={accessibilityLabel ?? children}` with separators stripped (`resolveRingLabel`)
  — "DELACOUR • UI •" would otherwise be read "DELACOUR bullet UI bullet". The `Svg` is hidden
  (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`) and **repeated**
  copies are never part of the label: the label is the text once.
- `centerContent` stays independently accessible (an icon button in the middle keeps its role). The ring
  is a sibling element, not a wrapper that swallows it — the container is `accessible={false}`
  when `centerContent` is present, and the ring label sits on a child `View`.
- Reduce motion / `isMotionCalm` → §5. Spinning text is hard to read for some users; holding it still
  makes the label legible, and costs nothing.
- Text on a circle is inherently harder to read; docs recommend ≥ 12pt-equivalent and ≤ ~28 chars per
  half circle.

## 7. Motion

- **Spin is a rotation of the whole `Svg` wrapper, not per-glyph animation.** An `Animated.View` with
  `transform: [{ rotate: "<deg>deg" }]` around a static `Svg`: the text path is laid out once by the
  native SVG engine and then only a layer transform changes per frame. Re-rendering a `TextPath` each
  frame would re-lay-out every glyph on the UI thread. The ring component is `memo`ed and its props
  are frozen while spinning, so React Compiler can leave it alone.
- **Frame-callback integrator, speed in degrees per second** (same reasoning as `Marquee`: `withRepeat`
  cannot pause or re-speed without a snap). `rotation = (rotation + dt·velocity) mod 360`; the wrap at
  360 is invisible because a rotation by 360° is identity. Velocity eases via `withTiming` on pause.
- **Path**: a circle drawn as two arc commands (SVG cannot draw a full circle with one `A`), starting at the
  top and going the chosen direction. `side: inside` flips the sweep flag so glyph tops face the centre.
  `resolveCirclePath(cx, cy, r, startAngle, sweepAngle, direction)` returns `d`. A partial arc uses one `A`
  with `large-arc` set when `|sweep| > 180`.
- **Fill vs natural**: `full` uses `textLength={circumference}` with `lengthAdjust="spacing"` on `Text`
  so the string closes the ring exactly, regardless of font metrics. `repeat: "fill"` estimates the copy
  count from `resolveRepeatCount(circumference, glyphCount, fontSize)` (average advance ≈ `0.58·fontSize`);
  the estimate may be off by a glyph, and `textLength` absorbs the error as spacing. `natural` uses
  `startOffset` and no length, for arcs whose spacing matters.
- **Why not per-glyph positioned `Text`**: placing N `Text`s with `rotate` transforms needs each glyph's
  measured advance (N `onLayout`s, N re-renders) and drifts on kerning. The native `TextPath` measures with
  the platform's shaper. Pure `resolveGlyphAngles(advances, radius, startAngle, direction)` is still
  specified and tested as the **fallback** if `textLength`/`TextPath` proves unreliable on Android.
- Verify on both platforms: `textLength` and `lengthAdjust` support in the installed `react-native-svg`.
  If one platform ignores them, fall back to `letterSpacing = (circumference − naturalWidth)/glyphCount`
  using a one-time measured natural width.
- Press-to-pause uses a Gesture Handler `LongPress(minDuration 0)` on the wrapper, simultaneous with
  children; the integrator reads the same eased `velocity` shared value as `Marquee`'s.

## 8. Reuses

`Text` (`resolveTextClass`, token colours), `useCalmMotion`, `useThemeColor`, Uniwind
`useResolveClassNames`, `react-native-svg` (`Svg`, `Defs`, `Path`, `Text`, `TextPath`), Reanimated,
Gesture Handler, `cn`/`tv`. `centerContent` composes with `Icon`/`Avatar`/`Button` by children, not import.

## 9. Dependencies

None new — `react-native-svg` is a hard peer and already `expo` in `PACKAGE_INSTALL`. **Skia is
explicitly rejected**: `@delacour/react-native-charts` is an optional peer, so depending on it for a
text ring would turn a lightweight display component into one that needs a native graphics stack and a
dev-client rebuild. `TextPath` does the job. `ITEM_META["circular-text"]`:
`{ title: "CircularText", description: "Text set around a circle, turning.", categories: ["display"] }`.

## 10. Sibling / cross-category dependencies

- **Imports no sibling.** Not `marquee` (even though the integrator idea is shared — private copy;
  consolidate later in `src/lib/` if desired), not `text-animation`.
- No text-splitting helper needed; `circular-text` splits nothing.
- Cross-category: none missing. A `useResolveClassNames` use is Uniwind's; confirm it is already used in the
  package (grep) — if not, it is a first use and `PACKAGE_INSTALL`/peers already cover `uniwind`.
- Possible later: a `Kpi`/`Avatar` badge ring; not in scope.

## 11. Pure logic to unit-test (TDD)

```ts
resolveCircumference(radius: number): number
resolveRingBox(radius: number, fontSize: number, side: CircularTextSide): number
resolveCirclePath(cx: number, cy: number, radius: number, startAngle: number, sweep: number, direction: CircularTextDirection, side: CircularTextSide): string
resolveSpan(span: CircularTextSpan): { startAngle: number; sweep: number; hasLength: boolean }
resolveRepeatCount(circumference: number, glyphCount: number, fontSize: number, separatorGlyphs: number): number
resolveRingText(text: string, repeat: number, separator: string): string
resolveRingLabel(text: string, separator: string): string
resolveSpinVelocity(direction: CircularTextDirection, speed: number): number   // signed deg/s
advanceRotation(rotation: number, dtMs: number, velocity: number): number      // wrapped to [0, 360)
resolveGlyphAngles(advances: readonly number[], radius: number, startAngle: number, direction: CircularTextDirection): readonly number[]
resolveGlyphPosition(angle: number, radius: number, cx: number, cy: number): { x: number; y: number; rotation: number }
```

Cases: `resolveCircumference(50) ≈ 314.159`; `resolveCirclePath` for a full clockwise circle starts at
`(cx, cy − r)`, contains two `A` commands and ends at the start; `counterclockwise` flips the sweep flag;
`side:"inside"` flips again; a 90° arc has `large-arc=0`, a 270° arc `=1`. `resolveSpan({kind:"arc", sweep:120})`
→ `startAngle = −60`. `resolveRingText("A", 3, " • ")` → `"A • A • A • "`; `repeat 1` → `"A"` with no trailing
separator for `full`? Decide: `full` with one copy keeps the caller's own trailing separator; test both.
`resolveRepeatCount` never < 1. `resolveRingLabel("DELACOUR • UI • ", " • ")` → `"DELACOUR UI"`.
`advanceRotation(350, 1000, 24)` → `14`; negative velocity wraps up from 0; `dt=0` identity; result always in `[0,360)`.
`resolveGlyphAngles` for equal advances equals `i·advance/radius`, is monotonic, reversed for counterclockwise.
`resolveGlyphPosition(0, r, cx, cy)` = top centre, rotation 0; `90` = right, rotation 90.

## 12. Playground demos

`apps/playground/src/demos/circular-text/`

| File | Shows | Capture |
| --- | --- | --- |
| `seal.tsx` | A full ring spinning around a centred icon — **`hero`** | clip |
| `two-rings.tsx` | Outer clockwise, inner counterclockwise at different speeds | clip |
| `arc.tsx` | A 140° arc of text over a mark, static | still |
| `badge.tsx` | A ring around an `Avatar`, `side="inside"` variant beside it | clip |
| `loading-ring.tsx` | A ring doubling as a "working" label with a `Spinner` in the middle | clip |
| `hold-to-pause.tsx` | `pause: press`; flow long-presses then releases | clip (flow) |
| `scroll-linked.tsx` | `spin: controlled` from a shared value driven by a `Slider` (no scroll host needed) | gallery only |

Route `apps/playground/src/app/(components)/circular-text.tsx`; row in `src/app/index.tsx`.

## 13. Docs page

`apps/web/content/docs/native/components/circular-text.mdx`: hero · Installation · Usage · Spanning
(full / arc / natural) · Direction and side · Spinning (loop, controlled, pause) · Content in the middle ·
Repeating a phrase · Recipes: seal, two rings, badge, loading ring · Reduced motion · Accessibility ·
API reference. `meta.json`: `"circular-text"` after `"text"` in **Data Display**.

## 14. Acceptance checklist

- [ ] `circular-text.variants.test.ts` first, red→green
- [ ] typecheck, `bun run check`; no `any`; no JSX comments
- [ ] displayName on root and `Ring`
- [ ] `AGENTS.md` + **Components** table row; `gen-exports`
- [ ] demos, `gen-demos`, route, index row
- [ ] docs page + `meta.json`
- [ ] `ITEM_META["circular-text"]`; `registry:build`; `verify:expo`
- [ ] changeset (minor)
- [ ] Simulator check via `warden` + `agent-device` on iOS **and** Android (SVG text differs)
- [ ] Calm verified: `loop` renders static at 0°, no frame callback mounted
- [ ] Full ring closes with no visible gap/overlap at 3 radii and 2 font scales (`textLength` honoured)
- [ ] `inside` and `outside` glyph orientation correct; counterclockwise reads in the right direction
- [ ] Pause/resume has no angular snap; speed change has no snap
- [ ] 360° wrap invisible over 10 revolutions; rotation costs no JS-thread work (perf monitor)
- [ ] Screen reader reads the text once, separators stripped; `centerContent` independently focusable
- [ ] Uniwind-resolved font family renders in SVG text (not the system fallback) on both platforms
- [ ] Skia not imported anywhere
