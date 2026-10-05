# Layout and structure — design specs

Plan ID: `LAYOUT`. Thirteen components for `@delacour/react-native-ui`, one spec each. Every spec
is self-contained: an implementer needs that file, the root `AGENTS.md` and
`packages/react-native-ui/AGENTS.md`, nothing else.

## Index

| Plan ID | Component | Spec | Folder | One line |
| --- | --- | --- | --- | --- |
| LAYOUT-01 | Carousel | [carousel.md](carousel.md) | `carousel` | Paged slides on one fractional position — track or coverflow, dots, prev/next, autoplay |
| LAYOUT-02 | Direction | [direction.md](direction.md) | `direction` | LTR/RTL for a subtree, plus `useDirection()` and worklet-safe mirroring helpers |
| LAYOUT-03 | Frame | [frame.md](frame.md) | `frame` | A titled shell around a tray of rows, composing `ListGroup` |
| LAYOUT-04 | GridItem | [grid-item.md](grid-item.md) | `grid-item` | A bento grid of tiles with column and row spans, `GridItem.Group` + `GridItem` |
| LAYOUT-05 | ImageViewer | [image-viewer.md](image-viewer.md) | `image-viewer` | Full-screen gallery: zoom, pan, swipe, drag-to-dismiss, opened from a thumbnail |
| LAYOUT-06 | PageHeader | [page-header.md](page-header.md) | `page-header` | Profile/place header — cover, overlapping avatar, title block, actions, stats |
| LAYOUT-07 | ScrollBlur | [scroll-blur.md](scroll-blur.md) | `scroll-blur` | Blurred edges driven by scroll, with a gradient-wash fallback |
| LAYOUT-08 | ScrollCanvas | [scroll-canvas.md](scroll-canvas.md) | `scroll-canvas` | Scroll-driven image effects — parallax, zoom, reveal, frame sequence |
| LAYOUT-09 | ScrollFade | [scroll-fade.md](scroll-fade.md) | `scroll-fade` | Edge fades that appear as content scrolls past; **owns the shared scroll source** |
| LAYOUT-10 | ScrollHeader | [scroll-header.md](scroll-header.md) | `scroll-header` | A collapsing large-title header with a compact bar |
| LAYOUT-11 | Sketch | [sketch.md](sketch.md) | `sketch` | Freehand drawing canvas with tools, swatches, undo and SVG export |
| LAYOUT-12 | SplitView | [split-view.md](split-view.md) | `split-view` | Two stacked panes divided by a draggable handle that settles on snap points |
| LAYOUT-13 | Splitter | [splitter.md](splitter.md) | `splitter` | 2..N resizable panes on either axis; **owns the shared size maths** |

## Shared pieces and their owners

Exactly one component creates each shared file. Everyone else imports it after the owner has merged
into this category branch.

| Shared file | Owner | Consumers |
| --- | --- | --- |
| `src/hooks/use-scroll-source.tsx`, `src/lib/scroll-maths.ts`, `src/lib/scroll-edges.ts` (edge/band/gradient resolvers), the `Screen` bridge in `screen-root.tsx` | LAYOUT-09, shipped on its own `layout-scroll-source` branch | 07, 08, 09, 10 (each stacked on it) |
| `src/expo/blur-layer.tsx`, `expo-blur` optional peer, `useReduceTransparency` | LAYOUT-07 ScrollBlur | 10 (`surface="blur"` only) |
| `src/lib/paging.ts` | LAYOUT-01 Carousel | 05 |
| `splitter/splitter.math.ts` (leaf import) | LAYOUT-13 Splitter | 12 |
| `sketch/sketch.paths.ts` (leaf, no RN imports) | LAYOUT-11 Sketch | Signature, in the Forms category, later |

## Build order

The children start in two waves, so that no child has to recreate a file another child owns.

**Wave 1** — no intra-category dependencies, started together:
LAYOUT-01 Carousel · 02 Direction · 03 Frame · 04 GridItem · 06 PageHeader · 09 ScrollFade ·
11 Sketch · 13 Splitter.

**Wave 2** — each child is branched from the category branch after its owner has merged:

| Child | Waits for |
| --- | --- |
| LAYOUT-05 ImageViewer | 01 Carousel (`lib/paging.ts`) |
| LAYOUT-12 SplitView | 13 Splitter (`splitter.math.ts`) |
| LAYOUT-07 ScrollBlur | 09 ScrollFade |
| LAYOUT-08 ScrollCanvas | 09 ScrollFade |
| LAYOUT-10 ScrollHeader | 09 ScrollFade and 07 ScrollBlur. If 07 slips, ship without `surface="blur"` |

## Cross-category dependencies

Nothing in this category imports from another category's branch.

| Need | Owned by | Decision |
| --- | --- | --- |
| Full-screen layer for ImageViewer | Overlays (Dialog) | Internal React Native `Modal` inside `ImageViewerLayer`, to be swapped later |
| Pagination dots for Carousel | Navigation (Pagination) | Minimal internal `Carousel.Dots` |
| Back button for ScrollHeader | Navigation | A plain `Button` for now |
| Breadcrumbs in PageHeader | Navigation | Out of scope |
| Freehand signature | Forms (Signature) | Sketch owns the path maths in a leaf, `sketch.paths.ts`; the Forms owner should import it rather than fork it |
| Custom colour picker in Sketch | Forms (Color Picker) | Out of scope; `Sketch.Swatches` has a trailing slot for one |

## Edits outside a component's own folder

These are the most likely merge conflicts with the other categories. Each one is called out in its
spec.

- **`theme.css` / `tokens.ts`** — LAYOUT-05 adds a `media` / `media-foreground` pair, derived from
  `foreground` and `background`.
- **`avatar/`** — LAYOUT-06 adds a `2xl` (96pt) step. It is additive: the variants, the size-pin
  test and Avatar's AGENTS.md.
- **`screen/screen-root.tsx`** — LAYOUT-09 mounts the scroll-source bridge.
- **`package.json` peers** — LAYOUT-07 adds `expo-blur` as an optional peer, and the playground adds
  it, which needs a dev-client rebuild.
- **Generated or shared files** that every child touches: the `react-native-ui` `package.json`
  `exports` map (`gen-exports`), `apps/playground/src/demos/registry.ts` (`gen-demos`), the
  playground home list, the Components table in `packages/react-native-ui/AGENTS.md`,
  `packages/cli/src/registry/config.ts`, and `registry/`. To resolve a conflict in any of them,
  take both sides and then regenerate.

## Decisions taken while writing the specs

- **SplitView is not a master–detail layout.** It is two stacked panes that snap. A width-driven
  switch between side by side and stacked is a navigation decision, so the docs show it as a recipe:
  `useWindowDimensions` choosing between `Splitter` and `SplitView`.
- **Direction** wraps Uniwind's own `LayoutDirection`. It has to be verified on a simulator first
  that a `display: contents` node still flips its children; a plain `View` is the fallback.
  `useDirection()` falls back to `I18nManager.isRTL` rather than throwing. Changes to the components
  that should read the direction (Switch, Slider, Tabs, Carousel) are follow-ups.
- **Frame** has no row API of its own: rows are `Item` and `ListGroup.Item`.
- **GridItem** places tiles first-fit in reading order, without dense backfill, and has no `Grid`
  alias.
- **Sketch** uses `react-native-svg`, not Skia. It registers under the layout category.
- **ImageViewer** uses React Native `Image`, with a `renderImage` escape hatch for `expo-image`.
- **Carousel** v1 ships `track` and `coverflow`; `stack` and `interactive` are deferred.

## Done means

Each spec ends with its own acceptance checklist. Across all thirteen: `bun test`,
`bun run typecheck` and `bun run check` are green; every part has a `DelacourUI.` displayName; there
is a component AGENTS.md and a Components-table row; `gen-exports` and `gen-demos` have been run;
there are playground demos (4–6 capture, one hero), a docs page in
`apps/web/content/docs/native/components/`, a registry `ITEM_META` entry and a changeset; and the
component has been checked on a simulator through warden and agent-device.
