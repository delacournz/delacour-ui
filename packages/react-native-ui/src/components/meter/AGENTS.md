# Meter

A measurement on a fixed scale, coloured by where it falls — storage used, a
battery's charge, a password's strength. Built on `Progress`: the same track, fill,
header and label, with a root that clamps the reading, judges it, and paints the
fill that judgement's colour. Adds `Meter.Segments` for a scale drawn as whole
blocks.

`import { Meter } from "@delacour/react-native-ui/meter";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/meter` |
| `meter.tsx` | Root + the `Object.assign` compound surface; publishes both contexts |
| `meter-header.tsx` | `Meter.Header` — `Progress.Header`, named for the meter |
| `meter-label.tsx` | `Meter.Label` — `Progress.Label`, named for the meter |
| `meter-output.tsx` | `Meter.Output`, the readout, whose function child is handed the region |
| `meter-track.tsx` | `Meter.Track` — `Progress.Track`, named for the meter |
| `meter-fill.tsx` | `Meter.Fill` — `Progress.Fill`, named for the meter |
| `meter-segments.tsx` | `Meter.Segments`, the blocks, and the internal `Meter.Segments.Segment` |
| `meter.context.tsx` | `MeterContext`, `useMeter()`, `useMeterContext()`, `useMeterPart()` |
| `meter.types.ts` | `MeterRenderProps`, shared by the context and the readout |
| `meter.variants.ts` | The blocks' `tv()` slots + the scale, region, threshold and segment resolvers |
| `meter.variants.test.ts` | |

## Built on Progress

- **The root publishes `ProgressContextValue` as well as its own context.**
  `Progress.Track` and `Progress.Fill` read only `ratio`, `isIndeterminate`,
  `color`, `size` and `trackSize` — the progress bar was written to be reused
  this way — so `Meter.Track` and `Meter.Fill` *are* those parts, and the fill's
  UI-thread transform, its seeded first frame and its hide-until-measured come
  along without a line restated. `isIndeterminate` is always `false`.
- **Each reused part is a thin wrapper, not the progress part assigned
  directly.** The wrapper calls `useMeterPart` first, so a `Meter.Fill` outside
  a meter throws naming `Meter.Fill` rather than `Progress.Fill`, and DevTools
  shows `DelacourUI.Meter.Fill` (rule 12).
- **The parts come through `../progress`, the index; the resolvers through
  `../progress/progress.variants`, the leaf** (rule 3). Progress imports nothing
  from here, so there is no cycle, and the registry records `progress` as a
  dependency of `meter`.
- **Colours and sizes are the progress bar's tuples, re-exported, not
  restated.** A test pins them equal, and another pins a block's height and
  paint to the progress track's and fill's, so a segmented meter and a
  continuous one in one card read as one instrument.

## Judging the reading

- **Two ways, never both, and the prop type says so.** `MeterProps` is a union:
  `low` / `high` / `optimum` *or* `thresholds`. Passing both is a type error
  rather than a precedence rule. `resolveMeterScale` turns the props into a
  `MeterScale` — `plain`, `regions` or `thresholds` — and `resolveMeterColor`
  switches on its `kind`.
- **Regions follow a gauge's three-part model.** `low` and `high` default to the
  scale's ends and `optimum` to its middle; each is clamped into the scale and
  `high` is never below `low`, so a boundary written the wrong way round is
  pulled into order rather than inverting every region. `optimum` below `low`
  makes the bottom good (a disk), above `high` the top (a battery), between them
  the band (a temperature). The regions paint `success`, `warning`,
  `destructive` — `METER_REGION_COLORS`, fixed, so a region reads the same in
  every meter in an app — and `color` is ignored.
- **Thresholds: the highest `from` reached wins, in any listed order.** `from`
  is in the reading's units, not a percentage — a threshold on a 0–256 GB meter
  is written in gigabytes. A non-finite `from` is ignored. Below every threshold
  `color` applies.
- **The clamped reading is what is judged.** A disk over its capacity is
  `critical`, not off the scale.
- **Colour is never the only signal, and `valueLabel` takes a function for it.**
  Nothing speaks the region on its own — the words are domain-specific ("Almost
  full", "Weak") — so `valueLabel` may be a function handed the judged
  `MeterReading`, and `resolveMeterValueLabel` calls it. A `Meter.Output`
  function reading `region` is **not** enough: the output is hidden from
  assistive technology, so its words are seen and never heard. The simulator
  pass caught exactly that — the regions demo drew "Filling up · 82%" while
  VoiceOver's value was "82%".

## The scale

- **`meterRange` makes the scale finite and ordered.** A non-finite bound takes
  0 or 100; an inverted or empty scale collapses at its floor and reads empty.
  `progressRatio` would already return 0 for it, but the accessibility value
  needs `min ≤ now ≤ max` too.
- **`meterValue` clamps to the ends; `NaN` reads at the floor and an infinity at
  the end it points to.** `progressRatio` alone returns 0 for `+Infinity`,
  which would draw a full disk as empty.
- **The formatted readout uses the clamped reading**, so a non-percent format
  never prints `300 GB` on a 256 GB scale.

## Segments

- **Whole blocks only.** `litSegments` floors, so four blocks say "three out of
  four" where a bar says "about seventy percent" — a password is not seventy
  percent strong. A small epsilon absorbs floating-point error, so `0.7 × 10`
  lights seven.
- **Any reading above the floor lights at least one block.** Rounding down would
  leave the first quarter of a four-block meter dark, and "a little" looking like
  "none" is the reading a meter can least afford to get wrong.
- **`meterSegmentCount` rounds a fractional count down, clamps above
  `METER_MAX_SEGMENTS` (100), and falls back to the continuous bar** for a count
  under one or not finite, rather than drawing nothing.
- **A block's lit colour is a layer that fades its opacity**, not the block's own
  background: an opacity animates on the UI thread, where a background would need
  two token values interpolated in JavaScript. Each layer is seeded at its
  current state, so a list of meters does not replay the lighting as rows mount,
  and the timing keeps Reanimated's default reduce-motion policy — with the system
  setting on, a block lights without a fade. Unlike the progress bar's loop,
  nothing here has to keep moving to be read.
- **`segments` lives on the root, not on `Meter.Segments`.** The lit count is
  part of the render props a readout reads, so the root has to know it.
  `Meter.Segments` without a count renders nothing; `Meter.Track` with one still
  draws the continuous bar.

## What it refuses

- **No `isDisabled`, `isInvalid`, `Field` or indeterminate state.** A meter
  reports a reading and accepts no input; `resolveMeterAxes` takes one argument
  and a test pins that. A reading that is not known yet is `Progress`'s
  indeterminate loop, not a meter.
- **No `label` / `showValueLabel` props.** The anatomy is written out, as
  `Progress`'s is — `Meter.Header` with a `Meter.Label` and a `Meter.Output` — and
  a bare `<Meter value={68} />` still draws the scale, because a compound root
  with no default children renders an empty `View` with no error.

## Accessibility

- **The root is the one accessible element**, `accessibilityRole="progressbar"`
  — React Native has no meter role, and this is the one that publishes a range
  and a value on both platforms. `resolveProgressAccessibility` decides the
  spoken text: the percentage over 0–100, `168 of 256` otherwise, or
  `valueLabel`. Thresholds, regions and segments never change it.
- **`Meter.Label` is the name, `Meter.Output` is hidden** — the root already
  speaks the value, so a visible readout would be read twice. A meter with no
  label needs an `accessibilityLabel`.
