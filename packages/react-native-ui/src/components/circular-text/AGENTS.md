# CircularText

Text set around a circle, optionally turning — a seal, a badge, a "scroll down" ring, a loading
ring, an arc of words over a mark. Something can sit in the middle. A single component: no parts,
no context.

`import { CircularText } from "@delacour/react-native-ui/circular-text";`

```tsx
<CircularText radius={72} repeat="fill" spin={{ kind: "loop" }} centerContent={<Icon icon={IconStar} />}>
  DELACOUR UI
</CircularText>
```

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/circular-text` |
| `circular-text.tsx` | `CircularText` — resolves the typography and geometry, the rotating wrapper, the gesture, `centerContent` |
| `circular-text-ring.tsx` | `CircularText.Ring` (internal, `memo`) — the `Svg` with the text on a `TextPath` |
| `circular-text-spin.ts` | `useCircularSpin` — the frame-callback integrator behind the rotation shared value |
| `circular-text.types.ts` | `CircularTextProps`, `CircularTextSpin`, `CircularTextPause` |
| `circular-text.variants.ts` | Geometry and resolvers, no RN imports |
| `circular-text.variants.test.ts` | |

## Axes

| Prop | Shape | Default |
| --- | --- | --- |
| `radius` | points, the text's centreline — required | — |
| `span` | `full` · `arc { sweep, startAngle? }` · `natural { startAngle? }` | `full` |
| `side` | `outside` (tops away from the centre) · `inside` (tops toward it) | `outside` |
| `spin` | `none` · `loop { speed? }` (deg/s) · `controlled { rotation }` (deg) | `none` |
| `direction` | `clockwise` · `counterclockwise` — the sign of a `loop` | `clockwise` |
| `pause` | `none` · `press` · `controlled { isPaused }` | `none` |
| `repeat` / `separator` | a count or `"fill"`, and what goes after each copy | `1`, `" • "` |
| `size` / `weight` / `color` / `className` | `Text`'s axes | `xs`, `semibold`, `default` |

`span`, `spin` and `pause` are discriminated unions so an `arc` without a `sweep` and a
`controlled` spin without a `rotation` do not typecheck.

## Design

- **The ring's size is `radius`, a number, not a class.** An SVG path needs a number, and a numeric
  size can never become a class (see **Sizing** in the package AGENTS.md). The box is
  `resolveRingBox`: twice the outermost ink — ascenders outside, descenders inside — rounded up to
  a whole point.
- **`radius` is the centreline of the type, not its baseline.** `resolveBaselineRadius` moves the
  path half a cap height toward the glyph feet, so an outside and an inside ring of the same radius
  sit on the same circle and two rings nest by radius alone. Measuring to the baseline made an
  inside ring sit a full line-height away from the outside ring it was meant to match.
- **Typography is `Text`'s, resolved once.** SVG text takes no `className`, so the root runs
  `resolveTextClass` through Uniwind's `useResolveClassNames` and hands `fontSize`, `fontFamily`,
  `fontWeight`, `letterSpacing` and the colour to the SVG `Text`. The family therefore follows
  `--font-sans` like every other `Text`. There is no `font` axis: `Text` has none either — a family
  goes in `className` (`font-mono`, `font-heading`).
- **SVG text does not scale with the OS text size.** The geometry is fixed by `radius`, so a scaled
  font would overrun the circle; the ring stays at its declared size. Keep rings decorative and
  short, and do not put information only here.
- **`side` decides the path's direction; `direction` decides the spin.** A `TextPath` stands each
  glyph with its top to the left of the path's travel, so a clockwise path puts tops outside and a
  counterclockwise one puts them inside. Coupling reading direction to spin direction as well would
  make two of the four combinations mirror writing. `resolveCirclePath` therefore takes `side`
  only, and an `inside` arc travels from its end back to its start, so the words read left to right
  along the bottom of a seal.
- **A full circle is two arcs.** One `A` whose ends coincide draws nothing. A partial arc is one
  `A`, with `large-arc` set past 180°.
- **`full` and `arc` close exactly by a measured letter spacing, not by `textLength` alone.**
  `textLength` (the arc length at the baseline, with `lengthAdjust="spacing"`) is still set, but
  iOS's `react-native-svg` ignores it — on the simulator the ring stopped short and left a gap at
  12 o'clock. So the root measures the string once with an invisible, unwrapped RN `Text` in the
  same face, size, weight and tracking, and `resolveFillLetterSpacing(length, width, glyphs, base)`
  spreads the shortfall over every glyph. SVG adds spacing after the last glyph too, so that
  trailing gap is the seam where the ring closes and it matches every other join. The ring is
  `opacity: 0` until the width arrives, so it never shows with a gap and jumps shut. `natural`
  sets no length and measures nothing.
- **`repeat: "fill"` floors its estimate.** `resolveRepeatCount` assumes an average advance of
  `0.58·fontSize`; floored, an error opens the spacing slightly rather than asking `textLength` for
  negative spacing and colliding the glyphs.
- **One copy is the caller's text exactly.** A trailing separator they wrote stays, and one they
  left off closes the ring with no gap. Several copies write `separator` after each, and never
  double one the text already ends with.

## Motion

- **Spin turns the whole drawing, never a glyph.** An `Animated.View` with a `rotate` transform
  wraps a static `Svg`: the path is laid out once and only a layer transform changes per frame.
  `CircularText.Ring` is `memo`ed and its props do not change while spinning, so nothing
  re-renders on the JS thread.
- **A frame-callback integrator, in degrees per second.** `withRepeat` cannot pause or change speed
  without restarting from an angle of its own — a snap. `useCircularSpin` integrates
  `advanceRotation(rotation, dt, velocity)`, wrapping into [0, 360) (a 360° turn is the identity,
  so the wrap is invisible), and a pause or a speed change only eases the velocity with `withTiming`
  over `CIRCULAR_TEXT_EASE_MS`.
- **The callback is inactive unless the ring loops.** `none`, `controlled` and calm rings put
  nothing on the frame loop.
- **Calm motion holds a `loop` still at 0°.** Under the OS reduce-motion setting or
  `DelacourProvider`'s `isMotionCalm`, `loop` behaves as `none` and the angle returns to 0, so the
  text reads from 12 o'clock. The spin is decoration; holding it still makes the words legible and
  costs nothing. A `controlled` spin still follows its caller, who owns that motion.
- **Press-to-pause is a `LongPress` with `minDuration(0)` on the ring.** It sets the pressed flag in
  both `onBegin` and `onStart` — on the iOS simulator `onBegin` never fired for it, and the ring
  kept turning under the finger until `onStart` set it too — and clears it in `onFinalize`, so a scroll that takes the touch over still resumes the ring. It is a hold, not a
  press action, which is why it is a raw gesture rather than a `Pressable`. `centerContent` sits
  above the ring with `pointerEvents="box-none"`: a button there keeps its own tap, and a touch on
  empty middle reaches the ring.

## Accessibility

- **One text element, the words once.** The non-rotating wrapper of the ring is `accessible` with
  `accessibilityRole="text"` and the label `resolveRingLabel(children, separator)` — separators
  stripped, so "DELACOUR • UI •" is not read "DELACOUR bullet UI bullet", and `repeat` copies never
  reach it. The `Svg` is hidden from assistive technology.
- **`centerContent` is a sibling, not a child of the labelled view,** so an icon button in the
  middle stays independently focusable with its own role.
- Text on a circle is harder to read than a line: keep it at 12pt or more and under ~28 characters
  per half circle.

## Refuses

- **No Skia.** `@delacour/react-native-charts` is an optional peer; depending on it would turn a
  lightweight display component into one that needs a native graphics stack. `TextPath` does it.
- **No per-glyph layout.** Positioning N `Text`s by measured advance needs N layouts and drifts on
  kerning. `resolveGlyphAngles` and `resolveGlyphPosition` are specified and tested as the fallback
  only, and nothing renders through them today.
- **Invalid input renders nothing.** `radius <= 0` or blank text returns `null` and warns once in
  development (`resolveCircularTextIssue`).

## Spikes

Verified on an iOS 26 simulator (iPhone 17) on 2026-10-05:

- **`textLength` / `lengthAdjust`: ignored on iOS.** The fallback above (`resolveFillLetterSpacing`
  from one measured width) is what closes the ring; after it, a full ring closes with an even seam.
- **Uniwind font family inside SVG text: renders.** The ring draws in the theme's sans face, not a
  system fallback.
- **Orientation:** `outside` tops point away from the centre, `inside` toward it with the words
  reading left to right along the bottom; nested rings at different radii line up.
- **Calm motion:** with the OS Reduce Motion setting on, a `loop` holds still at 0° (two frames
  seconds apart are identical, the text starts at 12 o'clock); off, it turns.
- **Press-to-pause:** still under a held finger, turning again after release.
- **Android: not verified on this branch.** No emulator check was run. If Android honours
  `textLength`, the measured spacing and `textLength` agree on the same length, so they should not
  fight — check it when Android is verified.

## Demos and previews

`apps/playground/src/demos/circular-text/`: `seal` (the intended hero), `two-rings`, `arc`, `badge`,
`loading-ring`, `hold-to-pause`, `controlled`.

Six are captured: `seal` (hero) and `two-rings`, `badge`, `hold-to-pause` and `controlled` as
clips, `arc` as a still. `loading-ring` stays gallery-only.

**A spinning clip loops only if it lasts a whole period of the ring's symmetry.** `repeat="fill"`
picks the copy count, so a ring of *n* copies repeats every 360/*n*°, and each flow's `wait:` is sized
so lead + wait + tail equals that period at the demo's speed — seal 4 copies at 24°/s (3.75s),
badge 2 at 24°/s (7.5s), two-rings 3 outer at 20°/s and 2 inner at 30°/s (both 6s, which is why
those speeds). Change a ring's text, radius, size or speed and the copy count or period moves: re-time
the flow, or the clip jump-cuts at the seam. Count copies off the poster, not from the phrase.
