# SlideButton

A control confirmed by dragging a handle across a rail — "Slide to ship", "Slide
to transfer $240". For an action that deserves deliberation where a dialog would
be too much ceremony. Compound root plus `SlideButton.Label` and
`SlideButton.Thumb`.

`import { SlideButton } from "@delacour/react-native-ui/slide-button";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/slide-button` |
| `slide-button.tsx` | Root, the gesture, the internal trail, and the `Object.assign` compound surface |
| `slide-button-label.tsx` | `SlideButton.Label` |
| `slide-button-thumb.tsx` | `SlideButton.Thumb`, and the internal chevron-to-tick glyph |
| `slide-button.context.tsx` | `SlideButtonContext`, `useSlideButton` |
| `slide-button.variants.ts` | The slotted `tv()`, the motion constants and the pure resolvers |
| `slide-button.variants.test.ts` | |

There is no `slide-button.types.ts`: every prop type has exactly one consumer.

## Design

- **Variants**: `secondary` (default), `destructive`, `success`. **Sizes**:
  `sm`, `md`, `lg`. Plus `isFullWidth` and `isDisabled`.
- **There is no `primary` variant.** The handle is neutral, so a primary rail
  with a neutral handle draws the same picture as `secondary` in any theme whose
  primary sits close to its foreground — the default palette included. Two names
  for one look is a choice a caller cannot see the difference in.
- **The rail is a button's box.** `h-button-*` and `rounded-button-*` at each
  size, so a slide button stacks level with a `Button` or a progress button in
  the same column. A test pins the classes; it names a TODO for the category
  lead to compare against `progressButtonVariants` directly once that lands.
- **The handle is neutral in every variant** — `bg-background` with a
  `border-border` hairline, inset 4pt, about 1.6× as wide as it is tall. Only the
  rail, the trail and the label carry the variant. A coloured handle on a
  coloured trail would disappear into its own wake.
- **The handle's width is measured, not tabulated.** `resolveSlideHandleWidth`
  reads the rail's laid-out height, so a consumer who retunes
  `--spacing-button-*` keeps the handle in proportion.
- **The trail ends under the handle's middle, not at its rear edge.** A stadium's
  rear is a curve; a trail stopping at the straight edge leaves a sliver of rail
  above and below it. Ending under the handle reads as one shape — the handle
  dragging its colour along — while still sharing an edge with it as seen.
- **The trail is invisible at rest.** It fades in over the first 8pt of travel
  (`resolveSlideTrailOpacity`). Ending under the handle's middle, it would
  otherwise peek out behind the resting handle's rear curve — a coloured sliver
  that makes an untouched control look half-started.
- **The label changes colour where the trail covers it.** A second copy in the
  trail's foreground (`labelOnTrail`) is clipped to the trail's width
  (`resolveSlideTrailWidth`, shared with the trail). A state variant's trail is
  its full colour, and the soft label colour on it is the same hue on the same
  hue: the words vanished exactly where the trail reached them.
- **The label keeps a handle's width clear on both sides**
  (`resolveSlideLabelGutter`). Symmetric, so it stays centred; a long label
  truncates before it runs under the resting handle.
- **The label is centred in the whole rail and never fades or moves.** The handle
  passes over it. A label that faded would leave the control saying nothing for
  the second half of the gesture, the half where the hand most wants to know what
  it is confirming.
- **The handle tracks the finger 1:1; only the release is sprung.** Any easing on
  the way out would make the handle lag the thumb, which reads as resistance.
- **A release confirms on look-ahead *and* reach.** `resolveSlideRelease`
  projects the release `velocity × 0.08s` ahead; it confirms only when that
  projection reaches the threshold **and** the hand itself got within 0.25 of it.
  The second condition is what stops a hard flick from halfway: the habit-driven
  swipe this control exists to refuse.
- **`threshold={1}` has no shortcut at all.** Only a release within half a point
  of the far end confirms. That is the setting for something irreversible.
- **`onComplete` fires the moment the release confirms**, alongside the handle's
  spring to the end — not when the spring settles. A spring can be interrupted
  (an unmount, a re-layout), and a confirmation that hung on its callback could
  be silently lost.
- **A requested completion holds the handle at the end.** Controlled, the release
  reports `onCompletedChange(true)` and the handle waits at the end until
  `isCompleted` answers. Springing back while the caller's work is in flight
  would read as a refusal. `isCompleted` going false springs it home; true keeps
  it there with the tick.
- **A rejected promise takes the handle home.** `onComplete` may return a
  promise. If it rejects, the button reports `onCompletedChange(false)` and the
  handle springs back, so a failed request never looks confirmed and a
  controlled caller has a way out of the pending state that does not need a
  `true` it never meant.
- **Disabled refuses the drag outright.** The handle does not move at all. A
  handle that followed and sprang back would read as a failed slide rather than
  a refused one.
- **Disabled still claims the drag.** The pan stays enabled and every callback
  returns early. A disabled recognizer lets the touch fall through to whatever
  is behind it — inside a stack with a full-screen back swipe, dragging a
  disabled slide navigated back. Found on the simulator.
- **One `Gesture.Pan()` on the rail, `activeOffsetX ±8`, `failOffsetY ±12`.** A
  vertical scroll that starts on the rail fails the pan first, so the control
  survives inside a vertical `ScrollView`. A cancelled pan returns home.
- **RTL flips with `I18nManager.isRTL`.** Every positioned part uses logical
  insets (`start-*`), the translation and the drag are multiplied by `-1`, and
  the chevron becomes `IconChevronLeft`.
- **Haptics are off by default.** `haptic` names the tick played the first time
  a drag crosses the threshold (re-armed if it drops back under); a `success`
  knock follows on commit. Both are worklet calls, in the frame that earned them.
- **Reduced motion keeps the travel.** Springs become a 180ms `withTiming`. The
  handle still moves to the end: a confirmation control that showed nothing on
  confirming would be broken.
- **The chevron crosses into a tick** — opacity and a quarter turn, 180ms, off
  one shared value. Children on `SlideButton.Thumb` replace both marks.
- **Screen readers confirm with one action.** The rail is a `button` whose label
  is the `SlideButton.Label` text (or an explicit `accessibilityLabel`), with an
  `activate` action labelled by `accessibilityActionLabel` — default "Confirm";
  pass an imperative that names the outcome, "Ship order". Activating moves the
  handle to the end and fires `onComplete`. `accessibilityState` carries
  `disabled` and `checked: isCompleted`.
- **The thumb is drawn last however it was written**, and composed in when the
  children hold none — `Switch`'s rule. Part detection checks `displayName` as
  well as identity, for the reason `Switch` documents.

## Out of scope

- A `primary` variant — see above.
- A vertical slide.
- A label that changes on completion. The caller swaps the label's text from
  `isCompleted` if they want one.
