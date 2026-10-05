# Countdown — DATA-01-P2

> Read [README.md](README.md) § Conventions first. Subpath `@delacour/react-native-ui/countdown`.

## Purpose on mobile

Time left until a fixed moment — a sale ending, a launch, a booking hold. It reads the wall clock on
every tick rather than decrementing a counter, so it is correct after the app was backgrounded, the
JS thread stalled, or the device slept.

## API

```tsx
<Countdown to={endsAt} />                                         // segmented, d/h/m/s, trimmed
<Countdown to={endsAt} variant="inline" size="sm" />               // "2d 14:03:22"
<Countdown to={endsAt} units={["hours", "minutes", "seconds"]} urgentBelow={60} onComplete={expire} />
<Countdown to={endsAt} labels={{ days: "Tage" }} />
```

```ts
type CountdownUnit = "days" | "hours" | "minutes" | "seconds";
type CountdownProps = Omit<ViewProps, "children"> & {
  to: Date | number;                                   // epoch ms
  units?: readonly CountdownUnit[];                    // default all four, largest→smallest
  trim?: boolean;                                      // default true: drop leading zero units, keep ≥ 2
  labels?: Partial<Record<CountdownUnit, string>>;     // segmented captions
  urgentBelow?: number;                                // seconds; digits turn destructive
  variant?: "segmented" | "inline";
  size?: "sm" | "md" | "lg";
  now?: () => number;                                  // injectable clock (tests/demos), default Date.now
  onTick?: (secondsLeft: number) => void;
  onComplete?: () => void;
  className?: string;
};
```

No public sub-components (it is pattern A + internal parts): `CountdownSegment`, `CountdownDigit`
(internal, `DelacourUI.Countdown.Segment` / `.Digit`).

## Behaviour

- **Seconds round up**: `secondsLeft = Math.max(0, Math.ceil((to - now) / 1000))`. Shows `0:01` through
  the final second; `0:00` only when time is up. `onComplete` fires exactly once per `to` value
  (re-arms if `to` changes to the future).
- **Absorption**: the largest selected unit absorbs everything above it — `units={["hours","minutes"]}`
  shows 48 h for two days.
- **Trim**: with `trim`, leading units whose value is zero are dropped, never below the smallest two
  selected units.
- **Tick scheduling**: one `setTimeout` aligned to the next whole-second boundary of `to - now` (not a
  drifting `setInterval`), re-aligned each tick. Also re-read on `AppState` → `active`.
- **Urgent**: `secondsLeft <= urgentBelow` → digits `text-destructive`.
- Inline format: `2d 14:03:22`; with hours as largest `14:03:22`; with minutes `3:22`. Pad every unit
  after the first to two digits.

## Variants

- `segmented`: each unit a `Surface`-filled box (rounded-md, `bg-muted`) with large tabular digits and a
  `Text.Caption` unit label beneath; separators none.
- `inline`: one `Text` run with `tabular-nums`.
- `size` steps the digit `Text` preset (sm → Header, md → Title, lg → Display) and box padding.

## Motion

Digit change: old digit slides down and fades out, new digit enters from above (Reanimated
`entering`/`exiting` layout animations keyed by digit value, per digit column, clipped by
`overflow-hidden`). No animation on first render; none when `useReducedMotion()` is true. The tick
itself is not decorative motion — it does not read `useCalmMotion`, but `isMotionCalm` disables the
slide (state still updates).

## A11y

- Root `accessibilityRole="timer"`, `accessible`; digits hidden from AT.
- Label is coarse to avoid chatter: above one minute announce days/hours/minutes ("2 days, 14 hours,
  3 minutes left"); within the final minute include seconds. `accessibilityLiveRegion="polite"` on
  Android; label only changes when the coarse string changes.
- Digits do not scale beyond `maxFontSizeMultiplier={1.5}` in segmented boxes.

## Reuses

`Text`, `Surface` (or plain classes), `useCalmMotion`, Reanimated layout animations. No new peers.

## Pure logic (`countdown.variants.ts` + `countdown.test.ts`)

- `secondsUntil(to, now)` — ceil + clamp.
- `splitCountdown(seconds, units)` → `Record<CountdownUnit, number>` with absorption.
- `trimCountdownUnits(parts, units, trim)` → visible units.
- `formatCountdownInline(parts, visibleUnits)`.
- `resolveCountdownAccessibilityLabel(seconds, units, labels)` — coarse rule.
- `msUntilNextTick(to, now)` — alignment to the second boundary.
- `isCountdownUrgent(seconds, urgentBelow)`.
- `countdownVariants` slots per size/variant.

## Playground demos

`segmented` (hero, capture; target = now + 2d 3h), `inline` (capture), `sizes` (capture), `units`
(hours+minutes absorbing), `urgent` (target now + 45s, already inside its last minute, capture as clip), `complete` (10s, shows
`onComplete` swapping to a "Expired" Badge), `labels` (localised captions). Demos compute `to` once with
`useState(() => Date.now() + …)`.

## Docs page

`countdown.mdx`: overview, clock accuracy note, units/absorption, trim, urgency, completion,
accessibility, API.

## Acceptance

- [x] Resolvers unit-tested incl. boundaries: 0, 1 s, 59 s, 60 s, exactly 1 day, past `to`
- [x] Final second shows `0:01`; `0:00` and `onComplete` (once) at zero
- [x] Backgrounding 30 s then returning shows the correct remaining time immediately
- [x] Digit slide plays per changed digit only; none on mount (seen in the captured clips; reduce motion not checked)
- [x] VoiceOver announces coarse label; seconds only in final minute
- [x] Folder AGENTS.md, Components row, ITEM_META, gen-exports, registry:build, demos, docs, changeset
- [x] `bun test`, `bun run typecheck`, `bun run check` green

## Status (2026-10-05)

Simulator-verified on a warden-leased iPhone 17 (dev client, Metro on a warden port): `urgent` went from
`1 minute left` to `59 seconds left` at the final minute, with the digits turning destructive; 21 s in the
background took it from 46 s to 25 s, correct straight away; `complete` reached `Expired` and re-armed on
Restart; `segmented` ticks from 2d 03:00:00. The accessibility label was read from the AX tree, not
spoken by VoiceOver. Not checked on device: reduce motion.

## Previews (2026-10-06)

Captured on a warden-leased iPhone 17 Pro against the dev client: 3 clips — `segmented` (hero), `inline`,
`urgent` — and 3 stills — `sizes`, `units`, `labels`. `complete` is not captured: reaching `Expired` takes ten
seconds, far past the three-second clip budget. The clips are wait-only flows, like `spinner`'s, since a
countdown is its own motion; each is about four seconds of ticking, so the loop seam steps the seconds back
by four. A wall-clock countdown cannot loop without that step, and that is accepted.

`urgent` starts at 45 s rather than 75 s, so the clip opens already destructive instead of depending on the
capture's start time to catch the crossing.

A demo that ticks once a second was always photographed mid-slide: `awaitIdle`'s default 500 ms window closes
about 720 ms after a tick, and the recording or screenshot lands on the next one. `DemoCapture.settleMs`
(new) shortens that window per demo; the ticking demos set it to 150, which starts the capture mid-second.
