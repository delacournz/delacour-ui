# ScrollHeader

A collapsing header: a large title block (optionally over a stretching cover) that scrolls away while a compact bar stays pinned and takes over in one crossfade, with optional snap-settling and a progress value other elements can follow.

Plan ID: LAYOUT-10
Folder: `packages/react-native-ui/src/components/scroll-header`
Import: `@delacour/react-native-ui/scroll-header`
Build order: last of the four - after LAYOUT-09 (scroll source, maths) and LAYOUT-07 (its blur bar surface reads `scroll-blur.context` / `scroll-blur.types`). If LAYOUT-07 slips, ship with `surface="blur"` omitted from the union and add it in a follow-up; nothing else here depends on it.

## Purpose on mobile

Large-title screens (Library, Settings, a profile with a cover): the title is prominent at rest and a compact bar keeps the title and actions reachable while reading. Roughly iOS large-title behaviour, but navigator-agnostic and with a cover/stretch option.

It is **not**: a navigator header (it does not touch routing or `expo-router`), a replacement for `Screen.Navbar` when a screen has a plain pinned bar (that stays the simple answer), or a sticky *section* header.

## Family decision and relation to Screen

Standalone folder; **not** a `Screen` part, and it does not publish into `Screen`'s context.

- `Screen.Navbar` is *measured chrome*: its height feeds every Screen scrollable's top inset. A collapsing header changes size every frame and owns its scroller's inset, so folding it into the navbar would make a static concept animate.
- Use `ScrollHeader` as the **screen's top-level frame instead of `Screen.Navbar`**: `<Screen>` is optional around it. Inside a `<Screen>`, mount **no** `Screen.Navbar` and use `ScrollHeader.ScrollView/FlatList` (not `Screen.ScrollArea`), otherwise `Screen`'s top-inset spacer (`resolveScrollTopInset` falls back to the status-bar inset) would stack on `ScrollHeader.Inset`. Documented as the first rule in AGENTS.md. `Screen.Footer` and `Screen.Content` compose fine.
- The root mounts a `ScrollSourceProvider` around its subtree, so `ScrollFade`/`ScrollBlur`/`ScrollCanvas` inside it need no `scrollSource` prop.
- It reads the shared source and maths from LAYOUT-09 (`useScrollSource`, `scrollProgress`, `scrollEdgeOpacity` for the no-Large case).

## API

```ts
export const SCROLL_HEADER_BAR_SURFACES = ["plain", "muted", "none", "blur"] as const;
export type ScrollHeaderBarSurface = (typeof SCROLL_HEADER_BAR_SURFACES)[number];

export type ScrollHeaderProps = ViewProps & {
	/** Fraction of the Large block's height at which the bar has fully taken over. @default 1 */
	threshold?: number;
	/** Settle a half-scrolled header open or closed when the finger lifts. @default true */
	snap?: boolean;
	/** Let the cover grow when pulled down past the top. Off under Reduce Motion. @default true */
	stretch?: boolean;
	/** Fires once per crossing of fully collapsed, not per frame. Runs on the JS thread. */
	onCollapsedChange?: (isCollapsed: boolean) => void;
	/** Written every frame, 0 (open) to 1 (collapsed), for effects outside the header. */
	progress?: SharedValue<number>;
	children: ReactNode;
	className?: string;
};

export type ScrollHeaderBarProps = ViewProps & {
	/**
	 * `plain` background, `muted` fill, `none` transparent (over a cover), `blur` frosted.
	 * The surface fades in with collapse progress; `blur` falls back to `plain` with no engine
	 * or under Reduce Transparency. @default "plain"
	 */
	surface?: ScrollHeaderBarSurface;
	/** Hairline under the bar, fading in with the surface. @default true */
	divider?: boolean;
	/** Blur strength, 0-100, `surface="blur"` only. @default 40 */
	intensity?: number;
	/** Explicit bar content height in points before the safe-area band; measured when omitted. */
	barHeight?: number;
	/** Engine override; otherwise `ScrollBlurLayerProvider`. */
	layer?: BlurLayerComponent;
	children?: ReactNode;
	className?: string;
};

export type ScrollHeaderBarTitleProps = Omit<TextProps, "children"> & { children: string; className?: string };
export type ScrollHeaderLargeProps = ViewProps & { children?: ReactNode; className?: string };

export type ScrollHeaderCoverProps = ViewProps &
	(
		| { source: ImageSourcePropType; colors?: never }
		| { colors: readonly [string, string, ...string[]]; source?: never }
	) & {
		/** Darkening wash for text legibility. @default true */
		scrim?: boolean;
		className?: string;
	};

export type ScrollHeaderScrollViewProps = Omit<ScrollViewProps, "onScroll"> & {
	/** Plain functions get the raw event; animated handlers stay on the UI thread. */
	onScroll?: ScrollViewProps["onScroll"];
	contentContainerClassName?: string;
	className?: string;
};
export type ScrollHeaderFlatListProps<ItemT> = Omit<FlatListProps<ItemT>, "onScroll"> & { /* as above */ };

/** For SectionList, LegendList, or any custom scroller. */
export type ScrollHeaderContextValue = {
	source: ScrollSource;
	scrollProps: ScrollSourceProps;   // includes the snap handlers
	progress: SharedValue<number>;
	collapseDistance: SharedValue<number>;
	topInset: SharedValue<number>;     // safe-area + bar + large, what the scroller must clear
};
export function useScrollHeader(): ScrollHeaderContextValue;
```

Compound surface (`Object.assign`, one file per part): `ScrollHeader.Bar`, `.BarTitle` (fades in with progress, `accessibilityRole="header"`), `.Large`, `.Cover`, `.Inset` (the spacer view), `.ScrollView`, `.FlatList`. `useScrollHeader()` throws outside the root. Display names `DelacourUI.ScrollHeader[.Part]`. `ScrollHeader.FlatList` is a cast generic component like `Screen.FlatList` (`forwardRef` erases type parameters).

```tsx
<ScrollHeader onCollapsedChange={setCollapsed}>
	<ScrollHeader.Bar surface="blur">
		<ScrollHeader.BarTitle>Library</ScrollHeader.BarTitle>
		<View className="ml-auto">
			<Button accessibilityLabel="Search" size="icon-sm" variant="secondary">
				<Icon icon={IconSearch} />
			</Button>
		</View>
	</ScrollHeader.Bar>
	<ScrollHeader.Large>
		<Text.Title>Library</Text.Title>
		<Text.Muted>128 albums</Text.Muted>
	</ScrollHeader.Large>
	<ScrollHeader.ScrollView contentContainerClassName="gap-3 px-screen-gutter">{rows}</ScrollHeader.ScrollView>
</ScrollHeader>
```
The root must be given a height (`flex-1` / fixed); it collapses to nothing otherwise (documented, and a dev warning when its measured height is 0). Order of children is irrelevant; exactly one scroller (`ScrollView`/`FlatList` part, or a custom one using `useScrollHeader`) - a dev warning if two mount.

**Why no child cloning:** the scroller gets its inset and scroll handlers from `ScrollHeader.ScrollView`/`FlatList` (or `scrollProps` + `<ScrollHeader.Inset />` for others). Cloning would fight the caller's own `onScroll` and Reanimated handler composition.

## Variants & sizes

`scroll-header.variants.ts` - one slotted `tv()`:
- slots: `root` (`relative flex-1`), `bar` (`absolute inset-x-0 top-0 z-20`), `barRow` (`h-navbar-row flex-row items-center gap-2 px-screen-gutter`), `barSurface` (`absolute inset-0`), `divider` (`absolute inset-x-0 bottom-0 h-px bg-border`), `barTitle` (text preset via Text styles), `large` (`absolute inset-x-0 z-10 px-screen-gutter pb-3 gap-1`), `cover` (`absolute inset-x-0 top-0 overflow-hidden`), `scrim` (`absolute inset-0 bg-overlay`).
- axis `surface` on `barSurface`: `plain` -> `bg-background`, `muted` -> `bg-muted`, `none` -> `bg-transparent`, `blur` -> `bg-transparent` (blur layer + wash drawn inside). Default `plain`. No `size` axis; heights are numbers/tokens (`h-navbar-row` = `--spacing-navbar-row`, the same row height `Screen.Navbar` uses, so a swap does not shift the row).
- No new tokens (`background`, `muted`, `border`, `overlay`, `screen-gutter`, `navbar-row` all exist). Safe-area band from `useSafeAreaInsets()`, never `*-safe` classes (Screen rule).

Constants (variants file): `SCROLL_HEADER_NO_LARGE_FADE_DISTANCE = 24`, `SCROLL_HEADER_SNAP_VELOCITY = 0.15`, `SCROLL_HEADER_DEFAULT_BLUR_INTENSITY = 40`.

Pure resolvers (worklet-safe, self-contained):
- `resolveCollapseDistance({ largeHeight, threshold }): number` - `max(0, largeHeight * clamp(threshold, 0.1, 1))`
- `resolveCollapseProgress(offset, distance): number` - clamp 0-1; `distance <= 0` -> `offset > 0 ? 1 : 0`
- `resolveHeaderInset({ safeAreaTop, barHeight, largeHeight }): number`
- `resolveCoverStretch({ offset, baseHeight, stretch }): { height: number; translateY: number }`
- `resolveSnapTarget({ offset, distance }): number | null`
- `isCollapsed(progress): boolean` - `progress >= 1`
- `resolveBarSurfaceOpacity({ hasLarge, progress, offset }): number` - scroll-linked either way (uses `scrollEdgeOpacity` over 24pt when there is no Large)
- `resolveLargeOpacity(progress)`, `resolveBarTitleOpacity(progress)` - the crossfade pair (`1 - p`, `p`)

## States

- Uncontrolled (the header derives everything from scroll); `progress` is an *output*, not a controlled value. `onCollapsedChange` fires once per crossing; also on mount only if the initial offset (e.g. restored scroll) is collapsed.
- No `Large`: collapse distance 0; bar surface fades in over `SCROLL_HEADER_NO_LARGE_FADE_DISTANCE` of scroll; `BarTitle` is always visible (nothing to crossfade with); no snap.
- Short content: nothing scrolls, header stays open; the scroller's min height is the caller's concern (docs note: `contentContainerStyle={{ flexGrow: 1 }}`).
- No `Cover`: stretch is a no-op. `Large` height changing (dynamic type) re-derives the distance via `onLayout`.

## Accessibility

- `BarTitle` is `accessibilityRole="header"`; while the header is open, the bar title duplicates the large title, so it is `importantForAccessibility="no-hide-descendants"` + `accessibilityElementsHidden` until collapsed, and the Large block is hidden once collapsed. Driven by a JS `isCollapsed` state mirrored through `scheduleOnRN` from an `useAnimatedReaction` (rare, once per crossing; never reads `.value` in render - React Compiler is on in the playground).
- Bar actions stay focusable throughout (they are always mounted and always opaque even on `surface="none"`).
- **Reduce Motion** (`useCalmMotion`): stretch is disabled and snap becomes an instant `scrollTo` (`animated: false`); the scroll-linked crossfade stays, as it follows the finger. **Reduce Transparency**: `surface="blur"` renders as `plain` (`useReduceTransparency`, LAYOUT-07).
- Dynamic type: `Large` is measured, so larger text just lengthens the collapse distance.

## Motion

Reanimated 4 worklets: the scroll source (`useScrollSource`) writes `offset` on the UI thread; `useDerivedValue` produces `progress`; `useAnimatedStyle` drives bar surface opacity, `Large` `translateY: -offset` + opacity, `BarTitle` opacity, and `Cover` height/translate. `Inset` is an `Animated.View` whose height is an animated style (same pattern as Screen's reserve; padding cannot animate on the UI thread). Snap: composed `onEndDrag` (when `|velocity| < SNAP_VELOCITY`, i.e. no momentum follows) and `onMomentumEnd` call `scrollTo(ref, 0, target, !calm)` from `resolveSnapTarget`; never fights a user gesture because it only runs after the scroller has settled. `progress` prop mirrored in the derived value's reaction. Haptics: none (a snap is not a discrete selection).

## Reuses

`useScrollSource`, `ScrollSourceProvider`, `scrollProgress`, `scrollEdgeOpacity` (LAYOUT-09); `BlurLayerComponent`, `useBlurLayer`, `useReduceTransparency`, `withAlpha` (LAYOUT-07, leaf imports only: `../scroll-blur/scroll-blur.context`, `../scroll-blur/scroll-blur.types`); `Text` presets for `BarTitle`; `useCalmMotion`; `useThemeColor`; `useSafeAreaInsets`; `expo-linear-gradient` (Cover `colors`, already a peer); RN `Image` for Cover `source`; `tv`, `cn`. Mirrors `Screen`'s measured-spacer pattern but not its context.

## New peer deps

None. `expo-blur` is reached only through LAYOUT-07's injectable `BlurLayerComponent` (optional, `src/expo/blur-layer.tsx`); this folder imports no Expo package other than the existing `expo-linear-gradient` peer. Alternative to Reanimated-driven bar: none - UI-thread scroll linkage is the point.

## Cross-category dependencies

- **Navigation**: none imported. No back-button part: `Screen.Navbar.BackButton` does not read Screen context, but it is reachable only through the `Screen` compound, and importing `../screen` would pull Screen (and its peers) into this component's registry closure. Docs show a `Button size="icon-sm"` with a chevron instead; a shared back control is a Navigation-category decision.
- Overlays/Forms/Media: none. A Media image component, if one lands, can be passed through Cover later; v1 uses RN `Image`.

## Pure logic to unit-test

`scroll-header.variants.test.ts` (first):

`resolveCollapseDistance`: (120, 1) -> 120; (120, 0.6) -> 72; (120, 5) -> 120; (120, 0) -> 12 (floor 0.1); (0, 1) -> 0; (-10, 1) -> 0.
`resolveCollapseProgress`: (0, 100) -> 0; (50, 100) -> 0.5; (100, 100) -> 1; (250, 100) -> 1; (-40, 100) -> 0; (10, 0) -> 1; (0, 0) -> 0.
`resolveHeaderInset`: `{ 59, 48, 120 }` -> 227; `{ 0, 48, 0 }` -> 48.
`resolveCoverStretch` (baseHeight 227): `{ offset: 0, stretch: true }` -> `{ height: 227, translateY: 0 }`; offset 100 -> `{ 227, -100 }`; offset 500 -> `{ 227, -500 }`; offset -60 with stretch on -> `{ 287, 0 }`; offset -60 with stretch off -> `{ 227, 60 }` (the cover rides the pull instead of growing).
`resolveSnapTarget` (distance 100): 0 -> null; 30 -> 0; 49.9 -> 0; 50 -> 100; 80 -> 100; 100 -> null; 150 -> null; -20 -> null; distance 0 -> null.
`isCollapsed`: 0.99 -> false; 1 -> true.
`resolveBarSurfaceOpacity`: hasLarge, progress 0.4 -> 0.4; no Large, offset 12 -> 0.5; no Large, offset 0 -> 0; no Large, offset 60 -> 1.
`resolveLargeOpacity(0.25)` -> 0.75; `resolveBarTitleOpacity(0.25)` -> 0.25; both clamp outside 0-1; sum to 1 across the range.

## File map

```
src/components/scroll-header/index.ts
src/components/scroll-header/scroll-header.tsx             # Object.assign surface
src/components/scroll-header/scroll-header-root.tsx        # root, provider, source, progress, collapsed reaction
src/components/scroll-header/scroll-header.context.tsx     # leaf: context, useScrollHeader()
src/components/scroll-header/scroll-header.types.ts        # shared prop types
src/components/scroll-header/scroll-header.variants.ts
src/components/scroll-header/scroll-header.variants.test.ts
src/components/scroll-header/scroll-header-bar.tsx
src/components/scroll-header/scroll-header-bar-surface.tsx # surface + blur + divider, memoised (internal)
src/components/scroll-header/scroll-header-bar-title.tsx
src/components/scroll-header/scroll-header-large.tsx
src/components/scroll-header/scroll-header-cover.tsx
src/components/scroll-header/scroll-header-inset.tsx
src/components/scroll-header/scroll-header-scroll-view.tsx
src/components/scroll-header/scroll-header-flat-list.tsx
src/components/scroll-header/AGENTS.md
```
Package `AGENTS.md` Components row `[ScrollHeader](src/components/scroll-header/AGENTS.md) | @delacour/react-native-ui/scroll-header | A large title that collapses into a pinned bar as the page scrolls`; `gen-exports`.

## Playground demo

`apps/playground/src/demos/scroll-header/` (device frame - these are whole screens; `capture: { frame: "device" }`):
1. `large-title-list.tsx` - basic title + list, bar actions. **hero**, capture (flow: scroll, settle, snap).
2. `cover.tsx` - image cover, `surface="none"` then `plain`, stretch on pull. capture (flow: pull then scroll).
3. `blur-bar.tsx` - `surface="blur"` over media rows. capture.
4. `early-handover.tsx` - `threshold={0.6}` with a tall Large block. gallery only.
5. `react-to-collapse.tsx` - `onCollapsedChange` swapping a bar control and a `progress`-driven avatar. capture (flow: scroll).
6. `no-large.tsx` - bar-only, surface fades in. gallery only.

Route `src/app/(components)/scroll-header.tsx`; `components-index.ts` row (`group: "Layout"`, "Large title, cover, blur bar"); `bun run gen-demos`. The blur demo needs LAYOUT-07's provider mounted at the playground root (already part of that plan).

## Docs page

`apps/web/content/docs/native/components/scroll-header.mdx`: Preview -> Installation -> Usage -> Anatomy (Bar / Large / Cover / scroller) -> Cover and stretch -> Early handover (`threshold`) -> Reacting to collapse (`onCollapsedChange`, `progress`, `useScrollHeader`) -> Using another scroller (SectionList, LegendList) -> Inside a Screen (no `Screen.Navbar`, no `Screen.ScrollArea`) -> Accessibility -> API tables per part. `ITEM_META["scroll-header"]` `{ title: "ScrollHeader", description: "A large title that collapses into a pinned bar as the page scrolls, with a cover, a blur bar and snap.", categories: ["layout"] }`. `PACKAGE_INSTALL`: no change.

## Changeset

`@delacour/react-native-ui`: **minor** - add ScrollHeader, a collapsing large title with a pinned bar, cover and snap.

## Out of scope

- Router integration, native large titles, back-swipe coupling.
- Sticky section headers; horizontal collapse; multiple simultaneous scrollers.
- Pull-to-refresh coordination (documented: `RefreshControl` works unchanged on the scroller; its offset is not wired into `progress`).
- Changing `Screen.Navbar` or `Screen`'s context.
- Auto-hide-on-scroll-down (a different pattern).

## Acceptance checklist

- [ ] `scroll-header.variants.test.ts` written first, failing, then green (`bun test packages/react-native-ui/src/components/scroll-header`)
- [ ] `bun run typecheck`, `bun run check` clean; no `any`; no JSX comments; `ScrollHeaderCoverProps` union rejects both/neither of `source`/`colors`
- [ ] Every part has a `DelacourUI.ScrollHeader.*` displayName (`display-name.test.ts`)
- [ ] Folder `AGENTS.md` (lists the Screen rule first) + Components row (`docs.test.ts`); `gen-exports`; demos + `gen-demos` + `demos.test.ts` (one hero); docs page; registry + registry build; changeset
- [ ] `grep -rn "expo-blur" src/components/scroll-header` is empty
- [ ] No `.value` read during render anywhere (React Compiler on)
- [ ] agent-device on iOS (`warden claim ios --json`, explicit `--udid`/`--session`): first row sits exactly below the large block at rest (no gap, no overlap); scrolling crossfades large title to bar title; `surface` fades in; releasing at 30% snaps open, at 70% snaps closed; fast fling does not snap-fight; pull-down stretches the cover and releases cleanly; `onCollapsedChange` fires once per crossing (log counter)
- [ ] Rotate device / larger Dynamic Type: collapse distance re-derives, no jump
- [ ] VoiceOver: one title announced at rest, one when collapsed; bar actions reachable in both states
- [ ] Reduce Motion: no stretch, instant snap, crossfade still follows the finger; Reduce Transparency: blur bar renders plain
- [ ] FlatList variant with 500 rows scrolls at steady frame time; SectionList via `useScrollHeader` + `Inset` lines up
- [ ] Inside `<Screen>` without `Screen.Navbar`: no double top inset; with `Screen.Footer`: bottom inset still correct

## Implementation notes (as built)

- **`ScrollHeader.Large` is `pointerEvents="none"`.** It floats over the scroller, and on iOS a drag starting on a view outside a scroll view never reaches its pan, so the block is display-only; controls go in the bar or the content.
- **A plain-function `onScroll` receives a `NativeScrollEvent`**, not a `NativeSyntheticEvent`: an animated `onScroll` replaces a JS one, so it is forwarded with `scheduleOnRN` carrying the payload. The prop type is `ScrollHeaderOnScroll`, the union of that and a Reanimated handler (composed on the UI thread).
- **Snap goes through a `snapTarget` shared value.** The end-of-drag worklets are created before `useScrollSource` returns the animated ref, so a reaction declared after it performs the `scrollTo`.
- **An extra internal file, `use-scroll-header-scroll-props.ts`,** holds the scroller parts' shared wiring (handler composition, scroller registration).
- **Registry title is "Scroll Header"**, spaced like every other item, because the skills list test pins the registry's titles.
- **No back-button part and no Navigation import**; demos use a plain `Button` with a chevron.
- **No preview media yet.** The `argent` CLI was not installed, so no demo is marked `capture`, the docs page opens at Installation, and the publishing plan is in the component's AGENTS.md. Demos carry `align: "stretch"` so the preview route lays them out full width.
- **Simulator:** verified on iOS — layout at rest, crossfade, snap both ways, cover stretch, blur bar, `onCollapsedChange` + `progress`, no-Large fade (details in the component's AGENTS.md). Found and fixed a worklet capturing `scrollProps` (with its handler) on the first run. Not checked: VoiceOver, Reduce Motion / Transparency live, rotation and Dynamic Type, fling, FlatList at 500 rows, SectionList via `useScrollHeader`, inside `<Screen>`, Android.
