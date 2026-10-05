# ScrollCanvas

An image in a frame that stays put while the picture moves inside it as the page scrolls: parallax, zoom, a wipe reveal, or a frame sequence scrubbed by the thumb. The frame is the layout; only what is inside it moves.

Plan ID: LAYOUT-08
Folder: `packages/react-native-ui/src/components/scroll-canvas`
Import: `@delacour/react-native-ui/scroll-canvas`
Build order: after LAYOUT-09 (needs `useScrollSource`, `scroll-maths`). Independent of LAYOUT-07 and LAYOUT-10.

## Purpose on mobile

Editorial and product screens - an article hero, a feature tour, a "360" product spin, a story that builds as you scroll - want imagery that responds to the scroll without the layout moving. Four effects, one frame:

| Effect | What moves |
| --- | --- |
| `parallax` | the image drifts against the scroll inside the still frame |
| `zoom` | image settles from oversized to natural as the frame enters |
| `reveal` | a cover retreats upward, uncovering the image from the bottom edge |
| `sequence` | scroll position picks which of N frames is showing |

It is **not**: a general `Image` (use `expo-image`/`Image` directly), a carousel/pager (no gestures of its own), a video or Lottie player, or a sticky/pinned scroll-story container.

## Family relationship

Standalone folder reading the scroll family's `ScrollSource` (`src/hooks/use-scroll-source.tsx`, owned by LAYOUT-09 - see `scroll-fade.md`). Works inside a `<Screen>` with no wiring (Screen mounts a source), or anywhere via `useScrollSource()` / a `scrollSource` prop. It reuses `scrollProgress` from `lib/scroll-maths` and adds its own effect maths in `scroll-canvas.variants.ts`. It does **not** touch `Screen`.

## API

```ts
export const SCROLL_CANVAS_EFFECTS = ["parallax", "zoom", "reveal", "sequence"] as const;
export type ScrollCanvasEffect = (typeof SCROLL_CANVAS_EFFECTS)[number];

type ScrollCanvasBaseProps = Omit<ViewProps, "children"> & {
	/** Frame width / height. @default 16 / 10 */
	aspectRatio?: number;
	/**
	 * How far the effect goes, as a share of the frame: parallax travel (of frame height, each way),
	 * or zoom overscale. Clamped 0-1. @default 0.2
	 */
	distance?: number;
	/**
	 * Where the frame's TOP sits in the viewport (0 = top edge, 1 = bottom edge) when the effect
	 * starts. @default 1 (as the frame enters at the bottom)
	 */
	start?: number;
	/**
	 * Where it sits when the effect is complete. Negative values mean past the top edge.
	 * @default parallax: just as the frame leaves (-frameHeight / viewport); others: 0.3
	 */
	end?: number;
	/** Drive the effect directly, 0-1, instead of from the scroll position. Skips frame measurement. */
	progress?: SharedValue<number>;
	/** Scroll source; otherwise the nearest provider / the enclosing Screen. */
	scrollSource?: ScrollSource;
	/** Render the resting state with no motion. @default true */
	enabled?: boolean;
	/** Describes the picture. Omitted -> treated as decorative and hidden from assistive tech. */
	accessibilityLabel?: string;
	/** `cover` | `contain` | `stretch` | `center`. @default "cover" */
	resizeMode?: ImageResizeMode;
	className?: string;
	imageClassName?: string;
};

export type ScrollCanvasProps = ScrollCanvasBaseProps &
	(
		| {
				effect?: "parallax" | "zoom" | "reveal";
				source: ImageSourcePropType;
				sources?: never;
				/** `reveal` only: classes for the retreating cover. @default "bg-background" */
				coverClassName?: string;
		  }
		| {
				effect: "sequence";
				sources: readonly ImageSourcePropType[];
				source?: never;
				coverClassName?: never;
		  }
	);
```
Default `effect` is `"parallax"`. `ScrollCanvas.displayName = "DelacourUI.ScrollCanvas"`. Single component (Pattern A + `tv()`); no compound parts, no `useScrollCanvas`.

```tsx
function Article() {
	const { source, scrollProps } = useScrollSource();

	return (
		<Animated.ScrollView contentContainerClassName="gap-6 pb-10" {...scrollProps}>
			<ScrollCanvas
				accessibilityLabel="Fog over a mountain ridge"
				effect="parallax"
				scrollSource={source}
				source={{ uri: ridge }}
			/>
			<Text.Paragraph className="px-screen-gutter">{body}</Text.Paragraph>
			<ScrollCanvas effect="sequence" scrollSource={source} sources={spinFrames} />
		</Animated.ScrollView>
	);
}
```

**Position contract.** The effect needs the frame's top in scroll-content space. Order of preference: (1) `progress` given -> nothing measured; (2) `scrollSource.ref` present -> `measureLayout(frameRef, scrollSource.ref)` on layout and whenever `contentSize` changes (images above loading shifts the frame); (3) ref null (Screen-provided source) -> `onLayout.y`, correct only when the frame is a **direct child of the scroll content container** (documented; otherwise pass a `useScrollSource` source or `progress`).

## Variants & sizes

`scroll-canvas.variants.ts`: `tv()` slots `frame` (`relative w-full overflow-hidden rounded-lg bg-muted`), `image` (`absolute inset-x-0`), `cover` (`absolute inset-0 bg-background`). Corner is `rounded-lg` (the `--radius` card step). `aspectRatio` is a style (numeric). No size axis. No new tokens; `bg-muted` is the pre-load placeholder.

Constants: `SCROLL_CANVAS_DEFAULT_DISTANCE = 0.2`, `SCROLL_CANVAS_DEFAULT_ASPECT = 16 / 10`, `SCROLL_CANVAS_SEQUENCE_WARN_FRAMES = 30` (dev warning above it).

Pure resolvers (worklet-safe, self-contained, no cross-calls - see `scroll-fade.md` worklet rule):

- `resolveEffectWindow({ effect, frameHeight, viewport, start?, end? }): { start: number; end: number }`
- `resolveEffectProgress({ offset, frameTop, viewport, window }): number` - `f = (frameTop - offset) / viewport`; `clamp((start - f) / (start - end), 0, 1)`; `start === end` is a step at `end`.
- `resolveParallax({ progress, frameHeight, distance }): { imageHeight; imageTop; translateY }`
- `resolveZoom({ progress, distance }): { scale }`
- `resolveReveal({ progress, frameHeight }): { coverTranslateY }`
- `resolveSequenceIndex(progress, count): number`
- `resolveStaticProgress(effect): number` - the resting state used when motion is off.

## States

- No value; progress is derived. `enabled={false}` or calm motion -> static resting state (`parallax` 0.5, `zoom` 1, `reveal` 1, `sequence` 0 via `resolveStaticProgress`), still rendering the image.
- Loading: `bg-muted` frame until the image paints. Failed image: the frame stays `bg-muted` (no error UI; a caller wanting one wraps it).
- `sequence` with 0 sources renders an empty frame; one source renders it statically; more than 30 warns in dev (memory: every frame is mounted).
- Unmeasured viewport (`layoutSize === 0`): progress 0.

## Accessibility

- With `accessibilityLabel`: the frame is `accessible`, `accessibilityRole="image"`; for `sequence` the label sits on the frame once, frames themselves are hidden. Without it: `accessible={false}`, `importantForAccessibility="no-hide-descendants"` (decorative).
- **Reduce Motion** (`useCalmMotion`, which also honours the E2E `isMotionCalm`): scroll-linked parallax/zoom/wipe/scrub are vestibular triggers, so they stop - the resting state is drawn. This is the one family member where scroll-linked motion is gated, because the image moves independently of the finger.
- `sequence` conveys no information that is not in a single frame (guidance in docs: pick frame 0 as the poster).

## Motion

All on the UI thread. One `useAnimatedReaction`-free path: `useDerivedValue` computes `progress` from `source.offset`, the measured `frameTop` shared value and `layoutSize`; `useAnimatedStyle` maps it per effect. `transform`/`opacity` only (no height animation, so no relayout - `reveal` is a retreating cover, not a shrinking frame). `sequence` mounts all frames with `opacity` 0/1 toggled from the derived index, `fadeDuration={0}` on Android, no cross-fade (scrubbing should snap). No springs; position follows the finger directly.

## Reuses

`useScrollSource`/`useResolvedScrollSource`, `scrollProgress` (LAYOUT-09), `useCalmMotion`, RN `Image` (rule: zero deps - `expo-image` would force rule 4 placement), `cn`, `tv`, `useAnimatedRef` + `measureLayout` from Reanimated.

## New peer deps

None. Alternative considered: `expo-image` (bundled in SDK 57) for caching/blurhash - rejected for v1 because it moves the component under `src/expo/` and adds a peer; an `ImageComponent` injection prop can follow if asked.

## Cross-category dependencies

**Media**: any image/gallery component is not imported. If a Media `Image` lands, `ScrollCanvas` can accept it through a future `renderImage` prop; scoped out now (RN `Image` is used directly). Overlays/Navigation/Forms: none.

## Pure logic to unit-test

`scroll-canvas.variants.test.ts` (first):

`resolveEffectWindow`
- parallax, frameHeight 200, viewport 800, no overrides -> `{ start: 1, end: -0.25 }`
- zoom, any -> `{ start: 1, end: 0.3 }`
- parallax with `end: 0` override -> `{ start: 1, end: 0 }`
- viewport 0 -> parallax end falls back to `-1` (no divide by zero)

`resolveEffectProgress` (zoom window `{1, 0.3}`, viewport 800)
- frameTop 800, offset 0 -> 0 (just entering)
- frameTop 800, offset 280 -> 0.5 (`f = 0.65`)
- frameTop 800, offset 560 -> 1 (`f = 0.3`)
- offset 900 -> 1; offset -50 (overscroll) -> 0
- window `{0.5, 0.5}`: `f 0.6` -> 0, `f 0.4` -> 1

`resolveParallax` (frameHeight 200, distance 0.2 -> travel 40)
- progress 0 -> `{ imageHeight: 280, imageTop: -40, translateY: -40 }`
- progress 0.5 -> translateY 0; progress 1 -> translateY 40
- distance 0 -> imageHeight 200, translateY 0; distance 3 -> clamped to 1 (travel 200)

`resolveZoom`: (progress 0, distance 0.2) -> scale 1.2; (1, 0.2) -> 1; (0.5, 0.2) -> 1.1; distance -1 -> 1.
`resolveReveal`: (0, 200) -> 0; (0.5, 200) -> -100; (1, 200) -> -200.
`resolveSequenceIndex`: (0, 4) -> 0; (0.24, 4) -> 0; (0.25, 4) -> 1; (0.49, 4) -> 1; (0.99, 4) -> 3; (1, 4) -> 3; (0.7, 1) -> 0; (0.5, 0) -> 0; progress -1 -> 0.
`resolveStaticProgress`: parallax 0.5, zoom 1, reveal 1, sequence 0.

Plus `scroll-maths.test.ts` cases already owned by LAYOUT-09.

## File map

```
src/components/scroll-canvas/index.ts
src/components/scroll-canvas/scroll-canvas.tsx          # root + effect dispatch
src/components/scroll-canvas/scroll-canvas-image.tsx    # parallax / zoom / reveal layers (one animated image)
src/components/scroll-canvas/scroll-canvas-sequence.tsx # N frames, opacity from index
src/components/scroll-canvas/use-frame-progress.ts      # measure + derive progress (UI thread)
src/components/scroll-canvas/scroll-canvas.variants.ts
src/components/scroll-canvas/scroll-canvas.variants.test.ts
src/components/scroll-canvas/AGENTS.md
```
Package `AGENTS.md` Components row `[ScrollCanvas](src/components/scroll-canvas/AGENTS.md) | @delacour/react-native-ui/scroll-canvas | An image in a still frame that moves as the page scrolls`; `gen-exports`.

## Playground demo

`apps/playground/src/demos/scroll-canvas/` (demos render a short scrolling page each):
1. `parallax.tsx` - **hero**, capture (flow: scroll 300pt).
2. `zoom.tsx` - capture (flow: scroll).
3. `reveal.tsx` - capture (flow: scroll).
4. `sequence.tsx` - 24 generated frames, thumb scrubs. capture (flow: slow drag).
5. `window-and-distance.tsx` - `start`/`end`/`distance` variants side by side. gallery only.
6. `reduced-motion.tsx` - `enabled={false}` resting states. capture (still).

Demo images: use `require`d bundled assets from `apps/playground/assets` or `apps/playground/src/demos/assets` (demos may import local assets; no network). Route `src/app/(components)/scroll-canvas.tsx`; `components-index.ts` row (`group: "Layout"`, "Four scroll effects"); `bun run gen-demos`.

## Docs page

`apps/web/content/docs/native/components/scroll-canvas.mdx`: Preview -> Installation -> Usage (page with a canvas, inside Screen) -> Effects (one section each, with its demo) -> Position contract (direct child / source ref / `progress`) -> Props -> Reduced motion -> Memory note for `sequence` (20-30 frames at display size, not full-resolution). `ITEM_META["scroll-canvas"]` `{ title: "ScrollCanvas", description: "An image in a still frame that parallaxes, zooms, reveals or scrubs a frame sequence as the page scrolls.", categories: ["layout"] }`. `PACKAGE_INSTALL`: no change (reanimated, worklets only).

## Changeset

`@delacour/react-native-ui`: **minor** - add ScrollCanvas with parallax, zoom, reveal and sequence effects.

## Out of scope

- Horizontal canvases; effects driven by anything but scroll offset/progress.
- Video, Lottie, GIF, remote preloading/caching, blurhash.
- Pinned (sticky) scroll-story sections; pager gestures.
- `expo-image`, an injected image component.

## Acceptance checklist

- [ ] `scroll-canvas.variants.test.ts` written first, failing, then green (`bun test packages/react-native-ui/src/components/scroll-canvas`)
- [ ] `bun run typecheck`, `bun run check` clean; no `any`; discriminated union forbids `sources` on non-sequence and `source` on sequence (type test via `// @ts-expect-error` in the variants test file or a `.test-d`-style check in typecheck)
- [ ] `displayName`: `ScrollCanvas`, `ScrollCanvasImage`, `ScrollCanvasSequence`
- [ ] Folder `AGENTS.md` + Components row (`docs.test.ts`); `gen-exports`; demos + `gen-demos` + `demos.test.ts` (one hero); docs page; registry entry + registry build; changeset
- [ ] Worklets self-contained; no `undefined is not a function` on a Release build
- [ ] agent-device on iOS simulator (`warden claim ios --json`, explicit `--udid`/`--session`): parallax image never exposes a frame edge at either end of travel; zoom reaches scale 1 by the `end` position; reveal wipes bottom-up and ends fully uncovered; sequence changes frame monotonically with a slow drag and shows frame 0 at rest above the window
- [ ] `measureLayout` path verified: a canvas nested two views deep in a `useScrollSource` scroller lines up; Screen-ambient direct-child case lines up; content growing above the canvas re-aligns it
- [ ] Settings > Accessibility > Motion > Reduce Motion on: all four effects render the resting state; no layout shift
- [ ] Decorative (no label) is skipped by VoiceOver; labelled one announces once as an image
- [ ] Memory sanity: 24-frame sequence at 1000x625 does not get the app jetsammed on a simulator
