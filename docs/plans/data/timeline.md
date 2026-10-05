# Timeline — DATA-01-P3

> Read [README.md](README.md) § Conventions first. Subpath `@delacour/react-native-ui/timeline`.
> Closest sibling: [`Steps`](../../../packages/react-native-ui/src/components/steps/AGENTS.md) — read
> its AGENTS.md; reuse its *ideas* (laid-out connectors, status off one number) but not its code.

## Purpose on mobile

A sequence of dated events — an order's history, a project's milestones, a match's key moments.
Vertical by default; horizontal as a swipeable strip of columns. `value` says how far along the
sequence is; `tone` says what kind each event is. Unlike Steps it is read-only and content-heavy.

## API

```tsx
<Timeline value={2} variant="dot">
  <Timeline.Item step={0} tone="success">
    <Timeline.Indicator />
    <Timeline.Content>
      <Timeline.Header>
        <Timeline.Title>Order placed</Timeline.Title>
        <Timeline.Date>9:41</Timeline.Date>
      </Timeline.Header>
      <Timeline.Description>Paid by card</Timeline.Description>
    </Timeline.Content>
  </Timeline.Item>
  …
</Timeline>

<Timeline.List orientation="horizontal" data={events} value={4} itemWidth={(e) => (e.empty ? 24 : 160)}
  renderItem={({ item, index }) => <Timeline.Item step={index} tone={item.tone}>…</Timeline.Item>}
  onColumnChange={setCurrent} />
```

```ts
type TimelineTone = "default" | "info" | "success" | "warning" | "destructive";  // house token name
type TimelineVariant = "dot" | "icon" | "numbered" | "card" | "compact";
type TimelineOrientation = "vertical" | "horizontal";
type TimelineProps = ViewProps & {
  value?: number;                       // steps ≤ value are completed; default -1 (none)
  variant?: TimelineVariant;
  size?: "sm" | "md";
  className?: string;
} & (
  | { orientation?: "vertical" }
  | { orientation: "horizontal"; snap?: boolean; haptic?: boolean; onColumnChange?: (index: number) => void }
);
type TimelineItemProps = { step: number; isCompleted?: boolean; tone?: TimelineTone; isLast?: boolean;
  width?: number /* horizontal */; className?: string; children: ReactNode };
type TimelineListProps<T> = Omit<FlatListProps<T>, "renderItem" | "horizontal"> & {
  renderItem: (info: ListRenderItemInfo<T>) => ReactElement;
  itemWidth?: number | ((item: T, index: number) => number);
} & Pick<TimelineProps, "value" | "variant" | "size"> & ({ orientation?: "vertical" } | { orientation: "horizontal"; snap?: boolean; haptic?: boolean; onColumnChange?: (i: number) => void });
```

Parts: `Item`, `Indicator` (children: Icon for `icon`, otherwise auto dot/number), `Content`, `Header`,
`Title`, `Date`, `Description`, `Meta`, `Trailing`, `Aside` (left column for a timestamp in vertical),
`Stats` + `Stat` (`label`, `value`), `Masthead` (`media`, `label`, `title` — a header row above the
first item), `List`. Hooks `useTimeline()`, `useTimelineItem()`.

Note: house token vocabulary says `destructive`, not `danger` — use it.

## Behaviour

- **Status off one number**: `resolveTimelineStatus(step, value, isCompleted)` → `completed | current |
  upcoming`. Rail segments fill by `step < value` (both ends agree — Steps' rule).
- **"Progress is solid, kind is tinted"**: completed/current indicator fill primary; upcoming muted
  ring. A toned item uses `<tone>-soft` fill + `<tone>-soft-foreground` glyph regardless of progress;
  progress shows on the rail.
- Item count from direct children (warn on wrappers); last item draws no trailing rail. `List` owns
  `step`, `width`, `isLast` via context (an item inside List must not need them).
- **Horizontal**: columns of fixed height band above a horizontal rail. Column with no content (no
  `Content` child) collapses to a tick (`width` 24). `snap` → `snapToOffsets` from cumulative widths
  (pure). Reading edge = left content inset; `onColumnChange` fires when the column under it changes
  (computed in `useAnimatedScrollHandler`, `scheduleOnRN` only on change); `haptic` fires `selection`
  via Pulsar from the worklet on change. Column at the reading edge animates its title colour from
  muted to foreground.
- `card` variant wraps each item's content in `Surface`; `compact` halves vertical gaps.

## A11y

- Each item one element: label = title; `accessibilityValue.text` = `resolveTimelineAccessibilityValue`
  → "Event 2 of 6, completed, success" (tone omitted when default). Rail hidden. Masthead is a header.
- Horizontal list: `accessibilityRole="adjustable"` not used; items remain individually reachable.

## Motion

Reading-edge colour transition (Reanimated `interpolateColor`, 150 ms); haptic on column change. No
entering animation. Respect reduce motion (snap colour, no transition).

## Reuses

`Text`, `Surface`, `Icon`, `Pressable` haptics (`firePulsarHaptic`-equivalent exported from pressable —
check its index), FlatList (react-native). No new peers.

## Pure logic (`timeline.variants.ts`)

`resolveTimelineStatus`, `isTimelineRailComplete`, `resolveTimelineIndicator(variant, status, tone)` →
`{ fill, foreground, glyph: "dot" | "number" | "icon" | "check" }`, `resolveTimelineColumnOffsets(widths)`,
`resolveColumnAtOffset(offsets, x)`, `resolveTimelineColumnWidth(item width, hasContent)`,
`resolveTimelineAccessibilityValue`, slot classes per variant/size/orientation, tone→token map test
asserting every token exists in `theme.css` (follow Steps' colour test pattern).

## Playground demos

`order-history` (hero, capture, vertical dot), `tones` (capture), `numbered` (capture), `icons`,
`cards` (capture), `compact`, `with-aside` (times in the left column), `masthead-stats`,
`horizontal` (clip capture: swipe, reading edge, haptics), `long-list` (Timeline.List 200 items).

## Docs page

`timeline.mdx`: overview, progress vs tone, variants, horizontal + column change, long timelines,
accessibility, API.

## Acceptance

- [ ] Status/rail resolvers tested; rail never half-filled between two items
- [ ] Every tone/variant renders correctly in light and dark (simulator)
- [ ] Horizontal: snap lands on columns, `onColumnChange` fires once per change, empty columns collapse
- [ ] `Timeline.List` with 200 items scrolls smoothly; items need no `step`/`isLast`
- [ ] VoiceOver: one stop per item with position/status/tone
- [ ] Folder AGENTS.md, Components row, ITEM_META, gen-exports, registry:build, demos, docs, changeset
- [ ] `bun test`, `bun run typecheck`, `bun run check` green

## Build notes (2026-10-05)

- **Simulator verified** (warden `iphone-17-4`, dev client, agent-device): every demo in light and
  dark; horizontal swipe fires `onColumnChange` (1 → 4) and the list snaps onto a column with its
  title raised; VoiceOver values read "Event 3 of 5, completed, error". It caught three bugs, now
  fixed and pinned by tests: toned dots were invisible (soft fill, no glyph) → a toned dot is
  `<tone>-soft-foreground`; horizontal titles collapsed (`flex-1` band in an auto-height strip) →
  `grow`; a horizontal `Timeline.List` grew down the page → root `grow-0`.
- **Preview media deferred.** The capture script needs the argent CLI, which is not installed, so
  no demo carries `meta.capture` and the docs page has no `<Preview>`. Follow-up: mark
  `order-history` (hero), `tones`, `numbered`, `cards`, `horizontal` as captured and run
  `bun run previews -- -- --only timeline` once a capture tool is back.
- **`long-list` runs horizontally.** The gallery pages vertically, so a vertical 200-item list
  nested inside it warns about nested VirtualizedLists; across, it also shows `itemWidth` as the
  snap table. The vertical `Timeline.List` is documented on the docs page.
- **The last columns cannot reach the reading edge** — the strip ends where its content does.
  Recorded in the component AGENTS.md rather than padded with a measured width.

## Previews (2026-10-06)

- **Captured** on `iphone-17-pro` with the dev client and this worktree's Metro (`--dev`): four
  stills — `order-history`, `tones`, `numbered`, `cards` — and one clip, `horizontal` (hero), whose
  flow `.argent/flows/previews/timeline/horizontal.yaml` flings the strip along twice and back to
  column 1, so it loops on "Column 1 of 7" with *Planted* raised. Validated by reading every poster
  and a contact sheet of both clips. The docs page carries the hero and a `<Preview>` per section.
- **Not captured:** `icons`, `compact`, `with-aside`, `masthead-stats` (variants already shown by
  `numbered`/`cards`), and `long-list` (the same gesture as the hero over a 200-item list).
- The clip shows the documented limit: the second fling stops on column 4, because the last
  columns cannot reach the reading edge.
