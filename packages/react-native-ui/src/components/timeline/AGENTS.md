# Timeline

A sequence of dated events — an order's history, a project's milestones, a match's key moments.
Read-only and content-heavy. Compound root plus `Timeline.Item`, `Indicator`, `Content`,
`Header`, `Title`, `Date`, `Description`, `Meta`, `Trailing`, `Aside`, `Stats`, `Stat`,
`Masthead` and `List`; the rail between events is internal and drawn by the items themselves.

`import { Timeline } from "@delacour/react-native-ui/timeline";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/timeline` |
| `timeline.tsx` | Root — dispatches to the vertical or horizontal layout, counts the items, sizes the columns, and the `Object.assign` |
| `timeline-list.tsx` | `Timeline.List` — the same timeline over a `FlatList`'s data |
| `timeline-item.tsx` | `Timeline.Item`, `splitTimelineChildren` and `hasTimelineContent` |
| `timeline-track.tsx` | The indicator box, the rail segment and the empty column's tick — internal |
| `timeline-indicator.tsx` | `Timeline.Indicator` — dot, number, icon or check |
| `timeline-content.tsx` | `Timeline.Content` — a `Surface` under `card` |
| `timeline-header.tsx` | `Timeline.Header` |
| `timeline-title.tsx` | `Timeline.Title`, and the reading-edge colour animation |
| `timeline-date.tsx` | `Timeline.Date` |
| `timeline-description.tsx` | `Timeline.Description` |
| `timeline-meta.tsx` | `Timeline.Meta` |
| `timeline-aside.tsx` | `Timeline.Aside` — the left column |
| `timeline-trailing.tsx` | `Timeline.Trailing` — the right column |
| `timeline-stats.tsx` | `Timeline.Stats` |
| `timeline-stat.tsx` | `Timeline.Stat` |
| `timeline-masthead.tsx` | `Timeline.Masthead` |
| `use-timeline-reading-edge.ts` | The horizontal scroll handler — column, haptic, `onColumnChange` |
| `timeline.context.tsx` | The root's, the item's and the list cell's contexts, with `useTimeline()` and `useTimelineItem()` |
| `timeline.types.ts` | Prop types the root and `List` share |
| `timeline.variants.ts` | Pure `tv()` slots + every resolver, no RN imports |
| `timeline.variants.test.ts` | |

## Design

- **Variants**: `dot` (a small dot), `icon` (a circle holding the caller's glyph), `numbered` (a
  circle holding the position), `card` (a dot beside content on a `Surface`) and `compact` (a dot
  with half the gaps). **Sizes**: `sm`, `md`. **Orientations**: `vertical` (the default — events
  down a rail) and `horizontal` (a swipeable strip of columns above a rail). **Tones**: `default`,
  `info`, `success`, `warning`, `destructive` — the house token names, so `destructive`, never
  `danger`.
- **Three statuses, off one number.** `resolveTimelineStatus` reads an event's `step` against the
  zero-based `value`: before it `completed`, at it `current`, after it `upcoming`. The default
  `value` is `-1`, so a timeline with none says nothing has happened. `isCompleted: true` wins
  everywhere; `false` un-completes a passed event but never demotes the current one, which would
  leave the timeline with no "now". This is Steps' rule, restated rather than imported — the two
  share an idea, not code.
- **Progress is solid, kind is tinted.** A default event's marker fills `primary` once reached
  and is a muted ring ahead of the value. A toned event is its `<tone>-soft` fill and
  `<tone>-soft-foreground` glyph whatever its progress. The failure this prevents is a marker
  asked to say two things: a failed payment three events back would otherwise turn primary once
  the order moved past it, and the error would vanish from the history. Progress is the rail's job.
- **`resolveTimelineIndicator` names the tokens and the slots emit them.** The number takes its
  colour as a class (rule 1) and the icon as a token through `IconDefaultsProvider`; the suite
  sweeps every variant × status × tone and asserts the slot emits `bg-<fill>`, `border-<ring>`
  and `text-<foreground>`, and that both theme variants declare each token.

## The rail is laid out, not measured

- **Each item draws the segment leaving it.** A vertical item is a row of
  `[aside] [track] [content] [trailing]`, its track a column of `[indicator box] [rail]` whose
  rail is `flex-1` down whatever height the content gives the row. A horizontal item is a column
  of `[content band] [track]`, the rail running to the column's right edge where the next
  column's indicator begins. Nothing calls `onLayout`, so a description that wraps moves nothing
  a frame late.
- **The rail fills off the value alone.** `isTimelineRailComplete(step, value)` is
  `step < value` — never the event's status or override. The segment between two events is drawn
  by one and ends at the other; the value is the one thing both agree on, so the rail is never
  half filled between two items and filled segments are always a prefix. The test sweeps that.
- **The indicator sits in a box, and the box is what aligns.** A dot's box is one title line tall,
  so the dot centres on the title's first line at any size; a circle's box is the circle, and the
  content is padded down by half the difference. A vertical track is exactly the box's width, so
  every marker sits on one axis whichever variant drew it. Under `card` the track drops by the
  card's own inset so the dot meets the card's title. The suite recomputes all three from the
  classes, so a retuned type step fails the build instead of drifting half a line.
- **The last event draws no trailing rail**, and the root knows which is last by counting its
  direct `Timeline.Item` children — a `.map()` counts, an item behind a wrapper does not, and the
  root warns in development. Inside `Timeline.List` the data's length is the count.

## Horizontal

- **Columns stretch to the tallest, and the content sits on the rail.** The strip is
  `items-stretch`, each column's content band is `flex-1 justify-end`, so every rail lines up
  however much text a column holds.
- **A column with no content collapses to a 24-point tick.** `resolveTimelineColumnWidth` returns
  `TIMELINE_TICK_WIDTH` whatever width was asked for — the column marks a gap in time, not an
  event — and the tick is hidden from assistive technology. The root sizes every column with the
  same function the item uses, so the snap table and the columns cannot disagree. In a list,
  `itemWidth` is the authority: return 24 for an empty item.
- **The reading edge is the left content inset.** The column under it is
  `resolveColumnAtOffset(offsets, contentOffset.x)` — both the edge and every column start sit one
  inset in from the content's origin, so the inset cancels. A one-point slop absorbs a snap that
  settles a fraction short.
- **`onColumnChange` fires once per change, never per frame and never on mount.** The scroll
  handler resolves the column on the UI thread and acts only when it differs from the shared
  value: it writes the value, ticks `playHaptic("selection")` from the worklet so the tick lands
  in the frame the column crossed, and only then crosses to JS with `scheduleOnRN`.
- **`snap` is `snapToOffsets` from the same offsets**, cumulative widths computed purely — no
  measured cell.
- **The column at the reading edge animates its title from muted to foreground.** An animated
  style, not a class, because it travels — `Tabs.Label`'s trade. The target flips in an animated
  reaction to the shared column, the first run is snapped so a cell mounting mid-scroll paints at
  once, and reduce motion snaps every change.

## Timeline.List

- **It is the root and the list at once.** It counts its data and supplies each cell's `step`,
  `isLast` and `width` through a list-cell context, so `renderItem` returns a bare `Timeline.Item`.
  An item's own prop still wins when written.
- **Horizontal, `itemWidth` is also `getItemLayout`.** `resolveTimelineItemLayout` turns the
  widths and offsets into the layout FlatList asks for, so two hundred columns virtualise without a
  cell ever being measured.
- **It is `Animated.FlatList`, in both orientations.** The horizontal strip needs a worklet scroll
  handler, which only an animated list accepts; a vertical list never attaches it. `onScroll` is
  therefore a vertical-only prop, by type.

## Accessibility

- **One element per event.** The item is `accessible`, so its marker, title, date and description
  merge into one VoiceOver stop read in order; `accessibilityValue.text` is
  `resolveTimelineAccessibilityValue` — "Event 2 of 6, completed, success". The default tone is not
  read, `destructive` is read as "error", and an uncounted timeline claims no total. Pass
  `accessibilityLabel` to name it by something shorter than its whole text.
- **The marker, rail and tick are hidden** — they restate what the value already reads.
- **The masthead is a header**, one element, so the rotor stops on it.
- **The horizontal strip is not `adjustable`.** Every column stays individually reachable; an
  adjustable strip would hide all but one.
- **The number does not scale with the OS text size** — the circle is a fixed edge, and the
  position is in the value.

## What it does not do

- **No presses.** A timeline is a record; an event that opens something composes a `Pressable` in
  its content. Steps is the control.
- **No entering animation.** Events are content, and a history that animates in on every mount
  is noise.
