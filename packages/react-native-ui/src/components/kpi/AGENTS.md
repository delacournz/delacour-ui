# Kpi

One number, what it is doing, and the shape it made getting there — a
[`Card`](../card/AGENTS.md) with a vocabulary for a metric, whose sparkline is a
[`Chart`](../chart/AGENTS.md) line. Compound root plus eleven parts: `Header`,
`Icon`, `Title`, `Action`, `Content`, `Stat`, `Value`, `Trend`, `Sparkline`,
`Footer`, `Group`.

`import { Kpi } from "@delacour/react-native-ui/kpi";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/kpi` |
| `kpi.tsx` | Root + the `Object.assign` compound surface |
| `kpi-header.tsx` | `Kpi.Header`, on the card header's inset |
| `kpi-icon.tsx` | `Kpi.Icon`, and the icon defaults it publishes |
| `kpi-title.tsx` | `Kpi.Title` |
| `kpi-action.tsx` | `Kpi.Action` |
| `kpi-content.tsx` | `Kpi.Content`, and the layout it publishes |
| `kpi-stat.tsx` | `Kpi.Stat` |
| `kpi-value.tsx` | `Kpi.Value`, and its loading placeholder |
| `kpi-trend.tsx` | `Kpi.Trend` — text or badge |
| `kpi-sparkline.tsx` | `Kpi.Sparkline`, and the internal scrub reader |
| `kpi-footer.tsx` | `Kpi.Footer`, over `Card.Footer` |
| `kpi-group.tsx` | `Kpi.Group` |
| `kpi.context.tsx` | `KpiProvider`, `useKpi()`, `useKpiContext()`, `useKpiPart()`, the layout and group contexts |
| `kpi.types.ts` | Prop types shared by two or more parts |
| `kpi.variants.ts` | The slotted `tv()`, the axes, and every pure resolver — no RN imports |
| `kpi.variants.test.ts` | |

## Design

- **A KPI is a card, not a second definition of one.** The root renders `Card`
  with the caller's `variant` and `size`, so it takes the four fills, steps
  when nested, and has no scale of its own — `KPI_SIZES` *is* `CARD_SIZES`.
  `Kpi.Header` and `Kpi.Content` compose their classes onto `cardVariants`'
  own `header` and `content` slots, and the test asserts the card's inset
  survives the merge, so the number, the title and the footer sit on one line
  and a retune of the card moves all three.
- **The trend is coloured by what the movement means, never by its sign.**
  `resolveKpiTrend` turns a signed percentage and a `goodDirection` into a
  `direction` and a `tone`. A fall in churn is `down` and `good`, drawn in
  `success-soft-foreground`. `goodDirection` is said once on the card and every
  trend follows it unless it overrides it; `none` keeps the direction and drops
  the judgement. A value that is not finite — a change against a zero baseline
  — is flat and neutral rather than news of either kind.
- **There is no direction prop.** The sign is the direction. A separate prop
  would be a second statement of one fact that the call site has to keep in
  step, and the first time it did not the card would paint a fall green.
- **The trend is printed with a typographic minus.** `−4.2%` rather than
  `-4.2%`: a hyphen is narrower than a plus, so a column of changes would not
  line up on the sign. A value that rounds to zero is unsigned — `−0.0%` would
  claim a fall nothing shows.
- **Colour is never the only signal.** The sign carries the direction in text,
  the badge adds an arrow, and the trend is one accessible string — "Up 7.8
  percent, vs last month" — rather than a number, an arrow and a caption read
  as three stops.
- **The badge is `Badge`, soft.** `KPI_TONE_BADGE_COLOR` maps the tone onto
  `success`, `destructive` and `default`, so a trend badge is the same object as
  any other status badge on the screen.
- **The value is formatted by the caller.** Separators, currency and units are
  locale decisions a component would get wrong in a way that is hard to notice
  and impossible to override. It is one line, shrinking to fit — a number that
  wraps is no longer read as one — and it takes the foreground token of the
  plane the card landed on, the way `Card.Title` does.
- **The title never grows.** A growing child of a column absorbs the column's
  spare height, which in a row of cards lands every number at a different
  height. The header pushes `Kpi.Action` to the end with `ml-auto` instead, and
  a test forbids `flex-1` on the title.
- **`Kpi.Stat` exists because the value and its change are one fact.** The
  card's gap is for the space between facts; written straight into the content
  the two drift apart and stop reading as a unit. Beside an `inline` sparkline
  the stat takes the row's width.
- **The sparkline is `Chart`, with nothing but the line.** No grid, no axes, no
  tooltip readout — `Chart` reserves an axis gutter only for an axis that is
  placed, so the plot is the whole frame. The frame is sized through `Chart`'s
  `frameClassName`, which exists for this: the chart's three `size` heights are
  for a chart someone reads with axes. Rows or a bare list of numbers both work;
  `resolveSparklineSeries` indexes a list.
- **The y bounds are the data's own, padded a tenth.** With no padding a line
  drawn to its exact extent puts the peak and trough on the frame's edge, half
  the stroke off the canvas. `resolveSparklineDomain` pads the span and gives a
  flat series a unit either side so it sits centred.
- **Inline is a fixed 128pt column; below is the full width.** A stack of cards
  has labels of every length, and a chart taking whatever the text left would
  be a different width on every card. Fixed, the shapes line up down the
  right-hand edge, which is the reason to put them there. Below, the chart is
  filled; inline it is not, where a fill would make it a second block competing
  with the number — `resolveSparklineFilled`, overridable.
- **`colorIndex` is on the card, not the chart.** The icon and the sparkline
  share it, and a row of cards gets five series colours by setting one prop on
  each. The trend ignores it: a series colour has nothing to say about whether
  the number went the right way. The icon square is the series colour at 15%,
  written out per index because Tailwind's scanner cannot see a class built at
  runtime.
- **Holding the sparkline scrubs it, and the scrub is state.** A
  `Chart.Tooltip.Dot` rides the line, and an internal `KpiSparklineScrub` —
  a child of `<Chart>` that is not a mark, so the chart mounts it beside the
  canvas with the scrub's shared values in reach — reports the index to the
  root through `scheduleOnRN` only when it changes, and `null` when the finger
  lifts. The root holds it with `useControllableState`: `activeIndex` and
  `onActiveIndexChange` control it, `defaultActiveIndex` seeds it, and
  `useKpi()` reads it, so a part of the caller's own prints the scrubbed
  point's value in place of the latest. A controlled index moves what the
  caller prints; it draws no dot, because the dot is the finger's.
- **Loading is a placeholder the size of what it stands for.** `isLoading`
  swaps the value, the trend and the sparkline for muted blocks — the value's
  is the height of its line at each size, which a test pins — and marks the
  card busy, so nothing jumps when the data lands. They are
  `muted-foreground` at 15%, not `bg-muted`: `muted` is the secondary fill, and
  the first build's placeholders vanished on a secondary card. A translucent
  foreground reads on every plane, and a test forbids a fill token there.
- **No interaction on the card.** Like `Card`, a KPI that selects or navigates
  is a `Pressable` around it, which keeps the role, the haptic and the pressed
  state at the call site that knows what the press means. The playground's
  metric picker is the example.
- **`Kpi.Group` arranges; it does not restyle.** A row gives each metric an
  equal share of the width. `separated` sets them on one `Surface` with a
  `Separator` between each — hidden from assistive technology, so a rule is not
  an unlabelled stop between two numbers — and each metric drops its own fill
  to `transparent` unless it names one.
- **No text treatment on a view slot** (rule 1). The tests assert it across
  every combination.
