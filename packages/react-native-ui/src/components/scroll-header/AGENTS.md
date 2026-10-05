# ScrollHeader

A collapsing header: a large title block — optionally over a stretching cover — scrolls away while
a compact bar stays pinned and takes over in one crossfade, settling open or closed when the scroll
comes to rest, with a progress value the rest of the screen can follow.

```ts
import { ScrollHeader, useScrollHeader } from "@delacour/react-native-ui/scroll-header";
```

## The Screen rule — read this first

**`ScrollHeader` replaces `Screen.Navbar`; it is not a `Screen` part.** Inside a `<Screen>`, mount
**no** `Screen.Navbar` and use `ScrollHeader.ScrollView` / `.FlatList` (or a scroller wired through
`useScrollHeader()`), **not** `Screen.ScrollArea`. A Screen scrollable reserves the navbar's height,
and with no navbar `resolveScrollTopInset` falls back to the status-bar inset — which would stack on
`ScrollHeader.Inset`, a double top gap. `Screen.Footer` and `Screen.Content` compose fine.

`Screen.Navbar` is *measured chrome*: its height feeds every Screen scrollable's top inset. A
collapsing header changes size every frame and owns its scroller's inset, so folding it into the
navbar would make a static concept animate. It does not publish into `Screen`'s context.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/scroll-header` |
| `scroll-header.tsx` | The `Object.assign` surface and the doc comment; names the root |
| `scroll-header-root.tsx` | The root: scroll source, derived values, snap, the collapsed mirror, dev warnings |
| `scroll-header.context.tsx` | Leaf. The context, `useScrollHeaderPart`, `useScrollHeader()` |
| `scroll-header.types.ts` | Leaf. Root props, the context value, the scroller `onScroll` union |
| `scroll-header.variants.ts` | The slotted `tv()`, the constants and every pure resolver (all worklets) |
| `scroll-header.variants.test.ts` | The collapse, inset, stretch, snap and crossfade maths |
| `scroll-header-bar.tsx` | `ScrollHeader.Bar` — safe-area band, measured row |
| `scroll-header-bar-surface.tsx` | Internal, memoised. The bar's backing, blur engine and hairline |
| `scroll-header-bar-title.tsx` | `ScrollHeader.BarTitle` |
| `scroll-header-large.tsx` | `ScrollHeader.Large` |
| `scroll-header-cover.tsx` | `ScrollHeader.Cover` |
| `scroll-header-inset.tsx` | `ScrollHeader.Inset` — the animated spacer |
| `scroll-header-scroll-view.tsx` | `ScrollHeader.ScrollView` |
| `scroll-header-flat-list.tsx` | `ScrollHeader.FlatList`, cast to keep its generic |
| `use-scroll-header-scroll-props.ts` | A scroller part's wiring: composes the caller's `onScroll`, registers the scroller |

Not owned here: `hooks/use-scroll-source.tsx` and `lib/scroll-maths.ts` (the scroll family's shared
source), and ScrollBlur's engine contract — `scroll-blur/scroll-blur.context.tsx` (`useBlurLayer`)
and `scroll-blur/scroll-blur.types.ts` (`BlurLayerComponent`), imported as **leaves** (package rule
3), never through `../scroll-blur`. `useReduceTransparency` is in `hooks/`.

## Design

- **One scroll source, owned by the root.** The root calls `useScrollSource` and publishes it
  through `ScrollSourceProvider` too, so a `ScrollBlur` inside the header needs no `scrollSource`.
  The scroller parts spread its `scrollProps`; nothing clones a child to attach `onScroll` — that
  would fight the caller's own handler and Reanimated's composition.
- **Every number is derived on the UI thread.** `collapseDistance` = Large height × `threshold`
  (clamped 0.1–1), `progress` = offset ÷ distance (clamped), `topInset` = safe area + bar row +
  Large. The parts read them in animated styles; nothing reads `.value` during render (React Compiler
  is on in the playground, and a render-time read is a stale snapshot).
- **The layers stack by z-index, not by source order**, so the parts can be written in any order:
  cover at `zIndex: -1` (inline — no negative z utility is relied on), scroller in the flow, Large at
  `z-10`, bar at `z-20`.
- **The Large block is measured and display-only.** Its height is the collapse distance, so larger
  Dynamic Type lengthens the travel and `onLayout` re-derives it. It is `pointerEvents="none"`: it
  floats over the scroller rather than inside it, and on iOS a drag that starts on a view outside a
  scroll view never reaches that scroll view's pan — a drag on the title would not scroll. Controls
  go in the bar or at the top of the content.
- **The inset is a view with an animated height**, not content padding: padding cannot animate on
  the UI thread, and the bar and the Large block measure after the first frame. `ScrollHeader.FlatList`
  puts it in `ListHeaderComponent`, ahead of the caller's own, because a virtualised list measures
  its own content.
- **Snap runs after the scroller settles, never during a gesture.** `onEndDrag` settles only when
  the release was slower than `SCROLL_HEADER_SNAP_VELOCITY` (no momentum follows); otherwise
  `onMomentumEnd` does. `resolveSnapTarget` picks the nearer end, or nothing when the header is
  already at an end, past it, or pulled down. The worklets are handed to `useScrollSource`, which is
  what creates the animated ref, so they cannot close over it: they write `snapTarget`, and a
  reaction declared after the source performs `scrollTo` — both on the UI thread. Under Reduce
  Motion the scroll is instant.
- **`onCollapsedChange` fires once per crossing.** An `useAnimatedReaction` on `progress >= 1`
  calls `scheduleOnRN` only when the boolean flips — and on mount only when the header starts
  collapsed (a restored offset). The same callback sets the JS `isCollapsed` state accessibility
  reads, so that state changes twice per round trip, not per frame.
- **`progress` is an output.** The prop is a `SharedValue` the root writes every frame through a
  reaction; the header is uncontrolled and derives everything from the scroll.
- **The bar surface fades in with the collapse; its controls never fade.** `plain` / `muted` / `none`
  are one `tv()` axis on `barSurface`; `blur` draws the injected engine plus a 55% page-colour wash.
  With no engine (no `layer`, no `ScrollBlurLayerProvider`) or under Reduce Transparency, `blur`
  renders as `plain` — a transparent bar over scrolled rows would put the bar's text on the rows. No
  blur package is imported here — a grep of this folder for the engine's package name finds nothing, and
  must keep finding nothing.
- **No Large block, no collapse.** The distance is 0, `progress` is a step, the bar title is always
  drawn and announced, and the surface arrives over `SCROLL_HEADER_NO_LARGE_FADE_DISTANCE` (24pt) —
  `scrollEdgeOpacity`'s start-edge ramp, inlined because every resolver here is a self-contained
  worklet (see the scroll family's rule in the package doc). Snap never fires (no distance).
- **The cover rests at `topInset` tall** and so ends exactly where the first row begins. Scrolling
  up it travels with the content; pulled down it grows from its top edge (`stretch`), or rides down
  with the content when stretch is off — which it is under Reduce Motion.
- **A scroller's own `onScroll` is composed, never replaced.** A Reanimated handler goes through
  `useComposedEventHandler`. A plain function cannot (an animated `onScroll` replaces a JS one
  outright), so it is forwarded with `scheduleOnRN`, carrying the event payload — the `nativeEvent`
  a plain `ScrollView` would hand it. The type says so: `ScrollHeaderOnScroll` is that union, and a
  plain function receives a `NativeScrollEvent`, not a synthetic event.
- **Dev warnings, not errors**, for a root measured 0 tall (it is `flex-1`; give its parent a
  height) and for more than one scroller mounted.
- **No back-button part.** `Screen.Navbar.BackButton` is reachable only through the `Screen`
  compound, and importing `../screen` would pull Screen into this item's registry closure. A shared
  back control is a Navigation-category decision; the docs and demos use a `Button size="icon-sm"`
  with a chevron.

## Accessibility

- `BarTitle` is `accessibilityRole="header"`. While the header is open it repeats the large title,
  so it is hidden (`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`)
  until collapsed, and the Large block is hidden once collapsed: one title announced in each state.
- The bar's controls are always mounted and always opaque, so they are reachable in both states.
- Cover and bar surface are decorative: no touches, hidden from assistive technology.
- Reduce Motion: no stretch, instant snap; the crossfade still follows the finger. Reduce
  Transparency: the blur bar is plain.

## Out of scope

Router integration, native large titles, back-swipe coupling; sticky section headers; horizontal
collapse; several scrollers at once; pull-to-refresh coordination (`RefreshControl` works unchanged
on the scroller, but its offset is not wired into `progress`); changes to `Screen.Navbar` or
`Screen`'s context; auto-hide on scroll down.

## Demos and preview media

Six demos in `apps/playground/src/demos/scroll-header/`, each a whole screen (`min-h-[600px] flex-1`,
so it fills the device preview and still has a height inside the gallery pager). **None is marked
`capture` yet**, for the same reason as ScrollBlur: the `argent` CLI `bun run previews` drives is not
installed on the machine this branch was built on, and a captured demo without a manifest entry fails
`demos.test.ts`. To publish, mark `large-title-list` (`hero`, flow: scroll, settle, snap), `cover`
(flow: pull then scroll), `blur-bar` and `react-to-collapse` (flow: scroll) with
`capture: { frame: "device" }`, write the flows under `.argent/flows/previews/scroll-header/`, run
`bun run previews -- -- --only scroll-header`, and add a `<Preview>` above each matching docs section.

## Simulator check

See the bottom of this file's git history and the workspace card for what was checked on a
simulator; anything not listed there is unchecked.
