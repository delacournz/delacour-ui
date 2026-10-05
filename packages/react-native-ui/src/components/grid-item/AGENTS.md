# GridItem

A bento grid of whole-cell tiles with aligned edges. `GridItem.Group` lays the
tiles out; `GridItem` is the tile, with `GridItem.Background`, `GridItem.Media`,
`GridItem.Title`, `GridItem.Value`, `GridItem.Description`, `GridItem.Footer`
and `GridItem.Actions`.

`import { GridItem } from "@delacour/react-native-ui/grid-item";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/grid-item` |
| `grid-item.tsx` | The tile root + the `Object.assign` compound surface, and the background-first ordering it owns |
| `grid-item-group.tsx` | `GridItem.Group` — measures, places, sets its height — and the internal `Group.Cell` box |
| `grid-item-background.tsx` | `GridItem.Background` |
| `grid-item-media.tsx` | `GridItem.Media` |
| `grid-item-title.tsx` | `GridItem.Title` |
| `grid-item-value.tsx` | `GridItem.Value` |
| `grid-item-description.tsx` | `GridItem.Description` |
| `grid-item-footer.tsx` | `GridItem.Footer` |
| `grid-item-actions.tsx` | `GridItem.Actions` |
| `grid-item.context.tsx` | Group, cell and tile providers; `useGridItemGroup()`, `useGridItem()`, `useGridItemPart()`, the label collector |
| `grid-item.types.ts` | Prop types shared by two or more parts |
| `grid-item.layout.ts` | `resolveCellSize`, `placeTiles`, `tileRect`, `gridHeight`, `resolveInitialAspect`, `readGridItemSpan` — pure, no RN imports |
| `grid-item.layout.test.ts` | |
| `grid-item.variants.ts` | The slotted `tv()`, the variant/size/render resolvers and the label joiner — no RN imports |
| `grid-item.variants.test.ts` | |

## Design

- **Axes**: `variant` — `default` (`bg-card`, `border-border`), `outline`
  (transparent, `border-border`), `muted` (`bg-muted`, no border), `plain`
  (nothing); `size` — `default` (`p-4`, `text-sm` title, `text-2xl` value),
  `sm` (`p-3`, `text-xs`, `text-lg`). The group's `size` and `variant` are the
  default for every tile that does not set its own. States: `isDisabled`
  (`opacity-50`, as `Pressable`), and `busy` passed through.
- **Tiles are whole cells, never content-sized.** The group reserves its height
  from the cells before anything loads, and the tile root clips
  (`overflow-hidden`), so content taller than its cell is cut off rather than
  pushing the grid ragged. That is the trade that makes a bento grid possible —
  flex-wrap goes ragged the moment one tile is tall, and `FlatList numColumns`
  only does uniform cells. It is not a masonry layout.
- **Spans are read from the group's direct children's props.** `placeTiles`
  needs every span before it can place anything, so the group reads `colSpan`
  and `rowSpan` off each direct child (`Children.toArray`, the same walk
  `ListGroup` uses for its dividers). **A child wrapped in a custom component
  loses its spans unless the wrapper accepts `colSpan` / `rowSpan` itself** —
  name them on the wrapper's props and forward them to the `GridItem`. A direct
  child that is not a `GridItem` (a `Kpi`, a plain `View`) is placed too, at
  whatever spans its props carry, else 1×1.
- **Placement is first-fit in writing order, and never backfills.** Each tile's
  search starts at the previous tile's cell. A tall tile still leaves the cells
  beside it for the tiles after it, but a hole a wide tile skipped stays a hole.
  That keeps the order VoiceOver walks — the children's order — the order the
  eye reads. Dense backfill would put a later tile above an earlier one.
- **Edges snap to the pixel grid, not sizes.** `tileRect` rounds each tile's
  start and end edge to the device's pixel ratio and takes width as end minus
  start. Rounding widths independently lets neighbours' errors add up into a
  hairline gap; snapping edges keeps every pair exactly one `gap` apart, and the
  tests assert it across odd widths and column counts.
- **Tiles sit on the logical `start` inset, never `left`.** Under right-to-left
  the whole grid mirrors with no code of its own. `GridItem.Actions` uses `end`
  for the same reason.
- **No jump between the first frame and the measured one.** Before `onLayout`
  the group reserves `rowHeight` rows if given, else an `aspectRatio` of
  `columns × aspect / rows` (gaps ignored — close enough), and renders tiles at
  `opacity: 0`. The measured height replaces it on the first layout.
- **The first measure never animates; later relayouts glide.** Each cell box
  carries Reanimated's `LinearTransition` (220 ms) once the group has settled,
  so a rotation, a split-view resize or a new column count moves tiles to their
  new cells. Under reduce motion or calm motion (`useCalmMotion`) the
  transition is `undefined` and they jump.
- **The group positions a box; the tile fills it.** Each direct child is
  wrapped in an absolutely positioned `Animated.View` (`GridItem.Group.Cell`),
  and the tile root is `flex-1`. That is why a non-`GridItem` child is placed
  just as well, and why `useGridItem()` can report the tile's `width` and
  `height` — a chart in `Background` can size itself from them.
- **Pressable only with a handler.** `resolveGridItemRender`: an `onPress` or
  `onLongPress` makes a `Pressable` (role `button`, `scale` feedback at a gentle
  0.98, `haptic` passed through); without one it is an `Animated.View` with no
  role and no gesture handler — `Animated` only so the `ref` type is one type.
- **One accessibility stop per tile.** Title, Value and Description register
  their plain text with the tile (`useGridItemLabelPart`), and the tile joins
  them — `"Storage, 74 GB, of 100 GB"` — into its `accessibilityLabel` unless
  the caller passed one. A part holding only elements registers nothing; label
  the tile yourself then. The group is `accessibilityRole="list"`.
- **A pressable tile must not hold another control.** iOS merges an accessible
  element's children, so a button in a pressable tile's `Actions` is
  unreachable. Put controls on a static tile and give that tile
  `accessible={false}` so each control is its own stop.
- **`Background` is always behind.** The root moves every `GridItem.Background`
  to the front of its children before rendering, so it is drawn first wherever
  the caller wrote it. It takes no touches and is hidden from assistive
  technology — it is decoration; the text parts carry the meaning.
- **Large text clips, by design.** Dynamic type cannot grow a cell. Give the
  group a bigger `rowHeight` or fewer `columns` at large font scales —
  `useGridItemGroup().cellHeight` and `PixelRatio.getFontScale()` are what a
  screen reads to decide.
- **Every variant reserves the same one-point border**, transparent where the
  variant draws none, the same rule as [`Surface`](../surface/AGENTS.md), so
  switching variant never moves content. Corner `rounded-lg` with
  `border-continuous`; no shadows — a tile sits beside its neighbours, not
  above them.
- **It shares variant names with [`Item`](../item/AGENTS.md)** — `default`,
  `outline`, `muted` — so a screen mixing rows and tiles reads as one family,
  but owns its own `tv()`. Item is a row; GridItem is a tile sized by a grid.
  A [`Kpi`](../kpi/AGENTS.md) is a free-standing card and can sit inside a tile.
- **Text colour goes on the text.** Only `title`, `value` and `description`
  hold a `text-*` colour; the tests assert the root never does. Icons inherit
  through `IconDefaultsProvider` from `Media` (foreground) and `Actions`
  (muted, a step smaller).
- **Not a virtualised list.** The group is for tens of tiles on one screen. For
  hundreds of uniform cells use a list with `numColumns`.
