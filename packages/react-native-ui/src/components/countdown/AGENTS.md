# Countdown

Time left until a fixed moment — a sale ending, a launch, a booking hold. A
styled wrapper (pattern A) with two internal parts: segmented boxes of sliding
digits, or one inline run of text.

`import { Countdown } from "@delacour/react-native-ui/countdown";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/countdown` |
| `countdown.tsx` | Root + the `Object.assign` surface; picks the variant and owns accessibility |
| `countdown-segment.tsx` | Internal `DelacourUI.Countdown.Segment` — one unit's box: digit columns over a caption |
| `countdown-digit.tsx` | Internal `DelacourUI.Countdown.Digit` — one clipped column whose digit slides on change |
| `use-countdown-clock.ts` | The tick: wall-clock reads, second-aligned timeout, `AppState` re-read, `onTick` / `onComplete` |
| `countdown.variants.ts` | Slotted `tv()` + every pure resolver — split, trim, format, label, tick alignment, urgency |
| `countdown.variants.test.ts` | |

No context and no `countdown.types.ts`: the parts are internal, take their
values as props, and share no type that `countdown.variants.ts` does not already
export.

## The clock

- **It reads the wall clock on every tick, and never decrements a counter.**
  A decremented counter is wrong the moment a tick is late — a stalled
  JavaScript thread, a backgrounded app, a sleeping device — and stays wrong.
  `secondsUntil(to, now)` is recomputed from `to - now` every time, so the
  count is only ever as stale as the last read.
- **Seconds round up.** `Math.ceil((to - now) / 1000)`, clamped at zero. The
  final second reads `0:01`; `0:00` appears only when time is actually up.
  Rounding down would show `0:00` for a whole second before anything happened.
- **One `setTimeout`, aimed at the next whole-second boundary of `to - now`.**
  `msUntilNextTick` computes it, and the hook re-aims after every fire. A
  `setInterval` started at an arbitrary phase drifts and can sit up to a second
  behind the boundary it is meant to show; a timeout that fires early simply
  re-reads, finds nothing changed and aims again.
- **`AppState` → `active` re-reads immediately.** Timers do not run in the
  background, so without it a countdown left for thirty seconds would come back
  showing the time it was left at until its next tick.
- **`onComplete` fires once per `to`.** The hook remembers the target it fired
  for; a new `to` re-arms it. A new `to` also resets the count in the same render
  (state is keyed by target), so the old count is never paired with the new
  target — that pairing would fire `onComplete` for a `to` still in the future.
- **`now` is injectable** for tests and demos, and the callbacks are held in a
  ref updated after each render, so an inline `now` or `onTick` does not restart
  the timer on every render.

## Units

- **The largest selected unit absorbs everything above it.**
  `units={["hours", "minutes"]}` shows `48` hours for two days — dropping the
  days would read as a countdown with two days fewer on it.
- **The smallest selected unit rounds up**, by the same rule as seconds: hours
  and minutes with thirty seconds left read `0:01`, never a `0:00` that claims
  time is up while it is not.
- **Units are ordered and deduplicated by `resolveCountdownUnits`**, however
  they were listed; none, or an empty list, is all four.
- **`trim` drops leading zero units, never below the smallest two selected.**
  `2d 00:03` is not news, but a lone `59` could be anything — the final minute
  still reads `0:59`. A zero in the middle is kept: `2d 00:03:22` stays.

## Variants

- **`segmented`** — each unit a `rounded-md` `bg-muted` box (not `Surface`:
  a box is a fill, not a card, and the surface ladder's nesting rule would step
  it relative to whatever it sits in) with tabular digits and a
  `Text`-`caption` label beneath. No separators — the gaps do the work.
- **`inline`** — one `Text` run, `2d 14:03:22` / `14:03:22` / `3:22`. Days lead
  with a `d`; the rest are colon-joined, padded to two digits after the first.
  It does not slide: a run inside a sentence has no columns to clip.
- **`size` steps the digit preset and the box padding** — `sm` → `header`,
  `md` → `title`, `lg` → `display` (`COUNTDOWN_DIGIT_TEXT_VARIANT`). The digits
  use `<Text variant=…>`, never `Text.Header` / `.Title` / `.Display`: those
  presets announce as headings.
- **Digits are `tabular-nums`.** Proportional figures make a `1` narrower than
  an `8`, and the whole row would jitter sideways on every tick.
- **Urgent is `text-destructive` on the digits**, on the `Text` (rule 1), at or
  below `urgentBelow` seconds. The caption keeps its muted colour.

## Motion

- **A changed digit slides; an unchanged one never moves.** Each digit is an
  `Animated.View` keyed by its value inside a clipped column: a change unmounts
  the old one (`FadeOutDown`, slides down and out) and mounts the new
  (`FadeInDown`, enters from above). Columns are keyed by place counted from the
  right, so the ones column stays the ones column when an absorbing unit gains a
  digit.
- **Nothing slides on the first render.** `LayoutAnimationConfig skipEntering`
  wraps the digits; a list of countdowns does not replay every digit as rows
  mount.
- **`useCalmMotion()` turns the slide off — reduce motion or `isMotionCalm`.**
  The tick is not decoration and keeps running either way; only the slide is
  stilled, so an E2E runner waiting for the screen to settle is not held up a
  quarter-second every second.

## Accessibility

- **One accessible element, `accessibilityRole="timer"`.** The digits are
  hidden (`accessible` root on iOS, `importantForAccessibility=
  "no-hide-descendants"` on the row for Android), so VoiceOver never reads
  `2`, `1`, `4`, `Hours` one cell at a time.
- **The label is coarse, so it does not chatter.** Above one minute it names
  days, hours and minutes — `2 days, 14 hours, 3 minutes left` — and changes at
  most once a minute; in the final minute it counts seconds. Zero is
  `Time is up`. `resolveCountdownAccessibilityLabel` owns the rule, and a
  caller's `labels` name the units there too. A caller `accessibilityLabel`
  wins.
- **`accessibilityLiveRegion="polite"`** on Android, which only announces when
  the label string changes — which the coarse rule keeps rare.
- **Digits and captions cap at `maxFontSizeMultiplier={1.5}`.** The box padding
  is fixed, and an uncapped accessibility size would push four boxes off the
  screen edge.

## What it refuses

- **No public parts.** `Countdown.Segment` and `.Digit` are internal; a
  bespoke layout reads the exported resolvers (`splitCountdown`,
  `formatCountdownInline`) instead.
- **No count-up, pause or reset.** It counts to a moment. A stopwatch is
  different state and a different component.
