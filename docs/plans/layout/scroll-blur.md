# ScrollBlur

A progressive blur at a scrollable's start/end edges that defocuses content as it nears the boundary, so buttons, headers and search fields floating over a list stay legible over any background (photos, gradients, colour). Degrades to a plain gradient fade with no blur engine installed.

Plan ID: LAYOUT-07
Folder: `packages/react-native-ui/src/components/scroll-blur` (+ `src/expo/blur-layer.tsx`)
Import: `@delacour/react-native-ui/scroll-blur` and `@delacour/react-native-ui/expo/blur-layer`
Build order: after LAYOUT-09 (uses `useScrollSource`, `scroll-maths`, `scroll-edges`; all three ship on the shared scroll-source branch, so this branch stacks on that one, not on ScrollFade). Before LAYOUT-10 (ScrollHeader's blur bar surface reads this folder's context/types leaves).

## Purpose on mobile

A gradient fade only works over a flat colour. Over a photo, a tinted card or a gradient screen, the fade colour never matches and a grey band appears. A blur keeps shape and colour but drops the detail that would compete with an overlaid control. Use it for: a floating action row over a list, a sticky search field over media, a sheet footer button over rows.

It is **not**:
- a general-purpose blur view (backdrop for a modal) - one band at an edge, scroll-linked;
- a replacement for ScrollFade on flat backgrounds (cheaper, prefer it there; docs say so);
- a hard dependency on any blur engine.

## Dependency decision

- `expo-blur` **is** in the Expo SDK 57 bundle (`node_modules/expo/bundledNativeModules.json`: `~57.0.3`) but **not** in `apps/playground/package.json` today and not in the workspace catalog.
- Adopt it as an **optional peer** (`peerDependenciesMeta.optional`), declared like `expo-linear-gradient` (`">=15"` in the library; literal `~57.0.3` in the playground via `bunx expo install expo-blur`; not catalogued - the catalog only holds versions shared across workspaces, and expo-linear-gradient sets the precedent).
- Per **rule 4** nothing under `components/` imports `expo-blur`. The engine is injected: the component folder defines a `BlurLayer` *contract*, and `src/expo/blur-layer.tsx` (`ExpoBlurLayer`) is the only file that imports `expo-blur`. An app that never imports `./expo/blur-layer` never resolves the package.
- The app opts in once, at the root: `<ScrollBlurLayerProvider layer={ExpoBlurLayer}>`, or per call with `layer={ExpoBlurLayer}`. Editing `DelacourProvider` to take a `blurLayer` prop is a follow-up (the provider folder is shared with other categories; avoid collisions).
- Native module => playground needs a **dev client rebuild** and the EAS fingerprint changes (binary, not OTA). Flag in the PR.
- Rule 7: `expo-blur`'s `BlurView` only needs `style`/`intensity`/`tint`, so no `withUniwind` wrapper is added.
- Alternative with zero deps: gradient-only (the fallback below). Skia backdrop blur (`@shopify/react-native-skia` is catalogued) was rejected: Skia `BackdropBlur` needs the scrollable inside a Skia canvas.

## API

```ts
// scroll-blur.types.ts (leaf: imports only React + RN types)
export const BLUR_MATERIALS = ["default", "light", "dark", "chrome", "thick"] as const;
export type BlurMaterial = (typeof BLUR_MATERIALS)[number];

/** What an engine renders: one native blur view filling `style`. */
export type BlurLayerProps = {
	/** 0-100, engine-agnostic. */
	intensity: number;
	material: BlurMaterial;
	style: StyleProp<ViewStyle>;
};
export type BlurLayerComponent = ComponentType<BlurLayerProps>;

export const SCROLL_BLUR_EDGES = ["both", "start", "end", "none"] as const;
export type ScrollBlurEdges = (typeof SCROLL_BLUR_EDGES)[number];

export type ScrollBlurProps = Omit<ViewProps, "pointerEvents"> & {
	/** The scrollable the blur overlays. */
	children: ReactNode;
	/** Band depth in points. @default 80 */
	size?: number;
	/** @default "both" */
	edges?: ScrollBlurEdges;
	/** Stacked blur strips; more is smoother and costs a native view each. Clamped 1-16. @default 8 */
	layers?: number;
	/** Blur at the edge, 0-100; falls linearly to 0 across `size`. @default 56 */
	intensity?: number;
	/** @default "default" */
	material?: BlurMaterial;
	/** Wash colour hiding seams; match the surface. Defaults to the `background` token. */
	color?: string;
	/** Wash opacity at the edge, 0-1. @default 0.9 */
	tint?: number;
	/** Scroll travel from clear to full, in points. @default 24 */
	fadeInDistance?: number;
	insetStart?: number;
	insetEnd?: number;
	/** Engine for this band; overrides the provider. */
	layer?: BlurLayerComponent;
	scrollSource?: ScrollSource;
	/** @default true */
	enabled?: boolean;
	className?: string;
};
```

Context leaf `scroll-blur.context.tsx`: `ScrollBlurLayerProvider({ layer, children })`, `useBlurLayer(): BlurLayerComponent | null`. `displayName` `DelacourUI.ScrollBlur.LayerProvider`.

Hook `src/hooks/use-reduce-transparency.ts`: `useReduceTransparency(): boolean` - `AccessibilityInfo.isReduceTransparencyEnabled()` + `reduceTransparencyChanged` listener (iOS; Android resolves `false`). Plain RN, no dep. Also used by ScrollHeader's blur bar.

Engine `src/expo/blur-layer.tsx`:
```ts
export const ExpoBlurLayer: BlurLayerComponent; // displayName "DelacourUI.ExpoBlurLayer"
```
Maps `material` -> expo-blur `tint` (`default`->`default`, `light`->`light`, `dark`->`dark`, `chrome`->`systemChromeMaterial`, `thick`->`systemThickMaterial`); `intensity` straight through; renders `null` on Android in v1 (the wash alone then gives the gradient fallback; revisit once expo-blur 57's Android path is verified - open question).

```tsx
<ScrollBlurLayerProvider layer={ExpoBlurLayer}>
	<ScrollBlurDemo />
</ScrollBlurLayerProvider>

function Feed() {
	const { source, scrollProps } = useScrollSource();

	return (
		<View className="flex-1">
			<ScrollBlur className="flex-1" scrollSource={source} size={72} edges="end">
				<Animated.FlatList data={rows} renderItem={renderRow} {...scrollProps} />
			</ScrollBlur>
			<View className="absolute inset-x-0 bottom-0 p-4">
				<Button>Continue</Button>
			</View>
		</View>
	);
}
```
The floating control is a **sibling after** the ScrollBlur inside a `relative` parent, never a child: bands paint after `children`, so a child control would sit under its own blur. ScrollBlur has no overlay part.

`ScrollBlur.displayName = "DelacourUI.ScrollBlur"`. Pattern A, no compound, no `useScrollBlur`.

## Variants & sizes

`scroll-blur.variants.ts` (`tv()` from `lib/tv`): slots `root` (`relative`), `band` (`absolute overflow-hidden`), axis variant `orientation: vertical | horizontal`. No new tokens. Wash colour from `useThemeColor("background")`; alpha via new `withAlpha(color, alpha)` in `lib/color.ts` (hex + `rgb[a]()`, `undefined` for anything else, mirroring `transparentOf`; far stop still `transparentOf`).

Pure resolvers:
- `resolveBlurLayers({ size, layers, intensity }): { offset: number; height: number; intensity: number }[]` - strips ordered edge -> inward, `offset` measured from the edge, equal heights, intensity falling linearly (`intensity * (layers - k) / layers`), `layers` clamped to 1-16 and floored, `size <= 0` -> `[]`.
- `resolveBlurWash({ tint }): { edgeAlpha: number }` - clamp 0-1.
- Edge selection, band geometry and gradient axes: `resolveFadeEdges`, `resolveFadeBand`, `resolveFadeGradient` imported from `../../lib/scroll-edges` (moved out of `scroll-fade.variants.ts` with the shared scroll source, so ScrollBlur never imports ScrollFade's folder). `ScrollBlurEdges` may alias `ScrollEdges` from the same module.

## States

- **Engine present, transparency allowed:** blur strips + wash.
- **Gradient fallback** (no layer passed or in context, or `useReduceTransparency()` true): the wash alone, with its edge alpha forced to 1 so the fade still hides content fully at the edge. `enabled={false}` renders no band at all.
- Unmeasured / short content: same policy as ScrollFade via `scrollEdgeOpacity`.
- Uncontrolled; no value.

## Accessibility

Decorative: `pointerEvents="none"`, `accessible={false}`, `importantForAccessibility="no-hide-descendants"`. **Reduce Transparency** (iOS) swaps blur for the solid-ish wash - the WCAG-driven reason the fallback exists, not just a missing-dependency path. Scroll-linked opacity follows the user's gesture so it persists under Reduce Motion.

## Motion

One `Animated.View` per edge holds the whole band (strips + wash); only its `opacity` animates, from `scrollEdgeOpacity` on the UI thread. Strip count is static per render, so no re-render while scrolling. Blur intensity is *not* animated per frame (expo-blur intensity animation is expensive and unreliable on Android); the band's opacity is. No calm-motion branch.

## Reuses

`useScrollSource`/`useResolvedScrollSource`, `scrollEdgeOpacity` (LAYOUT-09); `lib/scroll-edges` geometry; `expo-linear-gradient` (wash); `useThemeColor`, `lib/color`; `tv`. The same `BlurLayerComponent` contract is what ScrollHeader.Bar `surface="blur"` renders.

## New peer deps

`expo-blur` - **optional** peer, `">=15"` (mirrors `expo-linear-gradient`), playground `~57.0.3`. `PACKAGE_INSTALL["expo-blur"] = "expo"` with the comment "Ships a native blur view, so it is version-matched and needs a rebuild." Only `expo/blur-layer.tsx` imports it.

## Cross-category dependencies

None. Media (a future image/hero component) and Overlays (Dialog/Sheet backdrops) may later reuse `BlurLayerComponent`; this plan neither imports nor waits for them. `BottomSheet.Body` is used only in the *demo* as a plain child.

## Pure logic to unit-test

`scroll-blur.variants.test.ts`
- `resolveBlurLayers({size:80, layers:4, intensity:40})` -> heights all 20, offsets `[0,20,40,60]`, intensities `[40,30,20,10]`.
- `{size:80, layers:8, intensity:56}` -> 8 strips, first 56, last 7, offsets ascend by 10.
- `layers: 0` -> 1 strip; `layers: 99` -> 16; `layers: 3.7` -> 3.
- `intensity: 150` -> first strip 100 (clamped); `-5` -> 0.
- `size: 0` or negative -> `[]`.
- `resolveBlurWash({tint:0.95})` -> 0.95; `1.4` -> 1; `-1` -> 0.

`lib/color.test.ts` (extend): `withAlpha("#ffffff", 0.5)` -> `"#ffffff80"`; `withAlpha("#fff", 0.5)` -> `"#ffffff80"`; `withAlpha("#11223344", 0.5)` -> `"#11223380"` (replaces alpha); `withAlpha("rgb(1, 2, 3)", 0.25)` -> `"rgba(1, 2, 3, 0.25)"`; `withAlpha("rgba(1,2,3,0.9)", 0.1)` -> `"rgba(1, 2, 3, 0.1)"`; `withAlpha("oklch(0.2 0 0)", 0.5)` -> `undefined`; alpha clamp 0-1.

## File map

```
src/components/scroll-blur/index.ts                 # ScrollBlur, ScrollBlurLayerProvider, useBlurLayer, types, BLUR_MATERIALS
src/components/scroll-blur/scroll-blur.tsx
src/components/scroll-blur/scroll-blur-band.tsx     # one edge: strips + wash, memoised
src/components/scroll-blur/scroll-blur.context.tsx  # leaf
src/components/scroll-blur/scroll-blur.types.ts     # leaf
src/components/scroll-blur/scroll-blur.variants.ts
src/components/scroll-blur/scroll-blur.variants.test.ts
src/components/scroll-blur/AGENTS.md
src/expo/blur-layer.tsx                             # ExpoBlurLayer - the only expo-blur import
src/hooks/use-reduce-transparency.ts
src/lib/color.ts                                    # + withAlpha
src/lib/color.test.ts                               # + cases
packages/react-native-ui/package.json               # peer + peerDependenciesMeta optional (+ gen-exports)
apps/playground/package.json                        # expo-blur ~57.0.3 (bunx expo install expo-blur)
```
Package `AGENTS.md`: Components row `[ScrollBlur](src/components/scroll-blur/AGENTS.md) | @delacour/react-native-ui/scroll-blur | A progressive blur at a scrollable's edges, with a gradient fallback`; mention `expo/blur-layer` beside `expo/navigation-theme` in the Directory structure and `hooks/` listing.

## Playground demo

`apps/playground/src/demos/scroll-blur/`:
1. `list-under-button.tsx` - photo-row list, `edges="end"`, floating `Button`. **hero**, capture (flow: scroll).
2. `search-over-media.tsx` - `edges="start"` under a sticky `Input`. capture.
3. `horizontal.tsx` - card row, both edges. capture.
4. `blur-vs-fade.tsx` - same coloured-tile list under ScrollFade (grey band) vs ScrollBlur. capture (still).
5. `layers-and-intensity.tsx` - `layers` 2/8/16, `intensity` 24/56/90. gallery only.
6. `fallback.tsx` - `layer={undefined}` forcing the gradient path. gallery only.

The playground root mounts `ScrollBlurLayerProvider layer={ExpoBlurLayer}`. Route `src/app/(components)/scroll-blur.tsx`; `components-index.ts` row (`group: "Layout"`, description "Edges, layers, fallback"); `bun run gen-demos`.

## Docs page

`apps/web/content/docs/native/components/scroll-blur.mdx`: Preview -> Installation (`<ComponentInstall name="scroll-blur" />` + note on `expo-blur`, rebuild, `ExpoBlurLayer` + provider) -> Usage -> Choosing blur vs fade -> Props -> Fallbacks (no engine, Reduce Transparency, Android) -> Accessibility. Registry: `ITEM_META["scroll-blur"]` (categories `["layout"]`, description "A progressive blur at a scrollable's edges that falls back to a gradient fade."), `ITEM_META["use-reduce-transparency"]`, the `expo/blur-layer` source classified like `expo/navigation-theme` (see `classify.test.ts`) with `expo-blur` as its package, `PACKAGE_INSTALL["expo-blur"] = "expo"`. Check the CLI does not add `expo-blur` for apps that install `scroll-blur` without the engine (it is optional; `add scroll-blur --with-blur` or documented step).

## Changeset

`@delacour/react-native-ui`: **minor** - add ScrollBlur, `expo/blur-layer` (optional peer `expo-blur`), `useReduceTransparency`, `withAlpha`.

## Out of scope

- A `blurLayer` prop on `DelacourProvider`.
- Android real blur (v1 = gradient wash) and web.
- Animating blur intensity per frame; vibrancy; Skia backdrop blur.
- A general `BlurView` component.

## Acceptance checklist

- [ ] `scroll-blur.variants.test.ts` and extended `color.test.ts` written first, then green (`bun test packages/react-native-ui/src/components/scroll-blur packages/react-native-ui/src/lib/color.test.ts`)
- [ ] `bun run typecheck`, `bun run check` clean; no `any`; no JSX comments
- [ ] `grep -r "expo-blur" packages/react-native-ui/src` hits **only** `src/expo/blur-layer.tsx`
- [ ] `displayName`s: `ScrollBlur`, `ScrollBlurBand`, `ScrollBlur.LayerProvider`, `ExpoBlurLayer`
- [ ] Folder `AGENTS.md` + Components row (`docs.test.ts`); `gen-exports` run (`./scroll-blur`, `./expo/blur-layer`, `./hooks/use-reduce-transparency`)
- [ ] `expo-blur` optional peer in `package.json`; `PACKAGE_INSTALL` updated; registry build passes
- [ ] Demos + `gen-demos` + `demos.test.ts` (one hero); docs page; changeset
- [ ] Dev client rebuilt with `expo-blur`; simulator via agent-device (`warden claim ios --json`, explicit `--udid`/`--session`): blur visibly defocuses rows at the edge and is absent at rest at the start edge; scroll to end removes end band; no seam lines between strips in light and dark; floating button remains tappable; enabling Settings > Accessibility > Display > Reduce Transparency turns blur into wash live; app without the provider shows the gradient fallback and logs no warning
- [ ] Android emulator: no crash, wash fallback shown
- [ ] No React re-renders while scrolling (React DevTools profiler), frame time steady on a 100-row list
