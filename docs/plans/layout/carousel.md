# Carousel

A swipeable run of slides driven by one fractional position — peeking, looping, vertical, autoplaying, with dots, arrows and captions as optional parts.

Plan ID: LAYOUT-01
Folder: `packages/react-native-ui/src/components/carousel`
Import: `@delacour/react-native-ui/carousel`

## Purpose on mobile

For content a thumb moves through sideways (or up): product photos, onboarding cards, a "featured" strip, a stack of stories. One slide is the focus; neighbours may peek to say "there is more".

Deliberately not:
- Not a list. No virtualised `data`/`renderItem`; it holds a handful (<= ~30) of hand-written slides. A feed is `@legendapp/list`.
- Not `Tabs`. `Tabs` pairs a bar with content sections and owns a value; Carousel has no bar, and its value is a slide index.
- Not a fullscreen viewer. Zoom and dismiss are `ImageViewer` (LAYOUT-05).
- Not a native paging `ScrollView`. The track is a pan gesture over one shared value, so peek, loop, vertical and coverflow are the same code with different transforms (the lesson `Tabs` already paid for — see `tabs/AGENTS.md` "Value flow").

Relation to existing components: standalone. It takes `Tabs`' pager as prior art (shared `position` value, pan claims one axis and fails on the other, settle in `onFinalize`, no cleanup on the reconcile effect) but not its code: `Tabs` translates one row, Carousel positions every slide, because looping and coverflow need per-slide transforms. `Screen` is orthogonal; a Carousel inside `Screen.ScrollArea` works because the pan fails on the cross axis.

## API

```ts
type CarouselOrientation = "horizontal" | "vertical";

type CarouselVariant = "track" | "coverflow";

type CarouselCommonProps = {
	children: ReactNode;
	variant?: CarouselVariant;            // default "track"
	orientation?: CarouselOrientation;    // default "horizontal"
	loop?: boolean;                       // default false
	/** Slide length along the travel axis, in points. Omitted = the viewport's, one slide per screen. Smaller = neighbours peek and the active slide is centred. */
	itemSize?: number;
	/** Gap between slides, points. Default CAROUSEL_GAP_POINTS (12). */
	gap?: number;
	/** Slides mounted either side of the active one. Default 2. */
	windowSize?: number;
	isDisabled?: boolean;                 // no gesture, arrows disabled, a11y disabled
	isScrollEnabled?: boolean;            // default true; false = programmatic only
	autoplay?: boolean;                   // default false
	autoplayInterval?: number;            // ms per slide, default 4000
	className?: string;
	testID?: string;
	accessibilityLabel?: string;          // the carousel's name, e.g. "Featured"
};

type CarouselStateProps =
	| { index: number; defaultIndex?: never; onIndexChange: (index: number) => void }   // controlled
	| { index?: undefined; defaultIndex?: number; onIndexChange?: (index: number) => void }; // uncontrolled (default 0)

type CarouselProps = CarouselCommonProps & CarouselStateProps;

type CarouselContentProps = ViewProps & {
	children: ReactNode;                  // Carousel.Item elements, direct children
	/** Horizontal only. Sets the viewport height from its width; vertical needs a height class. */
	aspectRatio?: number;
	className?: string;
};

type CarouselItemProps = ViewProps & { className?: string; asChild?: boolean };

type CarouselCaptionProps = TextProps & { className?: string };   // child of Item; visible only while active

type CarouselDotsProps = ViewProps & {
	/** Cap on dots drawn; beyond it a sliding window of this many. Default 7. */
	maxDots?: number;
	tone?: "default" | "overlay";         // overlay = light dots for sitting on photos
	className?: string;
};

type CarouselArrowProps = Omit<ComponentProps<typeof Button>, "onPress" | "children"> & { children?: ReactNode };
// Previous / Next: icon Button, disabled at the ends unless loop.

type CarouselControlsProps = ViewProps & { className?: string }; // row: Previous · Dots · Next

type CarouselContextValue = {
	index: number;
	count: number;
	orientation: CarouselOrientation;
	canGoPrevious: boolean;
	canGoNext: boolean;
	scrollTo: (index: number, options?: { animated?: boolean }) => void;
	previous: () => void;
	next: () => void;
};
function useCarousel(): CarouselContextValue;   // throws outside <Carousel>
```

Compound surface (`Object.assign`): `Content`, `Item`, `Caption`, `Dots`, `Previous`, `Next`, `Controls`; `displayName: "DelacourUI.Carousel"`.

```tsx
<Carousel accessibilityLabel="Featured" itemSize={280} loop>
  <Carousel.Content aspectRatio={1.4}>
    {PHOTOS.map((p) => (
      <Carousel.Item key={p.id}>
        <Image source={p.source} className="size-full rounded-lg" />
        <Carousel.Caption>{p.title}</Carousel.Caption>
      </Carousel.Item>
    ))}
  </Carousel.Content>
  <Carousel.Controls>
    <Carousel.Previous /><Carousel.Dots /><Carousel.Next />
  </Carousel.Controls>
</Carousel>
```

Decisions:
- `Carousel.Item` children are found by walking `Content`'s direct children (as `ListGroup` finds separators and `Tabs` finds its content parts); order of record = source order. Wrappers around an Item are unsupported and warned in dev.
- No `variant="stack"` or `"interactive"` fan in v1 (see Out of scope).
- `scrollTo` and `next/previous` with `loop` take the shortest way round.

## Variants & sizes

`carousel.variants.ts`: one slotted `tv()` from `lib/tv`.

| Slot | Classes (semantic tokens only) |
| --- | --- |
| `root` | `w-full gap-3` |
| `viewport` | `overflow-hidden` (clips; the slides are absolutely placed) |
| `item` | `absolute overflow-hidden rounded-lg` — `rounded-lg` is the card step (root AGENTS "`--radius` is the card corner") |
| `caption` | `text-sm text-foreground` on `Text`; rule 1: colour on the Text, never the parent |
| `controls` | `flex-row items-center justify-between gap-3` |
| `dots` | `flex-row items-center justify-center gap-1.5` |
| `dot` | `h-1.5 rounded-full bg-foreground/30`; `tone=overlay` -> `bg-primary-foreground/40` (no raw white) |
| `dotActive` | `bg-foreground`; `tone=overlay` -> `bg-primary-foreground` |

Axes: `variant` (`track | coverflow`), `orientation` (`horizontal | vertical`, swaps the controls row to a column and the dots to vertical), `tone` (dots). No `size` axis: size is `itemSize`. No new tokens. Constants exported from variants: `CAROUSEL_GAP_POINTS = 12`, `CAROUSEL_DOT_POINTS = 6`, `CAROUSEL_DOT_ACTIVE_POINTS = 18`, `COVERFLOW_ROTATE_DEG = 35`, `COVERFLOW_MIN_SCALE = 0.85`, `COVERFLOW_MIN_OPACITY = 0.5`, `CAROUSEL_SPRING`.

## States

- Controlled/uncontrolled through `useControllableState` ({ value: index, defaultValue: defaultIndex ?? 0, onChange }). `index` is clamped to `[0, count-1]` for display (a shrinking list never leaves a dead index); the clamp is reported through `onIndexChange` once.
- `onIndexChange` fires once per gesture, from `onFinalize`, before the spring finishes (Tabs' rule: a per-frame or midpoint-crossing report re-renders every slide mid-drag).
- Rejected controlled change springs back (the reducer-bump trick from Tabs/Switch, so a parent that refuses to re-render still reconciles).
- `isDisabled`: pan `.enabled(false)`, arrows `isDisabled`, root `accessibilityState.disabled`. `isScrollEnabled={false}` is only the pan; arrows and `scrollTo` still work.
- Empty (`count === 0`): renders the viewport only, no gesture, dots return null. One slide: gesture off, arrows disabled, dots hidden.
- Autoplay: advances every `autoplayInterval`; **stops for good on the first touch**; at the non-looping end it stops; pauses while the app is backgrounded (`AppState`). An off-screen carousel (scrolled away) keeps ticking; detecting that cheaply is not possible, so it is documented rather than solved.

## Accessibility

- Root: `accessibilityRole="adjustable"`, `accessibilityLabel`, `accessibilityValue={{ text: "2 of 5" }}` (`resolveCarouselA11yValue`), `accessibilityActions` `increment`/`decrement` -> `next`/`previous`; the OS announces the new value. Swipe up/down on the focused element is the VoiceOver/TalkBack adjust gesture.
- Slides other than the active one are `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` **unless** `itemSize` makes neighbours visible (peek), when all mounted slides stay reachable and each gets `accessibilityLabel` "Slide n of m" prefix only if the caller gave none.
- Arrows: `accessibilityLabel` "Previous slide"/"Next slide", disabled state announced at the ends. Dots: decoration for sighted users: the group is hidden from assistive tech, since the adjustable root already says "2 of 5". Dots are not tappable (touch targets <44pt); arrows are.
- Reduce motion / `useCalmMotion()`: spring becomes a 150 ms `withTiming`, coverflow collapses to `track` transforms (no rotation/scale), **autoplay is disabled** (moving content the user did not ask for). Autoplay is also disabled when a screen reader is on (`AccessibilityInfo.isScreenReaderEnabled`, subscribed via the change event) — WCAG 2.2.2.
- Hit slop: the pan never starts inside 10 pt, so a `Pressable` slide still taps.

## Motion

- One `position` shared value (float slide index) is the whole component. Slide, dot and caption styles are readings of it; there is no second clock.
- Pan: `Gesture.Pan()` — horizontal: `activeOffsetX([-10, 10])` + `failOffsetY([-10, 10])`; vertical swaps the axes. Claims its axis, yields the other, so it lives inside `Screen.ScrollArea` and a vertical carousel inside a horizontal pager. Not `blocksExternalGesture` (RN's ScrollView has no tag; `tabs/AGENTS.md`).
- Origin is back-computed at activation (`resolvePanOrigin`, the Tabs fix for the 10 pt jump); a mid-spring grab resumes where the slide is.
- Drag maps translation -> position by `resolvePanPosition(start, translation, pitch, ...)`. Non-loop ends use `resolveRubberBand` (exponential, max 0.5 slide).
- Settle in `onFinalize` (runs for END/FAILED/CANCELLED), guarded by an `isDragging` flag; spring cancelled in `onStart`, never `onBegin`. Target = `resolveSettleTarget`: a short flick and a long drag both move **at most one slide**; velocity > 300 pt/s or travel > 25 % of pitch commits.
- The reconcile effect (index changed from outside) registers **no cleanup** — copy Tabs' reasoning, not Checkbox's `cancelAnimation`. `resolveReconcileMode`-style: `none | spring | jump` (jump when count changed or `animated:false`).
- Loop: every slide's offset is `resolveWrappedOffset(i, position, count)` in `[-count/2, count/2]`; no clones, no jump-reset. Slides outside `windowSize` are unmounted (JS, from the committed index) and slides whose wrapped offset exceeds the window are `display: none` on the UI thread.
- Per-slide `useAnimatedStyle`: `transform: [{ translateX|Y: inset + offset * pitch }]`; coverflow adds `scale`, `opacity`, `rotateY` with `perspective: 800` from `resolveCoverflow(offset)`. Slides are absolutely placed in a measured viewport (`onLayout` -> `viewport` shared value); position, not layout, moves them, so first paint needs no measurement round trip beyond the one onLayout (until then `opacity: 0`).
- Active-slide centring when `itemSize` is set: `resolveItemInset`.
- Dots: active dot width interpolates `CAROUSEL_DOT_POINTS -> CAROUSEL_DOT_ACTIVE_POINTS` over `|offset|` 1 -> 0 (width, not scaleX, `rounded-full` would ellipse — Tabs.Indicator's reason). Caption opacity = `resolveCaptionOpacity(offset)`.
- Autoplay is a JS interval (`use-carousel-autoplay.ts`) calling `next` through the same reconcile path; cleared on touch (`onBegin` -> `scheduleOnRN(stop)`), unmount, background.
- Worklets are flat (module-scope helpers marked `"worklet"` crash the UI thread — `pressable/AGENTS.md`); the pure functions stay plain TS, and the worklets inline the arithmetic they mirror. Crossing back uses `scheduleOnRN`.

## Reuses

- `Pressable` (via `Button size="icon-sm" variant="secondary"` for arrows; `haptic="selection"`), `Icon` + Central Icons `IconChevronLeft/Right` (verify exact names in `icons/central.ts`), `Text` for captions, `Slot` for `Item asChild`.
- `useControllableState`, `useCalmMotion`, `cn`, `tv`.
- Prior art, not imports: `tabs-pager.tsx`, `tabs.variants.ts` (`resolvePanOrigin`, `resolvePanPosition`, `resolveReconcileMode`). Maths that both Carousel and ImageViewer need is lifted into a new leaf **`src/lib/paging.ts`** (see File map) instead of Carousel importing Tabs' or ImageViewer importing Carousel's.

## New peer deps

None. Gesture Handler, Reanimated, Worklets, Pulsar are already peers. Alternatives rejected: `react-native-reanimated-carousel` / `pager-view` (a native module outside the SDK catalog — root AGENTS "Dependency versions"; and no per-slide transform control).

## Cross-category dependencies

- **Navigation / Pagination**: not imported. `Carousel.Dots` is a minimal internal indicator (one file, ~60 lines, driven by `position`). If Pagination later lands it can wrap or replace `Dots`; not a v1 concern.
- **Media**: no `Image` component is required — slides are caller-supplied children. A Media `Image` would simply be a child.
- **Overlays**: none.

## Pure logic to unit-test

Written first. Shared maths in `src/lib/paging.test.ts`; component specifics in `carousel.variants.test.ts`.

`lib/paging.ts`:
- `resolveWrappedOffset(i, position, count)`: (0, 0.2, 5) -> -0.2; (4, 0.2, 5) -> -1.2; (1, 4.5, 5) -> 1.5; (2, 2, 5) -> 0; count 1 -> 0.
- `resolveIndexFromPosition(position, count, loop)`: (4.6, 5, true) -> 0; (-0.4, 5, true) -> 0; (-0.6, 5, true) -> 4; (4.6, 5, false) -> 4; (-0.6, 5, false) -> 0; count 0 -> 0.
- `resolveRubberBand(overscroll)`: (0) -> 0; (0.5) ~= 0.316; monotonic; always < input; (1000) <= 0.5.
- `resolvePanPosition({ start, translation, pitch, count, loop })`: (2, -100, 200, 5, true) -> 2.5; (2, +100, ...) -> 1.5; (0, +100, 200, 5, false) -> -rubber(0.5) ~= -0.316; (4, -100, 200, 5, false) -> 4 + 0.316; pitch 0 -> start (no divide by zero).
- `resolveSettleTarget({ position, startIndex, velocity, pitch, count, loop })` (velocity in pt/s, sign = pointer direction): drag 30 % left (position 0.3 from 0, v -100) -> 1; drag 10 % left, v -50 -> 0; drag 10 % left, v -600 -> 1; v -3000 from 0 -> 1 (never 2); loop at count-1 moving forward -> `count` (caller wraps; test that target may equal `count` in loop and is clamped to `count-1` when not loop); count 0 -> 0.
- `resolveVisibleRange(index, count, loop, windowSize)`: (0, 10, true, 1) -> [9, 0, 1]; (0, 10, false, 1) -> [0, 1]; (5, 10, false, 2) -> [3..7]; count <= 2*window+1 -> all.

`carousel.variants.ts`:
- `resolveItemPitch(viewport, itemSize, gap)`: (360, undefined, 12) -> 372 (a full slide plus gap, so neighbours are off-screen); (360, 300, 12) -> 312; itemSize > viewport -> clamped to viewport; viewport 0 -> 0.
- `resolveItemSize(viewport, itemSize)`: (360, undefined) -> 360; (360, 300) -> 300; (360, 500) -> 360.
- `resolveItemInset(viewport, itemSize)`: (360, 300) -> 30; (360, undefined) -> 0; (360, 360) -> 0.
- `resolveCoverflow(offset)`: 0 -> scale 1, opacity 1, rotate 0; 1 -> scale 0.85, rotate -35 (right-hand slide faces left), opacity 0.75; 2 and beyond -> clamped at the floors (scale 0.85, opacity 0.5, rotate ±35); 0.5 -> halfway between the two; symmetric (f(-x) mirrors rotation, equal scale/opacity); calm flag returns the identity transform.
- `resolveDotsWindow(count, active, max)`: (5, 2, 7) -> {0,5}; (10, 0, 5) -> {0,5}; (10, 9, 5) -> {5,10}; (10, 5, 5) -> {3,8}; (0,*,*) -> {0,0}.
- `resolveCaptionOpacity(offset)`: 0 -> 1; 0.25 -> 0.75; >=1 -> 0; -0.5 -> 0.5.
- `resolveAutoplayNext(index, count, loop)`: (2, 5, true) -> {next: 3, stop: false}; (4, 5, true) -> {next: 0, stop: false}; (4, 5, false) -> {next: 4, stop: true}; count <= 1 -> stop.
- `resolveAutoplayEnabled({ autoplay, isCalm, isScreenReader, isDisabled, count })`: only true when autoplay && !isCalm && !isScreenReader && !isDisabled && count > 1.
- `resolveCarouselA11yValue(index, count)`: (1, 5) -> "2 of 5"; (0, 0) -> "".
- `resolveNavigationState(index, count, loop)`: (0, 5, false) -> prev false/next true; (4, 5, false) -> prev true/next false; loop -> both true when count > 1; count 1 -> both false.
- Every class token in the `tv()` slots exists in both themes (copy `bottom-sheet.variants.test.ts`'s pattern); no `self-*`, no `dark:`, no raw palette colour.

## File map

All under `packages/react-native-ui/src/components/carousel/` unless noted.

- `index.ts` — root, `useCarousel`, prop types, `carouselVariants`, constants
- `carousel.tsx` — root, `Object.assign`, state, children walk for nothing (counts via Content)
- `carousel-content.tsx` — viewport, Item walk, count publish (layout effect), the pan
- `carousel-item.tsx` — absolutely positioned slide, per-slide animated style
- `carousel-caption.tsx`, `carousel-dots.tsx`, `carousel-previous.tsx`, `carousel-next.tsx`, `carousel-controls.tsx`
- `carousel.context.tsx` — three contexts split by rate of change (static options / index+actions / motion values), hooks `useCarousel`, `useCarouselPart(name)`
- `carousel.types.ts` — props shared by 2+ parts (`CarouselSlotProps`)
- `carousel.variants.ts` + `carousel.variants.test.ts`
- `use-carousel-autoplay.ts`
- `AGENTS.md` — design decisions, file map (Tabs-style)
- `packages/react-native-ui/src/lib/paging.ts` + `paging.test.ts` — shared pure paging maths (LAYOUT-05 consumes it; LAYOUT-01 lands first)
- Edits: `packages/react-native-ui/AGENTS.md` Components table row + `lib/` list; `package.json` `exports` via `bun run gen-exports`; `packages/cli/src/registry/config.ts`; `.changeset/add-carousel.md`.

## Playground demo

`apps/playground/src/demos/carousel/` (barrel `index.ts` ordered; `bun run gen-demos`). Images are seeded remote (`https://picsum.photos/seed/<name>/800/600`) so captures are repeatable.

1. `hero-track` — full-width slides, dots, `capture: { flow: "carousel/hero-track", hero: true }`
2. `peek` — `itemSize` 280, centred active, neighbours visible (capture)
3. `coverflow` — album covers (capture)
4. `controls` — arrows + dots + caption row (capture)
5. `vertical` — a story-like vertical track (capture)
6. `loop-autoplay` — loop + autoplay (not captured: motion that never settles; `isMotionCalm` disables it anyway)
7. `controlled` — external buttons driving `index` (not captured)

Every demo uses only `@delacour/react-native-ui/*`, `react`, `react-native`; `testID` on the root, items (`carousel-item-<n>`), arrows and dots for flows. Route `apps/playground/src/app/(components)/carousel.tsx` (six-line `DemoGallery`), row in the `ListGroup` in `src/app/index.tsx` with a Central glyph in its icon map. Previews via `bun run previews`.

## Docs page

`apps/web/content/docs/native/components/carousel.mdx`: frontmatter (`title`, `description`, `icon`); `<Preview id="carousel/hero-track" title={null} />`; Installation (`<ComponentInstall name="carousel" />`); Usage; Peek and centring; Looping; Orientation; Coverflow; Autoplay (what stops it, a11y note); Controls and dots; Controlled; Inside a scroll view; API tables per part; `useCarousel`; Accessibility.

Registry: `ITEM_META.carousel = { title: "Carousel", description: "Swipeable slides on one fractional position, with peek, loop, vertical and coverflow layouts, dots and arrows.", categories: ["layout"] }`. `PACKAGE_INSTALL`: nothing new (every import is already classified). Then `bun --filter delacour run registry:build`, commit `registry/`; run `verify:expo`.

## Changeset

`@delacour/react-native-ui`: minor — "Add Carousel: swipeable slides with peek, loop, vertical, coverflow, autoplay, dots and arrows."

## Out of scope

- `stack` (deck) and `interactive` (fan) layouts — follow-ups once the transform seam in `resolve*` is proven by `coverflow`.
- Virtualised `data`/`renderItem`, infinite feeds.
- Tappable dots, thumbnails strip.
- Fullscreen/zoom (ImageViewer), image loading/caching (the caller's `Image`).
- Imperative ref API (the `useCarousel()` hook is the surface).
- Snap-to-arbitrary-offset free scrolling; momentum across multiple slides.

## Acceptance checklist

- [ ] `lib/paging.test.ts` and `carousel.variants.test.ts` written first, failing, then passing (`bun test packages/react-native-ui/src/components/carousel packages/react-native-ui/src/lib/paging.test.ts`)
- [ ] `bun run typecheck`, `bun run check` clean; no `any`; no comments in JSX
- [ ] Every component and part has `DelacourUI.Carousel[.Part]` displayName (`display-name.test.ts`)
- [ ] `carousel/AGENTS.md` written; Components table row added (`docs.test.ts`)
- [ ] `bun run gen-exports` run; `exports` map includes `./carousel` and `./lib/paging`
- [ ] `bun run gen-demos`; 4-6 demos marked `capture`, one `hero`; route + home-list row; `bun test` demo check passes
- [ ] Docs page + `ITEM_META` entry; `registry:build` committed; `verify:expo` passes
- [ ] Changeset committed
- [ ] Simulator (agent-device, device leased via `warden claim ios`): swipe moves exactly one slide for a hard flick; peek centres the active slide; loop wraps both directions with no jump; releasing mid-drag never freezes between slides (swipe, then scroll the page before the spring ends); rubber band at ends when not looping; carousel inside `Screen.ScrollArea` scrolls the page vertically while swiping sideways; `Pressable` inside a slide still taps
- [ ] Autoplay stops after the first touch; does not run with Reduce Motion on or VoiceOver on
- [ ] VoiceOver: adjustable swipe changes slide and announces "n of m"; arrows' disabled state announced
- [ ] Release build (not just dev): no stale-index or frozen-spring regressions (the Accordion Release-build bug is the warning)
