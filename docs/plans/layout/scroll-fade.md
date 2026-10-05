# ScrollFade

A gradient that fades a scrollable's start and end edges while there is more content past them, so content reads as passing beneath the boundary instead of being cut. **Also the owner of the scroll-family shared contract** (`useScrollSource`, `ScrollSourceProvider`, `scroll-maths`) that ScrollBlur, ScrollCanvas and ScrollHeader build on.

Plan ID: LAYOUT-09
Folder: `packages/react-native-ui/src/components/scroll-fade`
Import: `@delacour/react-native-ui/scroll-fade`
Build order: **first of the four** (LAYOUT-09 -> LAYOUT-07 -> LAYOUT-08, LAYOUT-10). The other three import its leaves.

## Purpose on mobile

A list or carousel with a hard edge looks finished; a row sliced mid-height by the viewport reads as a layout bug, the same row fading out reads as "more to come". ScrollFade is that affordance for any scrollable that is *not* a `Screen` body: a horizontal card row, a list inside a `Card`, a sheet body, a chip strip. It works vertically and horizontally.

It is **not**:
- a replacement for `Screen.ScrollShadow` (see Reuses) - that one is navbar/footer-aware and stays;
- a blur (ScrollBlur, LAYOUT-07) or a scroll indicator;
- a scroll wrapper - it never clones or wraps the scrollable's props (see Design).

## Family decision (applies to LAYOUT-07/08/09/10)

Decision: **four standalone folders over one shared scroll source; `Screen` is extended only by one internal bridge, not by new parts.**

1. `Screen` already publishes `scrollY`, `contentHeight`, `layoutHeight` from whichever scrollable it holds, and `Screen.ScrollShadow` / `Screen.Navbar fadeBorderOnScroll` read them. That stays untouched. But those values are Screen-private context; a horizontal carousel, a card list or a sheet body has no Screen.
2. A new hook module `src/hooks/use-scroll-source.tsx` defines `ScrollSource` (the same three shared values plus `orientation` and an optional animated ref) and a `ScrollSourceProvider`. Resolution order for every family member: explicit `scrollSource` prop -> nearest `ScrollSourceProvider` -> throw naming the component.
3. `ScreenRoot` mounts a tiny internal `ScreenScrollSourceBridge` (`screen-scroll-source.tsx`) that provides a `ScrollSource` built from the context's existing shared values (`scrollY`->`offset`, `contentHeight`->`contentSize`, `layoutHeight`->`layoutSize`, `ref: null`). Result: inside a `<Screen>` every family member works with zero wiring; outside, the caller uses `useScrollSource()`. The dependency points one way (screen -> hook), so installing the hook never drags `Screen` (and its peers) into the registry closure.
4. Pure maths shared by all four lives in `src/lib/scroll-maths.ts` (owner: this plan). Pure edge-band geometry lives in `src/lib/scroll-edges.ts` (shared, so ScrollBlur never imports ScrollFade's folder). *Moved during implementation:* it was first written in `scroll-fade.variants.ts`; the shared scroll-source branch (`hooks/use-scroll-source.tsx`, `lib/scroll-maths.ts`, `lib/scroll-edges.ts`, the Screen bridge) ships on its own and all four family members stack on it.
5. No component clones a child to attach `onScroll`. The caller spreads `scrollProps` (from `useScrollSource`) onto their scrollable. Cloning collides with Reanimated handler composition and with the handlers every Screen scrollable already owns.

Ownership table (no two plans touch the same file):

| Artifact | Owner |
| --- | --- |
| `hooks/use-scroll-source.tsx`, `lib/scroll-maths.ts` (+test), `lib/scroll-edges.ts` (+test), `screen/screen-scroll-source.tsx` and the one-line mount in `screen-root.tsx` | LAYOUT-09, shipped as its own shared branch (`layout-scroll-source`) |
| `components/scroll-fade/*` | LAYOUT-09 |
| `hooks/use-reduce-transparency.ts`, `lib/color.ts#withAlpha`, `components/scroll-blur/*`, `expo/blur-layer.tsx` | LAYOUT-07 |
| `components/scroll-canvas/*` | LAYOUT-08 |
| `components/scroll-header/*` | LAYOUT-10 |

## API

### Shared contract (`src/hooks/use-scroll-source.tsx`)

```ts
import type { Component, ReactElement, ReactNode } from "react";
import type { LayoutChangeEvent } from "react-native";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";

export type ScrollOrientation = "vertical" | "horizontal";

/** Everything a scroll-linked effect reads, all of it on the UI thread. */
export type ScrollSource = {
	/** Scroll offset along `orientation`; negative while rubber-banding at the start. */
	offset: SharedValue<number>;
	/** Content extent along `orientation`; 0 until measured. */
	contentSize: SharedValue<number>;
	/** Viewport extent along `orientation`; 0 until measured. */
	layoutSize: SharedValue<number>;
	orientation: ScrollOrientation;
	/** Present when the source came from `useScrollSource`; null from a Screen. Lets an effect `measureLayout` against the scroller. */
	ref: AnimatedRef<Component> | null;
};

/** The scroll-event fields a handler worklet receives, narrowed to what the family reads. */
export type ScrollEventFields = {
	contentOffset: { x: number; y: number };
	contentSize: { width: number; height: number };
	layoutMeasurement: { width: number; height: number };
	velocity?: { x: number; y: number };
};

export type UseScrollSourceOptions = {
	/** @default "vertical" */
	orientation?: ScrollOrientation;
	/** Worklets composed after the source has written its values. */
	onBeginDrag?: (event: ScrollEventFields) => void;
	onEndDrag?: (event: ScrollEventFields) => void;
	onMomentumBegin?: (event: ScrollEventFields) => void;
	onMomentumEnd?: (event: ScrollEventFields) => void;
};

/** Props to spread onto an `Animated.ScrollView` / `Animated.FlatList` / SectionList. */
export type ScrollSourceProps = {
	ref: AnimatedRef<Component>;
	onScroll: ReturnType<typeof useAnimatedScrollHandler>;
	onLayout: (event: LayoutChangeEvent) => void;
	onContentSizeChange: (width: number, height: number) => void;
	scrollEventThrottle: 16;
};

export function useScrollSource(options?: UseScrollSourceOptions): { source: ScrollSource; scrollProps: ScrollSourceProps };
export function ScrollSourceProvider(props: { source: ScrollSource; children: ReactNode }): ReactElement;
/** Nearest provider's source, or null. For optional consumers. */
export function useScrollSourceContext(): ScrollSource | null;
/** Explicit source, else ambient, else throws "`<component>` must be given a `scrollSource` or rendered inside a Screen / ScrollSourceProvider." */
export function useResolvedScrollSource(component: string, explicit?: ScrollSource): ScrollSource;
```

`onLayout` / `onContentSizeChange` write `layoutSize` / `contentSize` on first layout, so a ScrollFade over a *short* list is correct before the first scroll event (a Screen's source only learns sizes from scroll events - see unmeasured policy below). `ScrollSourceProvider.displayName = "DelacourUI.ScrollSourceProvider"`.

### `src/lib/scroll-maths.ts` (pure, every function self-contained and marked `"worklet"`)

```ts
export type ScrollEdge = "start" | "end";

export function readScrollEvent(
	event: ScrollEventFields,
	orientation: ScrollOrientation
): { offset: number; contentSize: number; layoutSize: number };

/** 0..1 opacity of an edge affordance. See test table. */
export function scrollEdgeOpacity(state: {
	edge: ScrollEdge;
	offset: number;
	contentSize: number;
	layoutSize: number;
	/** Points of travel from fully clear to fully in. 0 makes it a step. */
	fadeInDistance: number;
}): number;

/** Linear 0..1 position of `value` between `from` and `to`, clamped; `from` may exceed `to`. */
export function scrollProgress(value: number, from: number, to: number): number;
```

**Worklet rule (from `Screen`'s crash):** a module-scope helper called from a worklet can be missing from the closure (`undefined is not a function` on the UI thread, invisible to `bun test`). Each function above writes its own clamp inline and never calls another. A simulator check is in the acceptance list.

### ScrollFade

```ts
export const SCROLL_FADE_EDGES = ["both", "start", "end", "none"] as const;
export type ScrollFadeEdges = (typeof SCROLL_FADE_EDGES)[number];

export type ScrollFadeProps = Omit<ViewProps, "pointerEvents"> & {
	/** The scrollable (and anything else) the fade overlays. Fades paint after it, so they sit on top. */
	children: ReactNode;
	/** Fade depth in points. @default 48 */
	size?: number;
	/** Which edges fade. @default "both" */
	edges?: ScrollFadeEdges;
	/** Colour the content fades into. Defaults to the `background` token; name the surface it sits on (a `card`) or it reads as a grey band. */
	color?: string;
	/** Travel in points from clear to full. @default 24 */
	fadeInDistance?: number;
	/** Points to hold each fade in from its edge, e.g. under a bar this folder cannot see. @default 0 */
	insetStart?: number;
	insetEnd?: number;
	/** Explicit source; otherwise the nearest provider / the enclosing Screen. */
	scrollSource?: ScrollSource;
	/** Draw nothing without unmounting. @default true */
	enabled?: boolean;
	className?: string;
};
```

No `orientation` prop: it is `source.orientation`, fixed by whoever created the source (`useScrollSource({ orientation: "horizontal" })`), so it cannot disagree with the scroller.

```tsx
function Carousel() {
	const { source, scrollProps } = useScrollSource({ orientation: "horizontal" });

	return (
		<ScrollFade scrollSource={source} size={40}>
			<Animated.ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerClassName="gap-3 px-screen-gutter"
				{...scrollProps}
			>
				{cards}
			</Animated.ScrollView>
		</ScrollFade>
	);
}
```

Inside a Screen: `<ScrollFade><Screen.ScrollArea>{rows}</Screen.ScrollArea></ScrollFade>`; no source wiring. (`className="flex-1"` on the fade to fill.)

`ScrollFade.displayName = "DelacourUI.ScrollFade"`; no compound parts, so no `useScrollFade()` hook (the hook that matters is `useScrollSource`).

## Variants & sizes

Pattern A (styled wrapper) with a `tv()` in `scroll-fade.variants.ts`:
- slots: `root` (`relative`), `band` (`absolute`), axis variant `orientation: vertical | horizontal` on `band` (`inset-x-0` vs `inset-y-0`). Defaults `vertical`.
- No `size` axis: `size` is a number prop (a numeric dimension can never be a class - package Sizing rule).
- Tokens: none new. Colour via `useThemeColor("background")` (gradient stops need strings). `transparentOf` from `lib/color.ts` for the far stop; if it returns `undefined`, render children only (decline to draw, never the `transparent` keyword).

Pure resolvers in `src/lib/scroll-edges.ts` (no RN imports, every one a self-contained worklet; moved there from `scroll-fade.variants.ts` so ScrollBlur shares them without a cross-folder import). The edges union is `SCROLL_EDGES` / `ScrollEdges` there; `SCROLL_FADE_EDGES` / `ScrollFadeEdges` re-export it:
- `resolveFadeEdges(edges): { start: boolean; end: boolean }`
- `resolveFadeBand({ orientation, edge, size, inset }): { top?; bottom?; left?; right?; width?; height? }`
- `resolveFadeGradient({ orientation, edge }): { start: {x; y}; end: {x; y} }` (near colour at the edge -> faded inward)

## States

- Uncontrolled only; there is no value. `enabled=false` renders children in the wrapper with no overlays.
- Unmeasured policy: `contentSize` or `layoutSize` of 0 -> start edge follows `offset`, **end edge reads 1** (draw it). This is `Screen`'s policy, required because a Screen's source only learns sizes on the first scroll event; a tall Screen list must show its bottom fade at rest. Sources from `useScrollSource` measure on layout, so a short list loses the fade within a frame.
- Short content (`contentSize <= layoutSize`) -> both edges 0.

## Accessibility

Purely visual: overlays are `pointerEvents="none"`, `accessible={false}`, `importantForAccessibility="no-hide-descendants"`. The wrapper adds nothing to the AX tree. Scroll-linked, driven by the user's own gesture, so it stays under reduce motion (no autonomous motion).

## Motion

UI-thread only: one `useAnimatedStyle` per edge reading `source.offset/contentSize/layoutSize` and calling `scrollEdgeOpacity` - zero React renders while scrolling. Gradient is static; only opacity animates. No calm-motion branch (nothing loops or moves on its own).

## Reuses

- `expo-linear-gradient` - already a declared (non-optional) peer, already imported by `Screen.ScrollShadow` in `components/`. Same usage, no new dependency; this follows that existing precedent rather than package rule 4 (flagged as an open question).
- `useThemeColor`, `transparentOf`, `cn`, `tv` from `lib/tv`.
- Relation to `Screen.ScrollShadow`: **kept as is.** ScrollShadow measures the navbar/footer, supports `coverTop`/`coverBottom` solid bands and is the right tool for a Screen body; ScrollFade is element-local (edges of its own box, either axis, any container). Follow-up (not this plan): re-implement ScrollShadow's opacity on `scrollEdgeOpacity`. Docs page carries a "ScrollFade vs Screen.ScrollShadow" table.

## New peer deps

None. Alternative considered: `react-native-svg` linear gradients (already a peer) - rejected, a native gradient view is cheaper per frame and `Screen` already pays for it.

## Cross-category dependencies

None. Composes with `Item`/`ListGroup`/`Card`/`BottomSheet.Body` as children only; no imports from them.

## Pure logic to unit-test

`src/lib/scroll-maths.test.ts` (written first):

`scrollEdgeOpacity`
| edge | offset | contentSize | layoutSize | dist | -> |
| --- | --- | --- | --- | --- | --- |
| start | 0 | 1000 | 600 | 24 | 0 |
| start | 12 | 1000 | 600 | 24 | 0.5 |
| start | 100 | 1000 | 600 | 24 | 1 |
| start | -30 (overscroll) | 1000 | 600 | 24 | 0 |
| end | 0 | 1000 | 600 | 24 | 1 |
| end | 388 | 1000 | 600 | 24 | 0.5 |
| end | 400 | 1000 | 600 | 24 | 0 |
| end | 430 (bounce) | 1000 | 600 | 24 | 0 |
| start / end | 50 | 300 | 600 (short) | 24 | 0 / 0 |
| start / end | 0 | 0 | 0 (unmeasured) | 24 | 0 / 1 |
| start | 0.5 | 1000 | 600 | 0 (step) | 1 |
| start | 0 | 1000 | 600 | 0 | 0 |

`scrollProgress`: (5,0,10)=0.5; (-5,0,10)=0; (15,0,10)=1; (3,10,0)=0.7; (5,5,5)=1; (4,5,5)=0.
`readScrollEvent`: vertical -> y / height; horizontal -> x / width; negative offsets pass through.

`src/lib/scroll-edges.test.ts` (the `tv()` slots stay in `scroll-fade.variants.test.ts`)
- `resolveFadeEdges`: both->{true,true}; start->{true,false}; end->{false,true}; none->{false,false}.
- `resolveFadeBand({vertical,start,size:48,inset:10})` -> `{ top: 10, height: 48 }`; `{vertical,end,size:48,inset:0}` -> `{ bottom: 0, height: 48 }`; `{horizontal,start,48,0}` -> `{ left: 0, width: 48 }`; `{horizontal,end,48,6}` -> `{ right: 6, width: 48 }`.
- `resolveFadeGradient`: vertical start -> {x0,y0}->{x0,y1}; vertical end -> y1->y0; horizontal start -> x0->x1; horizontal end -> x1->x0.

## File map

```
src/hooks/use-scroll-source.tsx            # hook, provider, types
src/lib/scroll-maths.ts
src/lib/scroll-maths.test.ts
src/lib/scroll-edges.ts                     # edge-band geometry, shared with ScrollBlur
src/lib/scroll-edges.test.ts
src/components/screen/screen-scroll-source.tsx   # internal bridge, displayName DelacourUI.Screen.ScrollSourceBridge
src/components/screen/screen-root.tsx            # edit: mount the bridge
src/components/screen/AGENTS.md                  # edit: Files row + "publishes a ScrollSource" note
src/components/scroll-fade/index.ts
src/components/scroll-fade/scroll-fade.tsx
src/components/scroll-fade/scroll-fade-edge.tsx   # one animated edge (memoised, so the wrapper never re-renders)
src/components/scroll-fade/scroll-fade.variants.ts
src/components/scroll-fade/scroll-fade.variants.test.ts
src/components/scroll-fade/AGENTS.md
package.json                                # via bun run gen-exports (hooks/use-scroll-source, lib/scroll-maths, lib/scroll-edges, ./scroll-fade)
```
Plus `AGENTS.md` (package) Components table row: `[ScrollFade](src/components/scroll-fade/AGENTS.md) | @delacour/react-native-ui/scroll-fade | A gradient at a scrollable's edges while content runs past them`, and a "scroll family" note under Directory structure listing the two new hook/lib files.

## Playground demo

`apps/playground/src/demos/scroll-fade/` (+ `index.ts` ordered barrel):
1. `vertical-list.tsx` - rows in a `Card`, `color` = card fill. **hero**, capture, flow scrolls down.
2. `horizontal-cards.tsx` - card row, both edges. capture (flow: swipe).
3. `single-edge.tsx` - `edges="end"` under a sticky button. capture.
4. `on-a-surface.tsx` - same list on `background` vs `card` vs `secondary`, showing the `color` prop matters. capture (still).
5. `inside-screen.tsx` - ambient source, no wiring, over `Screen.ScrollArea`. gallery only.
6. `fade-distance.tsx` - `fadeInDistance` 0 / 24 / 96. gallery only.

Route: `apps/playground/src/app/(components)/scroll-fade.tsx` (`DemoGallery demos={scrollFadeDemos} subtitle="Edges, axes, surfaces" title="ScrollFade"`). Row in `src/components-index.ts`: `{ slug: "scroll-fade", title: "ScrollFade", description: "Edges, axes, surfaces", group: "Layout" }`. Then `bun run gen-demos`.

## Docs page

`apps/web/content/docs/native/components/scroll-fade.mdx`: Preview (hero) -> Installation (`<ComponentInstall name="scroll-fade" />`) -> Usage (carousel, Screen) -> `useScrollSource` (when you need it) -> Props table -> ScrollFade vs Screen.ScrollShadow table -> Accessibility -> Notes (unmeasured policy). Add to `meta.json`.

Registry (`packages/cli/src/registry/config.ts`): `ITEM_META["scroll-fade"]` `{ title: "ScrollFade", description: "A gradient at a scrollable's edges while content runs past them, on any axis.", categories: ["layout"] }`; `ITEM_META["use-scroll-source"]` ("The scroll offset and sizes of a scrollable, on the UI thread, for effects that follow it") and `ITEM_META["scroll-maths"]` ("The pure maths behind the scroll-linked components"). `PACKAGE_INSTALL`: no new import (expo-linear-gradient, reanimated, worklets already classified). Verify `screen` item's closure now includes `use-scroll-source`.

## Changeset

`@delacour/react-native-ui`: **minor** - add ScrollFade, `useScrollSource` and `scroll-maths`; `Screen` now publishes a scroll source.

## Out of scope

- Refactoring `Screen.ScrollShadow` onto `scrollEdgeOpacity`.
- A scroll wrapper / child cloning, `orientation` inference from a child's `horizontal` prop.
- Blur (LAYOUT-07), RTL-specific start/end flipping (start/end follow the scroll axis in layout space; RTL horizontal lists verified manually, noted in AGENTS.md).
- Scroll indicators, pull-to-refresh.

## Acceptance checklist

- [ ] `scroll-maths.test.ts` and `scroll-fade.variants.test.ts` written first, failing, then passing (`bun test packages/react-native-ui/src/lib packages/react-native-ui/src/components/scroll-fade`)
- [ ] `bun run typecheck` and `bun run check` clean; no `any`; no comments in JSX
- [ ] `displayName` on `ScrollFade`, `ScrollFadeEdge`, `ScrollSourceProvider`, the Screen bridge (`display-name.test.ts`)
- [ ] Every worklet in `scroll-maths.ts` is self-contained; verified on simulator (no `undefined is not a function` on scroll)
- [ ] Component folder `AGENTS.md` + package Components table row (`docs.test.ts`)
- [ ] `bun run gen-exports` run; `./hooks/use-scroll-source`, `./lib/scroll-maths`, `./scroll-fade` present
- [ ] Demos added, `bun run gen-demos`, `demos.test.ts` passes (exactly one hero)
- [ ] Docs page, `meta.json`, registry ITEM_META x3, registry build passes
- [ ] Changeset added
- [ ] Simulator via agent-device (claim device with `warden claim ios --json`, pass `--udid`/`--session`): vertical list - top fade absent at rest, bottom present; scroll 40pt -> top fade present; scroll to end -> bottom fade gone; horizontal carousel same on x; short list -> no fades; `<Screen>` ambient case with no `scrollSource`; dark theme fade colour matches surface (no grey band); VoiceOver does not announce the overlays
- [ ] Screen regression: `Screen.ScrollShadow`, `fadeBorderOnScroll` and chat list unchanged in the playground `screen` gallery

## Implementation notes (2026-10-05)

- Stacked on `layout-scroll-source`; this branch carries only `components/scroll-fade/*` and its demo, docs, registry item and changeset. `scroll-fade.variants.ts` keeps the `tv()` slots and defaults; `SCROLL_FADE_EDGES` re-exports `SCROLL_EDGES`.
- **Fix to the shared hook, carried as its own first commit** ("type useScrollSource's ref…"): `AnimatedRef<Component>` did not typecheck as `Animated.ScrollView`'s ref under Reanimated 4.5, so the documented `{...scrollProps}` failed `tsc`. It belongs on `layout-scroll-source`; once it lands there this commit drops out on rebase.
- **Nested Screen caveat:** a Screen inside another reports to the outer one, so the bridge publishes the outer scroll. Demo 5 is therefore `through-a-provider` rather than `inside-screen` (the gallery itself is a Screen).
- **Previews:** captured from the dev client on 2026-10-06 — `vertical-list` (hero clip), `horizontal-cards` and `single-edge` (clips), `on-a-surface` (still). `through-a-provider` and `fade-distance` stay gallery-only.
- Simulator results are in the component `AGENTS.md`, under Verification.
