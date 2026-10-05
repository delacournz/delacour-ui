# ImageViewer

A fullscreen image viewer that opens from a thumbnail, with pinch, pan and double-tap zoom, swipe between a gallery, and drag-down to dismiss.

Plan ID: LAYOUT-05
Folder: `packages/react-native-ui/src/components/image-viewer`
Import: `@delacour/react-native-ui/image-viewer`

## Purpose on mobile

Tap a photo in a feed, a grid or a message and look at it properly: fill the screen, pinch into detail, flick to the next one, drag it away. The image grows out of the thumbnail's own frame and returns to it on dismiss, so the user keeps their place.

Deliberately not:
- Not a general modal or dialog (Overlays owns those). The full-screen layer here is internal and only ever holds images.
- Not an image component. It wraps whatever the caller draws; it does not cache, decode or resize.
- Not an editor, a save/share sheet or a video player.
- Not a carousel. Paging inside the viewer reuses the same maths as `Carousel` (LAYOUT-01) but has fixed behaviour: full-width pages, no loop, no peek.

Relation to existing components: standalone, `Pressable` for the thumbnail, shared paging maths from `src/lib/paging.ts` (created by LAYOUT-01, which must land first; if the order flips, LAYOUT-05 creates the file and LAYOUT-01 consumes it). `Screen` is untouched; the viewer sits above every screen.

## API

```ts
type ImageViewerImage = {
	/** Stable key. Required in data mode and when a Trigger registers itself. */
	id: string;
	/** What the thumbnail and the opening animation draw. */
	source: ImageSourcePropType;
	/** Sharper source loaded once the viewer is open; the thumbnail stays underneath until it arrives. */
	fullSource?: ImageSourcePropType;
	/** Required: read by screen readers on the trigger and in the viewer. */
	alt: string;
	caption?: string;
	/** Intrinsic size. Lets the opening frame be right before a remote image reports its own. */
	width?: number;
	height?: number;
};

type ImageViewerRenderImageProps = {
	source: ImageSourcePropType;
	alt: string;
	resizeMode: "cover" | "contain";
	style: StyleProp<ImageStyle>;
	onLoad: (size: { width: number; height: number }) => void;
	onError: () => void;
	testID?: string;
};

type ImageViewerStateProps =
	| { open: boolean; defaultOpen?: never; onOpenChange: (open: boolean) => void }
	| { open?: undefined; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void };

type ImageViewerIndexProps =
	| { index: number; defaultIndex?: never; onIndexChange: (index: number) => void }
	| { index?: undefined; defaultIndex?: number; onIndexChange?: (index: number) => void };

type ImageViewerProps = ImageViewerStateProps &
	ImageViewerIndexProps & {
		children?: ReactNode;
		/** Data mode: the gallery, independent of which Triggers are mounted (a virtualised list). Omitted = composed mode, the gallery is whichever Triggers are mounted, in mount order. */
		images?: readonly ImageViewerImage[];
		/** Escape hatch for a third-party image (e.g. expo-image). Default draws React Native's `Image`. */
		renderImage?: (props: ImageViewerRenderImageProps) => ReactElement;
		maxScale?: number;        // default 4
		doubleTapScale?: number;  // default 2.5
		/** Drag-down to dismiss. Default true. */
		isDismissible?: boolean;
		isDisabled?: boolean;
		/** Chrome over the image: close button + counter. Default true. */
		showsChrome?: boolean;
		/** Corner radius the image wears while it is at the thumbnail's frame. Default: the Trigger's `radius`, else 0. */
		cornerRadius?: number;
	};

type ImageViewerTriggerProps = Omit<PressableProps, "onPress" | "children"> & {
	children?: ReactNode;     // custom thumbnail; default draws the image at the Trigger's size
	radius?: number;
	className?: string;
} & (
	| ({ index?: undefined } & ImageViewerImage)           // self-registering (composed mode)
	| { index: number }                                    // refers to root `images[index]` (data mode)
);

type ImageViewerCloseProps = Omit<ComponentProps<typeof Button>, "onPress">;   // optional extra close control

type ImageViewerContextValue = {
	isOpen: boolean;
	index: number;
	count: number;
	images: readonly ImageViewerImage[];
	open: (index?: number) => void;
	close: () => void;
	scrollTo: (index: number) => void;
};
function useImageViewer(): ImageViewerContextValue;
```

Compound surface (`Object.assign`): `Trigger`, `Close`; `displayName: "DelacourUI.ImageViewer"`. The viewer layer itself (`ImageViewerLayer`, `ImageViewerPage`, `ImageViewerChrome`) is internal, rendered by the root; there is no `Content` part to forget.

```tsx
<ImageViewer>
  <View className="flex-row flex-wrap gap-2">
    {PHOTOS.map((p) => (
      <ImageViewer.Trigger key={p.id} id={p.id} source={p.thumb} fullSource={p.full} alt={p.alt} caption={p.title} className="size-28 rounded-md" />
    ))}
  </View>
</ImageViewer>

<ImageViewer images={PHOTOS} open={isOpen} onOpenChange={setOpen} index={i} onIndexChange={setI}>
  <FlatList data={PHOTOS} renderItem={({ index }) => <ImageViewer.Trigger index={index} className="aspect-square" />} />
</ImageViewer>
```

Decisions:
- **Image: React Native `Image` by default; `renderImage` for anything else.** `expo-image` is rejected as a dependency: it is an Expo package (rule 4 would force the component into `src/expo/` behind an optional peer and a `withUniwind` wrap per rule 7), it would split the viewer from the thumbnails callers already render, and the viewer needs only `source`, `style`, `resizeMode`, `onLoad`. `renderImage` hands those over, so an app wanting expo-image's cache passes `(p) => <ExpoImage source={p.source} style={p.style} contentFit={p.resizeMode} onLoad={(e) => p.onLoad(e.source)} />` in its own code, with no new peer here.
- **Two modes, one discriminated union on `Trigger`.** Composed mode is the nice default; data mode exists because a virtualised list unmounts triggers and a gallery built from mounted triggers would shrink as the user scrolls. Gallery order in composed mode is mount order (a monotonic counter taken in a layout effect), documented as such.
- **Controlled `open`/`index` and uncontrolled via `useControllableState`**, twice (one for each).

## Variants & sizes

`image-viewer.variants.ts`, one slotted `tv()`. No `variant` or `size` axes: the Trigger is sized by `className`, as Avatar's wrapper is sized by its caller, and the viewer is one fixed treatment.

| Slot | Classes |
| --- | --- |
| `trigger` | `overflow-hidden bg-muted` (the swatch while the thumbnail loads) |
| `backdrop` | `absolute inset-0 bg-media` |
| `chrome` | `absolute inset-x-0 flex-row items-center justify-between px-screen-gutter` (safe-area top is added in JS) |
| `counter` | `text-sm text-media-foreground` on `Text` |
| `caption` | `text-sm text-media-foreground text-center px-screen-gutter` |
| `close` | `Button` `variant="ghost" size="icon-md"` with `text-media-foreground` on the glyph via `Icon` colour |
| `error` | `items-center justify-center gap-2`, glyph + `text-media-foreground` message |

**One new token, justified (rule 11).** The viewer needs a surface that is dark in both themes and chrome drawn on it. Nothing in shadcn's set means "a dark stage for media", and `overlay` is a translucent scrim, not an opaque stage. Both are **derived** so a pasted palette drags them along:
- `--media`: light `var(--foreground)`, dark `var(--background)`.
- `--media-foreground`: light `var(--background)`, dark `var(--foreground)`.
Edits: `src/styles/theme.css` — both names in **both** `@variant light` and `@variant dark` (Uniwind refuses otherwise), plus `--color-media` and `--color-media-foreground` in `@theme inline`; `styles/theme-tokens.test.ts` already fails on the gap. They are colours, so `tokens.css`/`tokens.ts` (the geometry lists) are untouched. If `apps/web` mirrors the semantic set (`app.css`), check `app.css.test.ts`. `X-foreground` keeps its meaning: content on an `X` surface.

Constants: `VIEWER_MAX_SCALE = 4`, `VIEWER_DOUBLE_TAP_SCALE = 2.5`, `VIEWER_PAGE_GAP_POINTS = 16`, `VIEWER_DISMISS_DISTANCE_FRACTION = 0.15`, `VIEWER_DISMISS_VELOCITY = 800`, `VIEWER_SPRING`.

## States

- Closed / opening / open / zoomed / dismissing, tracked on the UI thread (`phase` shared value) with `isOpen` on the JS side. The `Modal` stays mounted until the close animation ends, then `isOpen` of the layer drops (`onFinish` via `scheduleOnRN`).
- `isDisabled`: Triggers inert and `accessibilityState.disabled`; `open()` no-ops.
- `isDismissible={false}`: no drag-down; the close button and Android back still close.
- Image loading: the thumbnail renders immediately as the page's base layer (known instantly, already decoded); `fullSource` fades in over it on `onLoad` (150 ms, calm: instant). No spinner: the base is already a picture.
- Image error (full): keep showing the thumbnail, no error chrome. Error on the thumbnail source itself (no base to fall back on): the `error` slot.
- Empty gallery (`count === 0`) or `index` out of range: clamped via `resolveViewerIndex`; `open()` with no images is a no-op and warns in dev.
- Gallery shrinks while open (data mode): index clamps; if it reaches zero the viewer closes.
- Trigger scrolled off-screen or unmounted by the time of dismissal: the return target is gone, so the viewer falls back to a fade + slight scale-down (`resolveCloseTarget` returns `"fade"`).

## Accessibility

- Trigger: `accessibilityRole="imagebutton"`, `accessibilityLabel` = `alt`, `accessibilityHint` "Opens full screen image viewer".
- Layer: `Modal` + `accessibilityViewIsModal` on iOS; focus moves to the page on open and back to the trigger on close (`AccessibilityInfo.setAccessibilityFocus` by node handle). Android back (`onRequestClose`) closes.
- Page: `accessibilityRole="image"`, label = `alt` (+ caption). The pager exposes `accessibilityRole="adjustable"`, `accessibilityValue={{ text: "2 of 5" }}`, `increment`/`decrement` actions; the OS announces the change.
- **Zoom without a pinch**: custom `accessibilityActions` `zoomIn` / `zoomOut` / `resetZoom` on the page (step to the next of 1, doubleTapScale, maxScale), so a screen-reader or switch user can reach detail. Double-tap is also the VoiceOver activate gesture, which is why `accessibilityActions` rather than only a tap gesture.
- Close: always a visible, labelled "Close image viewer" button (chrome), 44 pt target; gestures are never the only way out.
- Reduce motion / `useCalmMotion()`: no origin-frame flight (the frame is the fitted rect from frame 0; backdrop and image cross-fade 150 ms); zoom steps use `withTiming` 150 ms; dismiss fades. Pinch and pan stay live (they are the user's own motion).
- Contrast: chrome is `media-foreground` on `media`, which inherits the theme's foreground/background contrast.
- Status bar: `Modal` `statusBarTranslucent`; style set light for the duration via React Native's `StatusBar` (restored on close).

## Motion

- **Layer: React Native `Modal`** (`transparent`, `animationType="none"`, `statusBarTranslucent`, `supportedOrientations` all), not teleport. `DelacourProvider` offers no portal host (and says new layers are optional peers: `BottomSheetProvider` is exported from the sheet's own subpath because the engine is an optional peer). Teleport here would add `react-native-teleport` + a Provider the app must mount + a peer decision for a feature that needs none of its stacking. `Modal` gives a native window above navigators, tab bars and other sheets, correct Android back handling, and zero setup. Cost: it is a separate native window, so **`GestureHandlerRootView` must be rendered inside it** (Gesture Handler does not cross the boundary on Android), and the `SafeAreaProvider` context is re-supplied with `SafeAreaInsetsContext` from the outer insets (read by `useSafeAreaInsets()` before the Modal and passed in). Keep that in the AGENTS.md as the first rule.
- Opening: on `open(index)`, `measureInWindow` the Trigger (`useAnimatedRef` + `measure` on the UI thread, or the JS `measureInWindow` callback if the Trigger is not animated) -> `origin: { x, y, width, height }`. One `progress` shared value 0 -> 1 (spring, `VIEWER_SPRING`) drives everything.
- **The image flies by frame, not scale.** A clipping view animates `left/top/width/height` from `origin` to `fitted` (`resolveFrameAt(progress, origin, fitted)`), with the image `resizeMode="cover"` inside and `borderRadius` interpolating `cornerRadius -> 0`. At the end the frame has the image's own aspect, so cover equals contain. A scale transform would squash a thumbnail that crops (`cover`) into a wrong aspect for the whole flight; frame animation keeps the crop honest. Only one view animates layout, absolutely positioned, so no sibling is dirtied (the `Tabs.Indicator` argument).
- `fitted = resolveFittedRect(aspect, window, insets)`. `aspect` is `width/height` props when given, else the Trigger's measured frame aspect until `onLoad` reports the real size (then it eases: tiny correction, usually none).
- Backdrop opacity = `progress` while opening/closing, and `resolveBackdropOpacity(translationY, windowHeight)` while dragging.
- **Gestures per page**, composed on a `GestureDetector`:
  - `pinch = Gesture.Pinch()` — scale about the focal point; `resolvePinchTransform` keeps the point under the fingers fixed (translation adjusts as scale changes); below 1 it rubber-bands, above `maxScale` it rubber-bands; `onFinalize` springs back into `[1, maxScale]` and clamps translation.
  - `zoomedPan = Gesture.Pan()` — `enabled` only while `scale > 1`; translates, clamped by `resolveTranslateBounds(scale, fitted, window)` with rubber-band beyond.
  - `doubleTap = Gesture.Tap().numberOfTaps(2)` — `resolveDoubleTapTarget(scale, doubleTapScale)` toggles 1 <-> doubleTapScale, centred on the tap point (translation computed so the tapped point stays put, then clamped).
  - `singleTap` (waits for double-tap to fail, `Gesture.Exclusive(doubleTap, singleTap)`) toggles the chrome.
  - Pinch + zoomedPan are `Simultaneous`; that group is `Exclusive` with the taps.
- **Container pan (pager + dismiss)**, `enabled` only while `scale === 1`: `activeOffsetX`/`activeOffsetY` at 10 pt; the first axis to cross decides **once** per gesture (`resolveDragAxis`): horizontal drives the pager `position`, vertical drives `translateY` + backdrop + a gentle scale-down (`resolveDismissScale`). On release, `resolveDismissDecision(translationY, velocityY, windowHeight)` -> `"dismiss"` flies the frame back to `origin` (or fades, see States) and `"restore"` springs to rest. Horizontal settle uses `lib/paging.ts` `resolveSettleTarget`/`resolvePanPosition` (no loop, at most one page per gesture).
- While zoomed, horizontal swipes pan the image; hand-off to the pager at the image's edge is **not** done in v1 (RNGH cannot cleanly transfer an active pan). The user zooms out to page; documented.
- Pages are absolutely placed by `position` exactly as Carousel's items are; only `index +/- 1` are mounted (`resolveVisibleRange(index, count, false, 1)`). The off-screen neighbours' zoom resets to 1 on becoming inactive.
- Chrome (close, counter, caption) fades with `1 - dismissProgress` and hides while zoomed > 1.05 or after a single tap.
- Worklets are flat; shared values are not read from a stable JS closure (React Compiler: the playground has it on, `react-compiler-stable-fn-ref`). Crossings to JS use `scheduleOnRN` from `react-native-worklets`.
- Haptics: Trigger `haptic="selection"` (Pressable prop); none inside the viewer.

## Reuses

- `Pressable` (Trigger), `Button` + `Icon` (Close, `IconCross` family — verify the glyph name in `icons/central.ts`), `Text`, `Slot` (`asChild` on Trigger is not offered; `children` is the custom-thumbnail path).
- `useControllableState`, `useCalmMotion`, `cn`, `tv`, `useThemeColor("media")` for the status-bar background/`Modal` fallback.
- `src/lib/paging.ts` (LAYOUT-01): `resolveSettleTarget`, `resolvePanPosition`, `resolveRubberBand`, `resolveVisibleRange`, `resolveIndexFromPosition`.
- Gesture Handler, Reanimated, Worklets, `react-native-safe-area-context` (all existing peers).
- Not used: the bottom-sheet engine (its geometry is height-space for a sheet; wrong coordinate system for a free-moving image), teleport, `Skeleton`.

## New peer deps

None. Considered and rejected: `expo-image` (see API decisions: Expo import = optional peer + `src/expo/` + `withUniwind` + a `PACKAGE_INSTALL` line, for nothing the viewer needs), `expo-blur` (blurring the page behind is a nice-to-have; here the backdrop is the opaque `media` token, and a blur would be a second optional Expo peer for polish), `react-native-teleport` (see Motion), a zoom library (`react-native-zoom-toolkit` and similar: third-party gesture code outside the Expo catalog, and the maths here is small and testable).

## Cross-category dependencies

- **Overlays** (Dialog/Popover/Toast/Menu on an unmerged branch): not imported. The internal full-screen layer is `ImageViewerLayer`, a `Modal` with its own gesture root, ~80 lines, private to this folder. If Overlays later exposes a full-screen layer primitive, swap the Modal inside `ImageViewerLayer` only; no public API changes.
- **Media**: if a Media `Image` ships, it is the natural `renderImage` target and the default Trigger thumbnail; v1 uses RN `Image` directly.
- **Navigation**: none. The counter is plain text ("2 / 5"); no Pagination dots.
- **Carousel (LAYOUT-01)**: only through `lib/paging.ts`; no import from `../carousel`.

## Pure logic to unit-test

Tests are written first in `image-viewer.variants.test.ts` (shared paging maths is tested in `lib/paging.test.ts`, LAYOUT-01).

- `resolveFittedRect(aspect, window, insets)`: aspect 1.5 in 400x800 with zero insets -> {x:0, y:(800-266.67)/2, width:400, height:266.67}; aspect 0.5 -> height-bound: {height:800, width:400}; aspect 0.4 -> width 320, x 40; insets top 50 bottom 34 shrink the available box before fitting; aspect <= 0 or NaN -> the full box; window 0 -> zero rect.
- `resolveFrameAt(progress, origin, fitted)`: 0 -> origin; 1 -> fitted; 0.5 -> midpoints of all four numbers; progress clamped to [0, 1].
- `resolveCornerRadiusAt(progress, cornerRadius)`: 0 -> cornerRadius, 1 -> 0, 0.5 -> half.
- `resolveTranslateBounds(scale, fitted, window)`: scale 1 and fitted == window -> {0, 0}; scale 2, fitted 400x266.67 in 400x800 -> maxX 200, maxY 0 (image shorter than the window stays centred vertically until it overflows); scale 4 -> maxY (266.67*4 - 800)/2 = 133.33; scale < 1 -> {0, 0}.
- `resolveClampedTranslation(translation, bounds)`: inside -> unchanged; outside -> bound; with `rubber: true` the overshoot is `resolveRubberBand`-compressed and always < the raw overshoot.
- `resolvePinchTransform({ startScale, startTranslation, pinchScale, focal, center, maxScale })`: pinchScale 2 about the screen centre -> translation unchanged, scale 2; about a point 100 right of centre -> translation x -100 so that point stays put; result scale clamped to [1, maxScale] (with rubber past either end); startScale 1 and pinchScale 0.5 -> scale in (0.5, 1).
- `resolveDoubleTapTarget({ scale, doubleTapScale, tap, center, bounds })`: scale 1 -> {scale: doubleTapScale, translation clamped so the tap point stays put}; scale > 1 -> {scale: 1, translation: 0,0}; tap exactly at centre -> translation 0; tap near the edge clamps to bounds.
- `resolveNextZoomStep(scale, doubleTapScale, maxScale)` (for accessibility `zoomIn`): 1 -> doubleTapScale; doubleTapScale -> maxScale; maxScale -> maxScale. `resolvePreviousZoomStep`: reverse, floor 1.
- `resolveDragAxis({ translationX, translationY, activateAt })`: (12, 3, 10) -> "horizontal"; (3, 12, 10) -> "vertical"; (6, 6, 10) -> "undecided"; (-12, -3, 10) -> "horizontal".
- `resolveDismissDecision(translationY, velocityY, windowHeight)`: (150, 0, 800) -> dismiss (15 % = 120); (100, 0, 800) -> restore; (30, 900, 800) -> dismiss (velocity); (-150, 0, 800) -> dismiss (up works too); (100, -900, 800) -> restore (flicking back against the drag cancels).
- `resolveBackdropOpacity(translationY, windowHeight)`: formula `1 - min(|dy| / (0.5 * h), 1)`: (0, 800) -> 1; (200, 800) -> 0.5; (-200, 800) -> 0.5; (400, 800) -> 0; (900, 800) -> 0.
- `resolveDismissScale(translationY, windowHeight)`: 0 -> 1; floor 0.8 at a half window.
- `resolveCloseTarget({ originVisible, calm })`: visible & !calm -> "origin"; !visible -> "fade"; calm -> "fade". `resolveOriginVisible(origin, window)`: fully offscreen -> false; partly visible -> true.
- `resolveViewerIndex(index, count)`: (5, 3) -> 2; (-1, 3) -> 0; (0, 0) -> 0.
- `resolveGalleryOrder(registrations)`: sorts by mount sequence; ignores duplicates of one `id` (last wins, keeps first position).
- `resolveViewerA11yValue(index, count)`: (1, 5) -> "2 of 5".
- Token existence: every class in the `tv()` slots resolves to a token present in both themes, including `media` and `media-foreground`; and `--media`/`--media-foreground` are declared in both `@variant` blocks and aliased in `@theme inline` (extends `theme-tokens.test.ts`).
- No `self-*`, no `dark:`, no raw palette colour in any slot.

## File map

Under `packages/react-native-ui/src/components/image-viewer/`:
- `index.ts` — root, `useImageViewer`, prop types, `imageViewerVariants`, constants
- `image-viewer.tsx` — root, state, registry, `Object.assign`
- `image-viewer-trigger.tsx` — `Pressable` thumbnail, self-registration, measure
- `image-viewer-close.tsx` — optional extra close `Button`
- `image-viewer-layer.tsx` — internal: `Modal`, gesture root, safe-area re-supply, `progress`, opening/closing choreography
- `image-viewer-page.tsx` — internal: one image, pinch/pan/double-tap, fallbacks, fullSource fade
- `image-viewer-chrome.tsx` — internal: close, counter, caption
- `image-viewer-image.tsx` — internal: `renderImage` or RN `Image`
- `image-viewer.context.tsx` — static / state / motion contexts; `useImageViewer`, `useImageViewerPart(name)`
- `image-viewer.types.ts` — shared prop types
- `image-viewer.variants.ts` + `image-viewer.variants.test.ts`
- `AGENTS.md` — decisions, file map, the Modal/gesture-root rule, zoom hand-off non-goal
Edits elsewhere:
- `src/styles/theme.css` (`--media`, `--media-foreground`, both variants + alias), `theme-tokens.test.ts` expectation
- `packages/react-native-ui/AGENTS.md` Components table row
- `package.json` `exports` via `bun run gen-exports`
- `packages/cli/src/registry/config.ts` (`ITEM_META["image-viewer"]`)
- `.changeset/add-image-viewer.md`
- Depends on `src/lib/paging.ts` from LAYOUT-01

## Playground demo

`apps/playground/src/demos/image-viewer/` (ordered `index.ts`; `bun run gen-demos`). Seeded remote images; thumbnails are 200 px and `fullSource` 1600 px so the progressive path is visible.

1. `gallery-grid` — 3x2 grid, swipe between, `capture: { flow: "image-viewer/gallery-grid", hero: true }` (flow: tap tile 3, wait for `image-viewer-page-2`, swipe, close)
2. `zoom` — single image; flow double-taps and pinches (capture; pinch via `gesture pinch` at scale >= 0.5 per the device rules)
3. `drag-to-dismiss` — single image, flow drags down past threshold (capture)
4. `captions-full-source` — caption + `fullSource` (capture)
5. `custom-thumbnail` — `Trigger` children (a card with a play-less preview) (not captured)
6. `controlled` — external button opening at a chosen index, `open`/`index` controlled (capture)
7. `data-mode-list` — `images` + `index` Triggers in a `FlatList` (not captured)

`testID`s: Triggers `image-viewer-trigger-<id>`, pages `image-viewer-page-<n>`, close `image-viewer-close`, counter `image-viewer-counter`. Route `apps/playground/src/app/(components)/image-viewer.tsx` (six-line `DemoGallery`), row in `src/app/index.tsx` with a Central glyph (e.g. an image/photo glyph; verify the name). The capture route (`preview.tsx`) is chrome-free, so verify the Modal appears over it.

## Docs page

`apps/web/content/docs/native/components/image-viewer.mdx`: frontmatter; `<Preview id="image-viewer/gallery-grid" title={null} />`; Installation; Usage (single, then a gallery); Zoom and gestures (table: pinch, double-tap, drag, swipe, tap); Full-resolution sources; Data mode for lists; Controlled; Custom images with `renderImage` (expo-image recipe); Custom thumbnails; Accessibility (zoom actions); Theming (`media` tokens); API tables (root, Trigger, Close, `ImageViewerImage`, `ImageViewerRenderImageProps`); `useImageViewer`.

Registry: `ITEM_META["image-viewer"] = { title: "Image Viewer", description: "A fullscreen viewer that opens from a thumbnail: pinch, pan and double-tap zoom, swipe between images, drag down to dismiss.", categories: ["display"] }` — no `overlays` tag, that category is Overlays'. `PACKAGE_INSTALL`: no new import (Gesture Handler, Reanimated, Worklets, safe-area-context are already classified). `verify:expo` must pass; confirm `lib/paging` placeholder rewriting works for the cross-folder import. Run `bun --filter delacour run registry:build` and commit `registry/`.

## Changeset

`@delacour/react-native-ui`: minor — "Add ImageViewer: fullscreen gallery with pinch, pan and double-tap zoom, swipe between images and drag-to-dismiss, plus the `media` colour tokens."

## Out of scope

- Blur behind the viewer (would need `expo-blur`), shared-element transitions across navigator screens.
- Save, share, rotate, crop, video, GIF scrubbing, live photos.
- Zoom-to-pager hand-off at the image edge.
- Rotation gesture; landscape-specific chrome beyond keeping the fitted rect correct.
- Image caching, prefetch, progressive JPEG decoding (the caller's `renderImage`).
- A public `Content`/`Overlay` composition surface; the layer is internal until Overlays defines one.
- Pinning to Dialog or the bottom-sheet engine.

## Acceptance checklist

- [ ] `image-viewer.variants.test.ts` written first, failing, then passing; `bun test packages/react-native-ui/src/components/image-viewer packages/react-native-ui/src/styles`
- [ ] `lib/paging.ts` exists (from LAYOUT-01) and is imported, not copied
- [ ] `--media` and `--media-foreground` in both `@variant` blocks plus `@theme inline`; `theme-tokens.test.ts` passes
- [ ] `bun run typecheck`, `bun run check` clean; no `any`; no comments in JSX; no `expo-*` import anywhere in the folder
- [ ] `DelacourUI.ImageViewer[.Part]` displayName on root, parts and internal leaves
- [ ] `AGENTS.md` written (documents the Modal + gesture-root rule); Components table row added
- [ ] `bun run gen-exports`; `bun run gen-demos`; 4-6 captured demos, one hero; route + home row; `bun run previews` run
- [ ] Docs page + `ITEM_META`; `registry:build` committed; `verify:expo` passes; changeset committed
- [ ] Simulator (agent-device, leased device): tap thumbnail -> image flies from the thumbnail's frame (cropped `cover` thumbnail does not squash mid-flight); pinch holds the point under the fingers; double-tap zooms to 2.5x at the tap point and back; zoomed pan stops at the edges with rubber band; swipe pages one image per gesture; drag down past ~15 % dismisses back to the thumbnail, a shorter drag springs back; backdrop fades with the drag
- [ ] Gesture Handler works inside the Modal on **Android** (no dead gestures) and iOS; Android back closes; status bar restored
- [ ] Trigger scrolled out of view then closing: fades instead of flying to an off-screen rect
- [ ] Reduce Motion on: no flight, cross-fade only; VoiceOver: focus moves in/out, "n of m" announced, zoomIn/zoomOut actions work, close button reachable
- [ ] Release build checked (not only dev) — the Release-only Accordion regression is the precedent
