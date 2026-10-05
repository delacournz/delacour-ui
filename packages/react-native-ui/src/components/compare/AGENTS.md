# Compare

Two layers of one frame with a seam the finger drags across — before and after photos, one screen
in two themes, a redesign against the original. Compound root plus `Compare.Before`,
`Compare.After`, `Compare.Handle` and `Compare.Label`.

`import { Compare } from "@delacour/react-native-ui/compare";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/compare` |
| `compare.tsx` | Root: measurement, the pan (and the tap in `anywhere`), state, the controlled sync, `Object.assign` |
| `compare-before.tsx` | `Compare.Before` — the sliding mask and its counter-translated content |
| `compare-after.tsx` | `Compare.After` — the full-frame back layer, never moved |
| `compare-handle.tsx` | `Compare.Handle` — divider, grip capsule, and the whole accessibility surface |
| `compare-label.tsx` | `Compare.Label` — a caption pinned to one side, fading as it is covered |
| `compare.context.tsx` | `CompareContext`, `useCompare()`, `useCompareContext()`, `useComparePart()` |
| `compare.types.ts` | `CompareLayerProps`, shared by Before and After |
| `compare.variants.ts` | The slotted `tv()` and every pure geometry, snap, haptic and a11y resolver; no RN imports |
| `compare.variants.test.ts` | |

## Design

- **Revealed, never squashed.** Both layers are laid out once, at the full frame size. Before is a
  full-frame clip translated `-(1 - p) × size` along the axis with its content translated back by
  exactly as much, so the content never moves relative to the frame. Animating a width instead
  would rescale an image and reflow text on every frame and the halves would fall out of register.
  `resolveRevealTransforms` is the one source of both numbers and a test holds them equal and
  opposite.
- **Two animated nodes, not one.** The mask and its content move in opposite directions; two
  `useAnimatedStyle`s on one view fight for `transform` and the later wins silently. The handle
  likewise carries its position on the band and its grab scale on the capsule.
- **Layers stack by `z-*`, not child order.** After `z-0`, Before `z-10`, Handle `z-20`,
  Label `z-30` — a caller writing `<Compare.After>` first still sees Before on top.
- **Position semantics.** `0` shows only After, `1` only Before. Before always sits on the leading
  side: left, top when vertical, right under RTL (`I18nManager.isRTL`, read once by the root).
- **Colours**: `default`, `primary`, `success`, `warning`, `destructive`, `info` — Slider's set.
  The capsule takes the token and the grip glyph its `-foreground` (`default` is `foreground` /
  `background`). **Sizes** move the handle only: capsule 28 / 36 / 44 on the cross axis.
- **The touch band is 44pt at every size.** Capsule short side plus band padding sit in the same
  compound cell, so a retune of one cannot shrink the target; a test sums them. The band's extent
  is a style from `COMPARE_HANDLE_BAND`, the same number the pan's grab test reads.
- **The divider is a 2pt rule in the colour**, edged by a 1pt `border-background` hairline on each
  side so it stays visible over bright and dark imagery. Nothing casts a shadow; a test sweeps
  every slot at every axis for `shadow-`/`elevation-`.
- **The frame has no intrinsic size.** `className` gives it `aspect-*` or `h-*`; `vertical` needs a
  definite height. `overflow-hidden rounded-lg` by default — `Surface`'s card step, by class only.
- **Not an image component.** Each side takes arbitrary children. The library has no `Image`
  primitive and this does not grow one; that is its own follow-up.

## Gesture

- **One gesture on the root; the handle holds none.** Not a `Pressable`, for Slider's three
  reasons (a nested Tap inside a Pan, an animated style fighting for `transform`, `onPress` on every
  drag). `HapticFeedback` / `playHaptic` come from the `pressable.tsx` leaf.
- **`grab="handle"` (default).** `onTouchesDown` fails the pan (`manager.fail()`) when the touch is
  outside the band, so a vertical flick on the image goes to the scroll view with no dead zone.
  `minDistance(0)` claims a touch on the band at once. `onBegin` repeats the band test (the order
  of `onTouchesDown` and `onBegin` is not something to lean on) and records where on the band the
  finger landed, so grabbing the capsule off-centre does not jump the seam by up to 22pt.
- **`grab="anywhere"`.** Activation is axis-aware — `activeOffsetX(±8)` with `failOffsetY(±12)`
  horizontally, swapped when vertical — so the scroll view wins a cross-axis flick. A tap jumps
  the seam through a separate `Gesture.Tap()` raced against the pan, **not** a write in the pan's
  `onBegin`: `onBegin` also fires at the start of a vertical flick the scroll goes on to win, and
  the seam would jump under every scroll.
- **`shouldCancelWhenOutside(false)`** — a drag that leaves the frame keeps tracking.
- **A `tracking` shared flag gates `onUpdate` and the release.** `onFinalize` fires on paths where
  the drag never began (a failed band test); without the flag those would snap and commit.
- **Snapping applies on release only.** A live-snapping seam feels sticky. The release clamps,
  snaps within `snapThreshold`, ticks if it lands on a point, and springs
  (`damping 20, stiffness 220, mass 0.6`) with the pan's velocity converted to positions per
  second by `resolveReleaseVelocity` (negated for horizontal RTL; `0` for an unmeasured frame or a
  non-finite fling — a `NaN` spring freezes the seam for good).

## State

- **The position is one `SharedValue<number>`** the root owns and the pan writes. React state
  (`useControllableState`) mirrors it **only while tracking**, at percent resolution
  (`quantizePosition`), so a full-frame drag is a hundred commits at most. A release spring is
  drawn, not reported.
- **Release commits the snapped target once**, then `onPositionChangeEnd`. The root remembers the
  value it last sent to the UI thread (`lastWritten`) so the sync effect does not re-animate to a
  value the drag itself produced.
- **A controlled parent that rejects a drag springs the seam back.** Slider's `settledDrags`
  token: bumped on every release so the sync effect re-runs even when `position` did not change.
  The same effect springs the seam to any external `position` change (a button row).
- **`clampPosition` turns `NaN` into the minimum.** A `NaN` in the shared value freezes every
  transform that reads it.

## Accessibility

- **`adjustable` lives on the handle, never the frame**, so the layers stay individually reachable.
  `accessibilityValue` is `{ min: 0, max: 100, now }` plus text from `resolveCompareValueText` —
  "50 percent before", "Showing only after" — the Before layer's share, the number the seam draws.
- **Increment / decrement** call `stepBy`, which runs `stepPosition` → `snapPosition` →
  `clampPosition` from the JS thread, moves the seam, and fires both callbacks. `stepPosition`
  rounds to six places so ten tenths land on exactly `1`.
- **Naming.** The root's `accessibilityLabel`, else an enclosing `Field.Label`'s text. With neither,
  a development warning fires — "unnamed adjustable" — deferred a tick, because a `Field.Label`
  registers its text in an effect after the first commit.
- **`Compare.Label` is hidden from assistive tech.** A plain-string child registers with the root
  and substitutes into the value text ("50 percent Original"), so the name is heard once, attached
  to the number.
- **A fully covered layer leaves the tree** (`importantForAccessibility="no-hide-descendants"`,
  `accessibilityElementsHidden`) via `resolveCoveredLayer` — otherwise it is focusable while drawn
  in no pixel. Layers are otherwise content; the author labels their images.
- **`isDisabled`** (or an enclosing `Field`'s) turns the gesture off, ignores assistive actions,
  fades the handle and sets `accessibilityState.disabled`.

## Motion

- **Unmeasured frame.** Before's mask and the handle band render `opacity: 0` until `onLayout`
  gives a size — otherwise Before covers the frame for a frame on every mount (Slider's flicker
  rule).
- **Grab** scales the capsule 1 → 1.08 through a `useDerivedValue` spring, evaluated when the grab
  changes rather than every frame of the drag, and plays the haptic once.
- **Haptics** (`haptic`, default `"selection"`, `false` silences): on grab, and from
  `shouldTickCompareHaptic` — on **arriving** at a snap point (entering its ±0.01 dead band, or
  leaping across it in one frame) and on reaching either bound. Never per frame; a finger resting
  on a point does not buzz.
- **Calm motion** (`useCalmMotion()` — reduce motion or `isMotionCalm`): no release spring — the
  seam lands in one frame; no grab scale; external and assistive changes jump. The drag itself
  still follows the finger, since that is the behaviour rather than decoration.
- **Worklet hygiene.** Every exported worklet in `compare.variants.ts` is flat (calls no sibling).
  The root's local worklets are declared inside the gesture's `useMemo`, beside their callers, and
  `scheduleOnRN` — never `runOnJS` — crosses back.

## Inside a scroll view

`Screen.ScrollArea` is React Native's `ScrollView`, which has no handler to negotiate with. In
`grab="handle"` the band claims its touch at `minDistance(0)` and fails everything else, so the
scroll keeps the rest of the frame. On iOS a `ScrollView` delays content touches; pass
`delaysContentTouches={false}` for an instant grab, as Slider's docs say.

## Not here

- No `Image` primitive, no blur-up, no zoom — `onPress` on the media is the app's.
- No live snapping, no keyboard step (no hardware-keyboard surface in React Native).
- No import of any sibling media component; compose through children.

## Previews (follow-up)

No demo carries `capture` yet: a captured demo with no manifest entry fails `demos.test.ts`, and the
media are shot after integration. The five to capture: `anatomy` (**hero**), `themes`
(`align: "stretch"`), `vertical`, `snap-points` and `colours-and-sizes` (`align: "stretch"`);
`anatomy`, `vertical` and `snap-points` are clips whose flows drag the handle by its `testID`
(`compare-*-handle`). Add the `<Preview>` blocks to `compare.mdx` in the same change — a
`<Preview id>` for an uncaptured demo throws at render.
