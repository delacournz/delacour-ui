# Slider

A value picked by dragging along a track — one value, or a range. Compound root
plus `Slider.Output`, `Slider.Track`, `Slider.Fill` and `Slider.Thumb`. The
package's first drag-driven control, and its first `Gesture.Pan()`.

`import { Slider } from "@registry/ui/slider";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@registry/ui/slider` |
| `slider.tsx` | Root + the `Object.assign` compound surface |
| `slider-output.tsx` | `Slider.Output`, the `Text.Label` readout |
| `slider-track.tsx` | `Slider.Track` — owns the pan, the measurement, the haptic |
| `slider-fill.tsx` | `Slider.Fill` |
| `slider-thumb.tsx` | `Slider.Thumb`, and the whole accessibility surface |
| `slider.context.tsx` | `SliderContext`, `useSlider()`, `useSliderContext()`, `useSliderPart()` |
| `slider.types.ts` | Prop types shared by two or more parts |
| `slider.variants.ts` | Pure `tv()` slots + the geometry worklets, no RN imports |
| `slider.variants.test.ts` | |

## Design

- **Colours**: `default`, `primary`, `success`, `warning`, `danger`, `info` —
  Badge's and Checkbox's set. **Sizes**: `sm`, `md`, `lg`, driving the groove's
  thickness, the thumb's diameter and the readout's type step.
  **Orientations**: `horizontal`, `vertical`.
- **The anatomy is written out, never assembled from props.** A range's thumb
  count is *data*, so `Slider.Track` takes a function and is handed the settled
  state to map over. [Radio](../radio/AGENTS.md) composes its own indicator in
  because a radio has exactly one; a slider does not know how many it has until
  it is told.

## Gesture

- **The root is not a `Pressable`, and neither is the thumb.** Three reasons and
  all of them structural. [Pressable](../pressable/AGENTS.md) mounts a
  `Gesture.Tap()` whose `onEnd` fires `onPress`, so every tap-to-position would
  also fire a press. Its root `Animated.View` already owns `opacity` and
  `transform` through a `useAnimatedStyle` of its own, and the thumb's position
  *is* a `transform` — two animated styles on one node fight for the same prop,
  the rule `Radio.Indicator` states and the reason `Radio` takes no `asChild`.
  And a thumb wrapped in its own `Pressable` would nest a descendant `Tap`
  inside the track's ancestor `Pan`, leaving two recognisers to negotiate for
  one drag. What is inherited is the *vocabulary*: `HapticFeedback` and
  `playHaptic` come from `pressable.tsx`, which is exported for exactly this —
  one haptic switch in the library, never a second.
- **`Slider.Thumb` holds no gesture at all.** One pan on the track drives every
  thumb, because a press 40pt along an empty groove should still lift the thumb it
  is about to move, and a per-thumb gesture cannot know that. The grabbed scale is
  therefore driven by an `activeIndex` shared value the track writes, not by a
  press state the thumb owns.
- **The value is written in `onBegin`, not only in `onUpdate`.** This is the one
  that will bite a rewrite. A pan activates on the first *movement*, so a
  stationary tap never reaches `onStart` or `onUpdate`: a slider that computed
  only there would tick, lift its thumb, and then not move it. `onFinalize` is
  likewise where the drag is reported finished, because it is the only callback
  that fires on every path, the never-activated one included.
- **`minDistance(0)` is what wins the touch from a scroll view**, and it is not
  tuning. `Screen.ScrollArea` renders React Native's own `ScrollView`
  (`Animated.ScrollView`), not Gesture Handler's, so there is no sibling handler
  to negotiate with — the two race, and a pan that activates on the first move
  beats a scroll view's ten-point slop on both platforms. Which is also why there
  is **no `activeOffsetX`**: waiting for the axis to declare itself hands the
  scroll the first move and puts a dead zone at the start of every drag.
  **`blocksExternalGesture` is not the escape hatch it looks like** — it resolves
  a ref to a handler tag, a plain `ScrollView` has none, and Gesture Handler drops
  the call without an error. If Android ever hands a drag to the scroll anyway,
  the documented fix is a nested `GestureHandlerRootView` around the slider, not
  an offset filter.
- **`shouldCancelWhenOutside(false)`**, where `Pressable`'s tap sets it `true`.
  Dragging a thumb to the far end routinely leaves the track's bounds, and the
  value has to keep tracking rather than the gesture giving up half way.
- **On iOS, a slider inside a scroll view feels late until
  `delaysContentTouches={false}`.** UIScrollView's default holds touch delivery to
  its descendants for about 150ms while it decides whether the touch is a scroll.
  Nothing inside this component can reach that — it is a prop on the scrollable,
  so it belongs at the call site.
- **The groove is not the touch target on its own.** A `sm` track is sixteen
  points, so the drag is claimed on a transparent `touchArea` whose padding brings
  it up to 44. The thickness and that padding live in the **same compound cell**,
  because they are one number: they sum to 44 at every size, and a test asserts
  the sum rather than the parts so the ladder can be retuned without the test
  becoming a transcript of it. Split them across two variants and a retune of the
  thickness silently shrinks the target.
- **That padding is on the cross axis only**, and this is the load-bearing half.
  The two boxes share an origin along the axis the value is measured on, so the
  pan reads its offset straight off the touch with no gutter to correct for. Pad
  the main axis and every value is wrong by the padding, silently, and visibly
  only at the ends.

## Colour

- **The colour paints the fill, the capsule and the knob — never the groove.**
  An empty groove is the same chrome at every colour, the way an unticked
  checkbox is `border-input bg-card` however it is coloured, and a test asserts
  that. Invalid outranks the colour on all three, the precedence
  [Checkbox](../checkbox/AGENTS.md) sets on its border.
- **The capsule takes the fill's own colour, and the knob takes that colour's
  `-foreground`.** The first is what makes the handle read as the leading end of
  the fill rather than as something sitting on top of it — same colour, no seam.
  The second is rule 11 doing its job: a single pale knob would be unreadable on
  `warning`, whose foreground is near-black, so the knob follows the surface it
  sits on. A test pins the pair rather than trusting two maps to stay in step, and
  checks every token it names exists in both variants of `theme.css`.
- **`default` and `primary` name different tokens this theme tunes to the same
  value.** `foreground` is the page's ink and `primary` is the brand's action
  colour; both are `#262626` today, which is the situation
  [Badge](../badge/AGENTS.md) already documents for its neutral end. Collapsing
  them into one token would be the drift, not the duplication — an app that
  re-themes `primary` to blue wants `color="primary"` blue and `color="default"`
  still ink. A test pins that the four *semantic* colours stay distinct from
  each other and from both neutrals, and that every token named is declared in
  **both** variants of `theme.css`.

## The handle

- **The handle is two nodes: a capsule and a knob.** The capsule carries the
  colour, the size and the position; the knob is the pale bar inside it, held off
  the capsule's edge by its padding, and the only thing that moves when a finger
  lands. One node could not be both the surface and the thing inset within it.
- **Neither takes a shadow**, and the capsule takes no border either. Nothing else
  in this package draws a shadow, and React Native's shadow props diverge between
  platforms in a way a flat fill does not; a test sweeps the whole matrix for the
  absence. The capsule is a solid block of the fill's colour, so its edge is
  already the boundary between the fill and the groove — a border would be a
  second line drawn over one that is already there.
- **The capsule is flush across the track and longer along it.** The flush half is
  geometry rather than decoration: it is what lets `fillExtent` land exactly on
  both extremes — one capsule's length of fill at the minimum, so the handle covers
  it completely and a slider at rest shows a plain groove; the track's full length
  at the maximum, with no sliver past the handle; and one capsule's length again
  for a collapsed range, so the fill does not blink out from under two handles
  dragged together. Inset the capsule inside the track by any padding and every one
  of those is off by the inset, at every size. The long axis is two steps up from
  the short one, which is what makes a handle you can tell apart from the groove.
- **Both are plain spacing steps, not tokens.** They are numbers read in one
  component, which is the trade `Radio` already makes for the dot inside its ring.
  `Checkbox` reads `--spacing-icon-*` for its square and should keep doing so: a
  glyph in a box is a mark on the icon scale, where a slider's handle is the body
  of the control itself. This is why the handle stopped reading that scale.
- **The capsule's size lives in the same six compound cells as the track's
  thickness**, not in a `size`-only variant, because its two axes differ and only
  the orientation knows which is which.

## Geometry

- **The track still centres the thumb, and now has nothing to centre.** An
  absolutely-positioned child with no cross-axis inset is placed at the static
  position the parent's `items-center` decides. That did the work while the thumb
  overhung a hairline groove; it is a no-op now the two are the same size. It
  stays because it is load-bearing again the moment those sizes are allowed to
  differ, and because it is why the track is `flex-row` when horizontal:
  `items-center` centres on the *cross* axis, and a column track would centre the
  wrong one.
- **Every length is measured, never tabulated.** `trackSize` and `thumbSize` come
  from their own `onLayout` — `size-5` cannot be read from JavaScript, and a
  table of numbers here would be `tokens.css` restated in TypeScript, the drift
  `tokens.test.ts` exists to catch everywhere else. A measured `0` therefore means
  **not measured yet**, never "a track with no length": every geometry helper
  guards `travel <= 0` and the thumb renders at `opacity: 0` until the track has
  reported, because a thumb drawn before then sits at a garbage offset for a frame
  and reads as a flicker on every mount.
- **The fill runs to the thumb's far edge**, which is the `+ thumbSize` in
  `fillExtent` and the reason both extremes come out exact. It used to stop at the
  thumb's *centre*, which was correct but invisible while a large disc overhung a
  hairline groove; with the thumb now the same size as the track, a half-thumb of
  bar would sit unfilled at the maximum in plain view. A lone thumb fills from the
  start of the track, because that is what a single value means; a range fills
  *between* its thumbs, because the ends are what the caller excluded. The extent
  is floored at one thumb so a collapsed range never disappears.
- **The pixel arithmetic is a function, not four lines in `slider-fill.tsx`.**
  `fillExtent` earns its place because what it encodes is not self-evident — it is
  the whole justification for the thumb's size — and inline in a `.tsx` no test
  could reach it. `travel` and the touch's `position` are the opposite case and
  stay written out: `trackSize - thumbSize` and `along - thumbSize / 2` appear in
  three files and are self-evident, and routing them through a cross-module
  worklet would add a call in three per-frame paths to hide arithmetic nobody
  would get wrong.
- **The vertical axis turns around in exactly two places**: `valueFromOffset`'s
  inversion and the sign of the thumb's translate. Not in a `flex-col-reverse` —
  the fill and the thumb are absolutely positioned, so a `flexDirection` never
  reaches them, and a reversed column flips every `justify-*` inside the track as
  well. A test asserts the two orientations are mirror images, reading a vertical
  track from the far end and a horizontal one from the near end and demanding the
  same value. A vertical slider needs a **definite height** from its parent.

## Value and state

- **Both ends of the range are always stops**, even when the step does not divide
  it. 0–100 by 7 reaches 0, 7, 14 … 98 and then 100, because a slider whose
  maximum cannot be reached by dragging all the way to the end is a slider that
  lies about its own range. A tie goes to the regular stop, so the extra one only
  ever appears at the very end of the drag.
- **Snapping happens on the UI thread, and that is what bounds the re-renders.**
  `positions` holds *snapped* values, so the mirror back to React fires on a
  step crossing rather than on a frame — a full-width drag at the default step
  is a few dozen commits, not a hundred and twenty a second. `step={0}` is
  continuous and does re-render per frame; that is the trade for
  `formatOptions`, since `Intl` is not available to a worklet and a readout
  derived on the UI thread could not format a currency. If it ever profiles
  badly the escape hatch is an `Animated.Text` fed by a `useDerivedValue`, which
  [Text](../text/AGENTS.md) already renders.
- **`positions` is one `SharedValue<number[]>`, reassigned and never mutated.**
  One shared value per thumb is not available — a thumb count is data and hooks
  cannot be called in a loop — so the array is the shape. `positions.value[0] = x`
  updates nothing and fails **silently**: an array element has no setter behind
  it. Always build a new array and assign it.
- **A drag stops the root syncing the shared value from React state.** The mirror
  hop back would otherwise round-trip through a render and land on the thumb a
  frame late, dragging it backwards on every commit — a jitter only a fast drag
  reveals. The guard is a ref, because nothing renders differently for it. Its
  counterpart is `settledDrags`, a counter bumped on release whose only job is to
  give the sync effect something to re-run on: a **controlled parent that rejects
  a dragged value** leaves `current` unchanged, and without the token the thumb
  would stay where the finger let go instead of snapping back.
- **The shape is the caller's, and it is locked on first render.** A slider given
  a number reports a number; one given an array reports an array. Switching warns
  in development and follows the caller, the lock-and-warn `useControllableState`
  already runs for controlled versus uncontrolled — a slider that silently started
  reporting an array to a caller holding a number is a bug with no error attached.

## Haptics

- **The haptic is rate-limited by distance, not by a clock.** "Tick when the
  snapped value changed" is not a limit on its own: 0–100 in whole steps across a
  300pt track is a step every three points, and a flick crosses a hundred of them
  in a fifth of a second — a buzz, and a hundred synchronous calls into the haptic
  engine to produce it. `shouldTickHaptic` gates on `SLIDER_HAPTIC_MIN_TRAVEL`,
  which keeps the rule pure so `bun test` reaches it and makes it degrade the right
  way: a coarse scale ticks on every stop, a fine one thins to a cadence a hand can
  feel. Either **end** of the range always ticks — it is the one moment a slider
  has something to say the screen does not already show. The grab itself always
  confirms, the way a press does. A continuous slider never ticks, because there
  is no stop to land on.

## Accessibility

- **`accessibilityRole="adjustable"` on the thumb, and this is the package's first
  `accessibilityValue`.** It is not polish: the thumb holds no gesture, so without
  `accessibilityActions` and `onAccessibilityAction` there is no assistive path to
  the value **at all** — a VoiceOver or TalkBack swipe would have nothing to call.
  The increment steps by `step`, or by a tenth of the range when the slider is
  continuous. `updateValue` is the one way into the value that has no gesture
  behind it, and it runs the same snap and the same clamp the pan does.

## Worklets

- **A worklet crosses back to JS with `scheduleOnRN`**, never `runOnJS` — see
  [Pressable](../pressable/AGENTS.md). `onFinalize` queues `setDragging(false)`
  *before* `commitEnd`, and the order is load-bearing: the root has to have
  stopped treating this as a live drag before it is asked to re-sync.
- **Every exported worklet in `slider.variants.ts` is flat.** None of them calls
  another. A module-scope worklet is rewritten into a factory call that runs at
  import time in source order, so a worklet calling a sibling works only while
  the sibling happens to be declared first — and a tidy-up that reorders the
  file crashes the UI thread with `undefined is not a function`. That is the
  real shape of the `clampUnit` incident the [Screen](../screen/AGENTS.md)
  section records: not "cross-module is unsafe" — `screen.variants.ts`'s own
  resolvers are imported into `useAnimatedStyle` and work — but "a module-scope
  worklet must not depend on one declared below it". The pan's own shared helper
  lives *inside* the `useMemo` beside its callers, where ordinary closure
  capture applies.

## Axes

- **There is no `Slider.Group`**, so the axis ladder is two rungs rather than
  three: the slider's own props, then an enclosing [Field](../field/AGENTS.md).
  A `Field` reaches the two *state* axes only, and a test pins that it cannot
  acquire a paint axis by accident. The slider does **not** register
  `field.registerPress` the way a `Checkbox` does — a row-wide press has no
  meaning for a control whose value is a position.
