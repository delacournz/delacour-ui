# GridItem

A bento grid of tiles: `GridItem.Group` lays out whole-cell tiles of mixed sizes on aligned edges, and `GridItem` is the tile (title, value, description, media, background, footer, actions).

Plan ID: LAYOUT-04
Folder: `packages/react-native-ui/src/components/grid-item`
Import: `@delacour/react-native-ui/grid-item`

## Purpose on mobile

Dashboards, home screens, quick-action boards, storage/usage summaries: a wide tile, two small ones beside it, a tall one tucked next to them, every edge landing on the same columns. Flex-wrap cannot do it (a tall tile makes the row ragged), and `FlatList numColumns` only does uniform tiles.

What it is not:

- Not a virtualised list. The group is for tens of tiles on one screen. For hundreds of uniform cells use a list with `numColumns`.
- Not a masonry layout: tile heights are whole cells, never content-sized. Content taller than its cell is clipped, by design, so the grid reserves its height before anything loads.
- Not `Item`: Item is a row (media, text, actions on one line). GridItem is a tile. They share variant names (`default`, `outline`, `muted`) so a screen mixing both reads as one family, but GridItem owns its own `tv()`.
- Not `Kpi`/`Card`: those are free-standing surfaces. A GridItem is sized by its group, never by its content. A `Kpi` can sit inside a tile.
- Not chrome or scrolling: `Screen` owns insets and scroll; the group is content inside it.

Decision: ship **`GridItem.Group` plus `GridItem`**, one folder, following the `Item.Group` precedent. Rejected: a separate top-level `Grid` export, because the placement maths is meaningless without a tile that publishes spans, and two public names would need two docs rows.

## API

```ts
export const GRID_ITEM_VARIANTS = ["default", "outline", "muted", "plain"] as const;
export const GRID_ITEM_SIZES = ["default", "sm"] as const;
export type GridItemVariant = (typeof GRID_ITEM_VARIANTS)[number];
export type GridItemSize = (typeof GRID_ITEM_SIZES)[number];

/** Exactly one of aspect or rowHeight sizes the rows. */
export type GridItemRowSizing =
	| { aspect?: number; rowHeight?: never }   // cell height = cell width / aspect. Default aspect 1.
	| { rowHeight: number; aspect?: never };   // cell height fixed, in points

export type GridItemGroupProps = ViewProps &
	GridItemRowSizing & {
		/** Track count. Integer >= 1, default 2. */
		columns?: number;
		/** Gutter between cells, both axes, in points. Default 12. */
		gap?: number;
		/** Density for every tile that does not set its own. Default `default`. */
		size?: GridItemSize;
		/** Default variant for every tile that does not set its own. */
		variant?: GridItemVariant;
		className?: string;
		children?: ReactNode;
	};

export type GridItemProps = Omit<PressableProps, "children" | "style"> & {
	/** Cells wide, clamped to the group's columns. Default 1. */
	colSpan?: number;
	/** Cells tall. Default 1. */
	rowSpan?: number;
	variant?: GridItemVariant;
	size?: GridItemSize;
	/** Inherited from Pressable: a tile with onPress is a button; without one it is plain content. */
	onPress?: PressableProps["onPress"];
	isDisabled?: boolean;
	className?: string;
	children?: ReactNode;
};

export type GridItemSlotProps = ViewProps & { className?: string; children?: ReactNode };
export type GridItemTextProps = TextProps & { className?: string };

export const GridItem: ((props: GridItemProps) => ReactElement) & {
	Group: typeof GridItemGroup;
	Background: typeof GridItemBackground;   // absolute-fill, clipped, behind content: gradient, chart, big icon
	Media: typeof GridItemMedia;             // leading icon / thumbnail, fixed size
	Title: typeof GridItemTitle;             // one line label
	Value: typeof GridItemValue;             // the headline metric, tabular numerals
	Description: typeof GridItemDescription; // one muted line
	Footer: typeof GridItemFooter;           // bottom strip for actions
	Actions: typeof GridItemActions;         // trailing top-end controls
};

export function useGridItem(): { variant: GridItemVariant; size: GridItemSize; colSpan: number; rowSpan: number; width: number; height: number };
export function useGridItemGroup(): { columns: number; gap: number; cellWidth: number; cellHeight: number };
```

Usage:

```tsx
<GridItem.Group columns={4} gap={12} aspect={1}>
  <GridItem colSpan={2} rowSpan={2} onPress={openStorage}>
    <GridItem.Background><Chart ... /></GridItem.Background>
    <GridItem.Title>Storage</GridItem.Title>
    <GridItem.Value>74 GB</GridItem.Value>
    <GridItem.Description>of 100 GB</GridItem.Description>
  </GridItem>
  <GridItem><GridItem.Media><Icon icon={IconWifi} /></GridItem.Media><GridItem.Title>Wi-Fi</GridItem.Title></GridItem>
  <GridItem><GridItem.Media><Icon icon={IconBluetooth} /></GridItem.Media><GridItem.Title>Bluetooth</GridItem.Title></GridItem>
  <GridItem colSpan={2}><GridItem.Title>Battery</GridItem.Title><GridItem.Value>82%</GridItem.Value></GridItem>
</GridItem.Group>
```

Spans are read from the group's **direct** children's props (`Children.toArray`, like `ListGroup`'s divider walk). A child wrapped in a custom component loses its spans: the wrapper must accept and forward `colSpan`/`rowSpan`, and the AGENTS.md says so. Non-`GridItem` direct children count as 1x1.

## How the layout is computed

1. Group measures its own width with `onLayout` (once per width change).
2. `resolveCellSize(width, columns, gap, sizing)` gives `cellWidth = (width - gap*(columns-1)) / columns` and `cellHeight = rowHeight ?? cellWidth / aspect`.
3. `placeTiles(spans, columns)` assigns each tile `(row, col)` by first fit in row-major order, never searching earlier than the previous tile's slot (so tiles land in writing order, and a tall tile leaves the cells beside it for the next ones).
4. `tileRect(placement, cell, gap)` turns that into `{ start, top, width, height }`, edges snapped to the pixel grid so neighbours never gain a hairline gap.
5. Each tile is absolutely positioned with the **logical** `start` inset (not `left`), so it mirrors under RTL with no extra code. Group height is `gridHeight(rows, cellHeight, gap)`, set on the group.

Before the first measure the group reserves height with `rowHeight` if given, else an `aspectRatio` of `columns*aspect/rows` on the root (gap ignored), and renders tiles invisibly (`opacity: 0`) until measured, so there is no jump when content appears. The exact height replaces it on the first `onLayout`.

## Variants & sizes

One slotted `tv()` in `grid-item.variants.ts`; slots `group`, `root`, `background`, `media`, `title`, `value`, `description`, `footer`, `actions`.

| variant | fill | border |
| --- | --- | --- |
| `default` | `bg-card` | `border-border` |
| `outline` | transparent | `border-border` |
| `muted` | `bg-muted` | transparent |
| `plain` | transparent | transparent |

Every variant reserves the same 1pt border (as `Surface`), so changing variant never moves content. Corner `rounded-lg` + `border-continuous`; root `overflow-hidden` so `Background` takes the corner.

| size | padding | title | value | media |
| --- | --- | --- | --- | --- |
| `default` | `p-4` | `text-sm` | `text-2xl` semibold, tabular | `size-icon-md` |
| `sm` | `p-3` | `text-xs` | `text-lg` | `size-icon-sm` |

Slots hold text colour on text parts only (rule 1): `title` `text-foreground`, `description` `text-muted-foreground`, `value` `text-foreground`. Icons inherit through `IconDefaultsProvider` from `Media`. No new tokens; no shadows. A disabled tile gets `opacity-50` (matching Pressable).

## States

- Group props are controlled by the caller; no internal selection. No `useControllableState`.
- Tile `isDisabled`: dimmed, not pressable, `accessibilityState.disabled`.
- Pressable tile: `feedback="scale"` default with a gentle `pressedScale`, `haptic` from Pressable passes through. A non-pressable tile renders a plain `View` (no gesture handler cost).
- Loading: a tile with `Skeleton` children keeps its size because size is the cell's.
- Empty group: height 0, nothing drawn.
- Zero width (not laid out yet): see "How the layout is computed".

## Accessibility

- Group: `accessibilityRole="list"`; each tile `listitem` is not a native role on iOS, so tiles are announced by order via grouping: a non-pressable tile is `accessible` with `accessibilityLabel` joined from Title, Value, Description text (via a `GridItem` collector, or the caller's `accessibilityLabel`) so VoiceOver reads one stop per tile instead of three.
- Pressable tile: role `button`, same joined label, `accessibilityHint` caller-supplied.
- Screen-reader order follows writing order (`placeTiles` order), not geometry, which is what the children order already is.
- Reduce motion: relayout animation (below) is skipped; press feedback follows calm-motion through Pressable.
- Dynamic type: clipped content is the design trade-off. Document that large text needs `rowHeight` bigger or fewer columns, and expose `useGridItemGroup().cellHeight` for a caller to switch `columns` on `PixelRatio.getFontScale()`.

## Motion

- Press scale via Pressable (UI thread).
- Optional relayout: when `columns`/`gap`/width change (rotation, split view), each tile uses Reanimated `LinearTransition` (`.duration(220)`); when `useCalmMotion()` is true pass `undefined` so it jumps. First mount never animates.
- No gestures of its own. No drag-reorder (out of scope).

## Reuses

- `Pressable` (feedback, haptic, disabled, `asChild`).
- `Text` presets for Title/Value/Description, `Icon` + `IconDefaultsProvider` for Media.
- `Separator` not used. `Skeleton` and `Chart` as caller-supplied content for `Background`.
- `expo-linear-gradient` is already a peer: callers may place it in `Background`; GridItem does not import it (rule 4 would put it under `src/expo/`).
- `use-calm-motion`.
- Leaf `surface.variants` only if the fill ladder is wanted; recommended not, tiles are not nesting planes.

## New peer deps

None. Alternative considered and rejected: `@legendapp/list` (already catalogued) with a custom layout; heavier than needed and its recycling would break spans.

## Cross-category dependencies

None blocking. `Background` hosts `Chart` (Display, shipped) and `Media` hosts `Avatar` (shipped); both are caller composition. Context menus on long-press are the Overlays owner's concern; a tile exposes `onLongPress` through Pressable.

## Pure logic to unit-test

All in `grid-item.layout.ts` (pure, no RN imports) and `grid-item.variants.ts`; tests first.

`resolveCellSize(width, columns, gap, sizing)`:

| Input | Expected |
| --- | --- |
| `(342, 2, 12, {})` | `{ cellWidth: 165, cellHeight: 165 }` |
| `(342, 2, 12, { aspect: 2 })` | `{ cellWidth: 165, cellHeight: 82.5 }` |
| `(342, 2, 12, { rowHeight: 100 })` | `{ cellWidth: 165, cellHeight: 100 }` |
| `(0, 2, 12, {})` | `{ cellWidth: 0, cellHeight: 0 }` |
| `(100, 4, 40, {})` | `cellWidth` clamped to `0` (gap larger than width never goes negative) |
| `columns` `0` or `2.7` | treated as `1` and `2` (integer >= 1) |
| `aspect` `0` or negative | falls back to `1` |

`placeTiles(spans, columns)` returns `{ placements: {row,col,colSpan,rowSpan}[]; rows: number }`:

| Input | Expected |
| --- | --- |
| `([{1,1},{1,1},{1,1}], 2)` | `(0,0) (0,1) (1,0)`, rows 2 |
| `([{2,1},{1,2},{1,1},{1,1}], 3)` | `(0,0) (0,2) (1,0) (1,1)`, rows 2 |
| `([{1,2},{1,1},{1,1}], 2)` | `(0,0) (0,1) (1,1)`, rows 2 (tucks beside the tall tile) |
| `([{3,1}], 2)` | colSpan clamped to 2, `(0,0)`, rows 1 |
| `([{1,0}], 2)` | rowSpan floored to 1 |
| `([], 2)` | `{ placements: [], rows: 0 }` |
| no overlap | property test: for random spans no two placements share a cell |
| writing order | each tile's `(row,col)` is >= the previous in row-major order |

`tileRect(placement, cell, gap, pixelRatio)`: colSpan 2 at col 0 of the 342 grid is `{ start: 0, width: 342 }`; col 1 span 1 is `{ start: 177, width: 165 }`; adjacent tiles satisfy `a.start + a.width + gap === b.start` after pixel snapping at ratio 3 (use rounded edges, width is end minus start), and a spanning tile's height is `rowSpan*cellHeight + (rowSpan-1)*gap`.

`gridHeight(rows, cellHeight, gap)`: `(2, 165, 12) = 342`, `(0, 165, 12) = 0`, `(1, 100, 12) = 100`.

`resolveInitialAspect(columns, rows, aspect)`: `(2, 2, 1) = 1`, `(4, 2, 1) = 2`, never returns 0 or NaN.

`gridItemVariants` tests: variant class lists above, no `shadow`, no `text-*` in `root`, the border is reserved in every variant, `GRID_ITEM_*` tuples exact.

## File map

```
packages/react-native-ui/src/components/grid-item/
  AGENTS.md
  index.ts
  grid-item.tsx                  tile + Object.assign surface
  grid-item-group.tsx            measures, places, sets height
  grid-item-background.tsx
  grid-item-media.tsx
  grid-item-title.tsx
  grid-item-value.tsx
  grid-item-description.tsx
  grid-item-footer.tsx
  grid-item-actions.tsx
  grid-item.context.tsx          tile context + group context, hooks, useGridItemPart
  grid-item.types.ts
  grid-item.layout.ts            resolveCellSize, placeTiles, tileRect, gridHeight, resolveInitialAspect
  grid-item.layout.test.ts
  grid-item.variants.ts
  grid-item.variants.test.ts
```

Display names: `DelacourUI.GridItem`, `DelacourUI.GridItem.Group`, `.Background`, `.Media`, `.Title`, `.Value`, `.Description`, `.Footer`, `.Actions`, and the two providers `DelacourUI.GridItem.Provider` and `DelacourUI.GridItem.GroupProvider`.

## Playground demo

`apps/playground/src/demos/grid-item/`:

| File | Shows | Capture |
| --- | --- | --- |
| `dashboard.tsx` (hero) | 4-column bento: wide, tall and small tiles | yes, `align: "stretch"` |
| `variants.tsx` | default / outline / muted / plain | yes |
| `interactive.tsx` | pressable tiles with haptics and a disabled one | yes, flow `grid-item/interactive` |
| `backgrounds.tsx` | gradient and chart behind content | yes |
| `quick-actions.tsx` | 3-column icon tiles | yes |
| `row-sizing.tsx` | `aspect` vs `rowHeight`, `columns` 2 / 3 / 4 | no |

Route `apps/playground/src/app/(components)/grid-item.tsx`, `components-index.ts` row (group `Layout`, "Bento tiles on aligned cells"), icon in `app/index.tsx`, `gen-demos`. `testID` on every tile a flow presses.

## Docs page

`apps/web/content/docs/native/components/grid-item.mdx`: hero Preview, Installation, Usage, "How cells work" (diagram of cells and spans), Variants, Sizes, Backgrounds, Row sizing (`aspect` vs `rowHeight`), Clipping and large text, "GridItem vs Item vs Kpi" table, API tables. `ITEM_META["grid-item"] = { title: "Grid Item", description: "A bento grid of whole-cell tiles with aligned edges, and the tile with title, value and background parts.", categories: ["layout"] }`. `PACKAGE_INSTALL`: nothing new (reanimated, gesture handler already classified).

## Changeset

`@delacour/react-native-ui` minor: "Add GridItem and GridItem.Group, a bento tile grid with whole-cell spans."

## Out of scope

- Drag to reorder, resize handles, edit mode.
- Virtualisation or recycling.
- Content-sized (masonry) heights.
- Dense backfill of earlier holes (monotonic placement is the rule).
- Responsive breakpoints: callers pick `columns`.
- RTL work beyond using the logical `start` inset (verify only).

## Acceptance checklist

- [ ] `grid-item.layout.test.ts` and `grid-item.variants.test.ts` written first, red then green (`bun test packages/react-native-ui/src/components/grid-item`)
- [ ] `bun run typecheck`, `bun run check` clean
- [ ] Every part and both providers carry `DelacourUI.` display names; `display-name.test.ts` passes
- [ ] `grid-item/AGENTS.md` (axes, direct-children rule, why clipping, why `start` not `left`, file map); Components table row; `docs.test.ts` passes
- [ ] `bun run gen-exports`, `bun run gen-demos`
- [ ] Docs page, `ITEM_META`, changeset, registry build
- [ ] No `any`, no comments in JSX, a part never imports its own index or root
- [ ] No layout jump between first frame and measured frame (record a clip, compare)
- [ ] Simulator via agent-device (`warden claim ios`): open `grid-item/dashboard`, `snapshot -i`, confirm the wide tile and the two small tiles share a left edge by comparing `get` frames, `press id=tile-storage`, rotate the device and `wait` for the 4-to-6 column relayout, reduce motion on and verify no transition; `close` session, `warden release`
- [ ] Under RTL (`Direction dir="rtl"` once LAYOUT-02 lands) tiles mirror with no code change

## Open questions

1. Placement: monotonic first-fit (writing order, may leave holes) or dense backfill? Recommended monotonic. `1.a` monotonic.
2. Export names: `GridItem` with `GridItem.Group`, or also a `Grid` alias? Recommended no alias. `2.a` no alias.
3. Should a non-pressable tile be `accessible` as one stop by default? Recommended yes, with the label joined from its text parts. `3.a` yes.

## Implementation status (2026-10-05)

Shipped on `feature/layout-grid-item`, standalone (no cross-category imports). Open questions resolved as recommended: `1.a` monotonic, `2.a` no alias, `3.a` a non-pressable tile is one accessible stop.

Deviations from the checklist:

- **Previews** captured on the dev client (2026-10-06): 3 stills, 2 clips, `dashboard` the animated hero. Its toggle tiles are a wrapper component that forwards `rowSpan`, which is the documented rule in practice.
- **Simulator** verified with agent-device: aligned edges, joined labels, press and disabled state. Rotation, reduce motion and RTL not exercised (portrait-locked playground; LAYOUT-02 unmerged).
- The dashboard demo carries seven tiles rather than four so its four columns have no holes.
