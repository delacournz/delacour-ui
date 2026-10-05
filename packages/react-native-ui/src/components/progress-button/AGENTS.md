# ProgressButton

A button that has to be **held**, not tapped. A fill grows from the leading edge for
`holdDuration`, and the action fires when it reaches the end. Compound root plus
`ProgressButton.Label` and `ProgressButton.Done`. For an irreversible action that would
otherwise need a confirmation dialog — erasing, paying. Two taps in a row are a rhythm a hand
falls into; a two-second hold cannot be done by accident or by habit.

`import { ProgressButton } from "@delacour/react-native-ui/progress-button";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/progress-button` |
| `progress-button.tsx` | Root + the `Object.assign` compound surface: the gesture, the fill, the two label layers, the done mark |
| `progress-button-label.tsx` | `ProgressButton.Label`, coloured by the layer it renders in |
| `progress-button-done.tsx` | `ProgressButton.Done`, the default tick or the caller's content |
| `progress-button.context.tsx` | `ProgressButtonContext`, the layer context, `useProgressButton()` |
| `progress-button.variants.ts` | Pure `tv()` slots, colour tables, and the hold, playback, stepping and reset resolvers |
| `progress-button.variants.test.ts` | |

## Design

- **Variants**: `primary`, `secondary`, `destructive`, `success`. **Sizes**: `sm`, `md`, `lg`.
  **Shapes**: `pill` (default), `rounded`. There is no square `icon-*` size: a hold has to
  say what it does, and a glyph alone cannot carry "hold to erase".
- **The box is the button's box.** `h-button-*`, the button's `px-*`, `text-button-*`,
  `size-icon-*` and, as a pill, `rounded-button-*` — the tokens `buttonVariants` reads, and a
  test pins them equal to the button's own, so the two sit level in a row and a retune moves
  both. `rounded` is the card corner, `rounded-lg`, so the button sits square with a
  `Button` given the same class beside it. No token is minted.
- **Every variant rests on `bg-secondary` and carries its colour in the label and the fill.**
  A resting button that is already solid red has nothing left to say when the fill arrives.
  `secondary` fills with `foreground` and draws its inner label on `background`, because a
  `secondary` fill on a `secondary` surface would not be seen and `secondary-foreground` on a
  `foreground` fill is the same colour twice. The three colour tables are exported and a test
  checks every token in them exists in both themes.
- **The label is drawn twice.** Once on the surface in the variant colour, once inside the
  clipped fill in the variant's foreground, laid out at the button's **measured** width
  (`onLayout`), so both copies wrap identically and the wipe's edge cuts through a glyph. A
  single label under a translucent wash goes muddy exactly at the boundary, which is where
  the eye is. A test asserts the two label slots differ in colour and nothing else.
  `ProgressButton.Label` reads which copy it is from a layer context rather than a prop the
  caller would have to repeat; a composed `Icon` takes the layer's colour through
  `IconDefaultsProvider`, the same mechanism `Button` uses.
- **The fill's copy and the done mark are hidden from assistive technology.** The root is the
  one accessible element; announcing the label twice would be the fill's bookkeeping leaking
  into a screen reader.
- **Bare strings are wrapped in a `ProgressButton.Label`**, consecutive ones collapsing into
  one, for the reason `Button` gives: React Native crashes on text outside a `<Text>`.
- **`ProgressButton.Done` is lifted out of the children by type** and drawn over the full fill.
  With none written the root draws one, which is a full-size `IconCheckmark2` at `size-icon-*` (the `Small` glyph, alone on a button, read as a speck) in
  the fill's foreground. A caller's `Done` replaces it whole.

## Behaviour

- **The gesture is a pan with no minimum distance**, `onBegin` to `onFinalize`. A long-press
  gesture fires once and cannot tell "still holding" from "held long enough".
  `shouldCancelWhenOutside(false)`, and a finger may drift 16pt
  (`PROGRESS_BUTTON_MAX_DRIFT`) before the hold lets go, because a hand resting on a control for
  two seconds moves.
- **Pressing runs the fill toward 1 over what is left** — `holdDuration × (1 − p)` — so a second
  attempt resumes rather than restarting. **Releasing runs it back over what is filled** —
  `holdDuration × p` — the same rate, played backwards, never a snap to empty.
  `resolveRemainingDuration` is the tested copy; the worklets restate it inline because a
  worklet body must be self-contained.
- **Completion is read from the animation**, in the timing's finish callback (`finished` at 1),
  then crosses to JS with `scheduleOnRN`. Never a JS `setTimeout` running alongside: two clocks
  disagree under load, and the one the user can see is the fill. There is no tolerance near the
  end — released at 99%, nothing fires.
- **Completed, it is locked.** A shared `isLocked` flag makes the gesture ignore further presses
  and stops a release from draining a finished fill, until a reset: `isAutoReset` after
  `autoResetDelay` (a timer is fine here — it schedules the reset, not the completion), or a
  controlled `isCompleted` going `false`. **A reset travels** back over
  `PROGRESS_BUTTON_TRAVEL_MS` scaled by how full the fill is; it is never set to 0. A completion
  set from outside travels forward the same way.
- **Controlled, the caller has to accept a hold in the same update.** A completed hold calls
  `onCompletedChange(true)` and `onComplete`. If `isCompleted` is still `false` once those have
  run, the fill travels back — the caller declined. The alternative, sitting full and locked
  until the prop changes, leaves a caller who declines with no prop change to make, so the
  button would be stuck. A caller with async work accepts at once (`isCompleted` true) and shows
  progress in a custom `Done`, then sets `false` to rewind on failure; the `controlled` demo does
  exactly that.
- **Haptics are off by default.** `haptic` plays when the hold takes, and a `success` knock
  follows on completion, both from the UI thread through `playHaptic`.
- **`isDisabled`** fades the button (`opacity-50`) and turns the gesture off, so the fill never
  starts. A hold in progress when it flips is cancelled and plays back.

## Reduced motion

- **The fill steps in fifths instead of sweeping.** `Math.floor(p × 5) / 5`, applied in the
  animated style, rounding **down** so it never shows more than the hold has earned. It stays an
  indicator, because a control that asks you to wait and shows nothing is broken.
  `resolveSteppedProgress` is the tested copy.
- **Every timing opts out of the reduce-motion policy** (`ReduceMotion.Never`). Under the default
  policy Reanimated completes a timing instantly when the setting is on — so a two-second hold
  would complete on touch-down, which is the one thing this component exists to prevent. The
  stepping is what reduces the motion; the clock underneath has to keep real time.
- **The done mark fades without scaling** under reduced motion.

## Accessibility

- `accessibilityRole="button"`, `accessibilityHint` (default: "Press and hold to confirm"), and
  `accessibilityState={{ disabled, checked: isCompleted }}`.
- **Decision: activate completes.** The root declares an `activate` accessibility action, and a
  screen reader's activate completes the button outright. A screen reader cannot hold, the hint
  has already announced what the button does, and refusing would leave the action unreachable
  for anyone using one. The slide-to-confirm control makes the same call.

## Out of scope

- An `icon-*` square size, and a loading state of its own — a caller shows work in a custom
  `Done`.
- Progress that is not time-based (a fill driven by an upload). That is `Progress`.
- Cancelling a completed hold from inside the button. Reset is `isAutoReset` or the caller's.
