# Splitter

Two or more panes in one box, with a draggable handle on every seam. Sizes are percentages, so a layout dragged in portrait is the same layout in landscape.

Plan ID: LAYOUT-13
Folder: `packages/react-native-ui/src/components/splitter`
Import: `@delacour/react-native-ui/splitter`
Build order: **first** of the pair. `SplitView` (LAYOUT-12) imports this folder's pure maths leaf, so LAYOUT-13 merges before LAYOUT-12 starts.

## Purpose on mobile

The resizable-region primitive. Use it where the user decides how much room each of several regions gets and the answer is continuous: an editor above a preview, a file list beside a detail pane on a tablet or foldable, a three-column inspector in landscape, a chat transcript above a composer tray.

It is the **general engine**; `SplitView` is the opinionated two-pane, snap-only variant of the same idea (see "How it differs from SplitView").

Deliberately not:
- Not a router or navigation container. It never swaps screens by width; that is the Navigation category's job.
- Not a bottom sheet. `BottomSheet` floats over the app and dismisses; a splitter is in-flow and permanent.
- Not a scroll container. Panes are plain boxes. Put a `Screen.ScrollArea` or list inside one.
- No snap points. A seam stops where the finger lets go (optionally rounded to `step`). Named stops are `SplitView`.

## How it differs from SplitView

| | Splitter (this) | SplitView (LAYOUT-12) |
| --- | --- | --- |
| Panes | 2..N | exactly 2 |
| Axis | `horizontal` or `vertical` | vertical stack only (top, bottom) |
| Unit | percent of the box | fraction or points of the box height |
| Release | stops where released, rounded to `step` | settles on a named snap point, flung by velocity |
| Handle | a seam drawn over the shared edge, takes no layout room | a drag area with its own row, holds a grip |
| Collapse | per-pane `collapsible` | by snapping to a point with fraction 0 or 1 |
| Typical use | tablet columns, editor/preview | map over list, preview over form |

Shared code: exactly one folder owns it. **`splitter/splitter.math.ts` owns all shared pure maths** (clamping, step rounding, nearest/velocity snap, percent/fraction conversion). `SplitView` imports that file as a leaf (`../splitter/splitter.math`, allowed by root rule 3: leaf modules only, never `../splitter`). It has no React Native imports and every function carries a `"worklet"` directive, so both components call it from the UI thread. `SplitView` must not copy any of it.

## API

```ts
export type SplitterOrientation = "horizontal" | "vertical";
export type SplitterVariant = "seam" | "panes";

/** Percent of the box, 0..100. The layout is one number per pane and sums to 100. */
export type SplitterLayout = number[];

export type SplitterProps = Omit<ViewProps, "children" | "style"> & {
	/** `horizontal` lays panes side by side and drags along x; `vertical` stacks them and drags along y. */
	orientation?: SplitterOrientation; // "horizontal"
	/** Controlled layout. Length must equal the pane count. */
	layout?: SplitterLayout;
	/** Initial layout when uncontrolled. Defaults to each pane's `defaultSize`, the rest shared equally. */
	defaultLayout?: SplitterLayout;
	/** Fires once when a drag, a keyboard step or a reset settles. Never per frame. */
	onLayoutChange?: (layout: SplitterLayout) => void;
	/** `seam` is a hairline between flush panes; `panes` gives each pane a rounded surface with a gap. */
	variant?: SplitterVariant; // "seam"
	/** Freezes every handle. A handle's own `isDisabled` freezes one seam. */
	isDisabled?: boolean;
	/** What one assistive increment moves a seam by, and what a drag rounds to. Percent. */
	step?: number; // 5, must be > 0 and <= 50
	/** Haptic when a seam meets a pane's min/max or collapses. Off with `false`. */
	haptic?: false | HapticFeedback; // "light"
	className?: string;
	/** Alternating `Splitter.Pane` and `Splitter.Handle`, starting and ending with a pane. */
	children: ReactNode;
};

export type SplitterPaneProps = Omit<ViewProps, "style"> & {
	/** Share of the box when no layout is given. Percent. */
	defaultSize?: number;
	/** Floor, percent. Default 0. */
	minSize?: number;
	/** Ceiling, percent. Default 100. */
	maxSize?: number;
	/** Past half of `minSize` the pane collapses to `collapsedSize` instead of stopping at `minSize`. */
	isCollapsible?: boolean;
	/** Size a collapsed pane holds. Percent. Default 0. */
	collapsedSize?: number;
	className?: string;
};

export type SplitterHandleProps = Omit<ViewProps, "children" | "style"> & {
	isDisabled?: boolean;
	/** Draw the grip capsule. A bare seam is still draggable. Default true. */
	withGrip?: boolean;
	/** Read before the value. Default "Resize". Say which panes: "Resize sidebar". */
	accessibilityLabel?: string;
	/** Cross-axis touch padding is fixed at 44pt total; this widens it along the axis. Default 0. */
	hitSlop?: number;
	className?: string;
};

export type SplitterContextValue = {
	orientation: SplitterOrientation;
	variant: SplitterVariant;
	isDisabled: boolean;
	/** One entry per pane, settled values (not the live shared value). */
	layout: SplitterLayout;
	/** Set a whole layout programmatically; clamped like a drag. */
	setLayout: (next: SplitterLayout) => void;
	/** Collapse or restore pane `index`. No-op when the pane is not collapsible. */
	togglePane: (index: number) => void;
	/** Back to `defaultLayout`. */
	reset: () => void;
};

export function useSplitter(): SplitterContextValue; // throws outside a root
```

The root reads each `Pane`'s constraints straight off `Children.toArray(children)` element props (pure data, no registration effect), wraps every child in a tiny index provider, and validates alternation in development (warn, never throw).

```tsx
import { Splitter } from "@delacour/react-native-ui/splitter";
import { Text } from "@delacour/react-native-ui/text";

<Splitter className="h-96" defaultLayout={[35, 65]} onLayoutChange={save}>
	<Splitter.Pane isCollapsible minSize={20} maxSize={50}>
		<Sidebar />
	</Splitter.Pane>
	<Splitter.Handle accessibilityLabel="Resize sidebar" />
	<Splitter.Pane minSize={40}>
		<Detail />
	</Splitter.Pane>
</Splitter>;
```

Root must be given a size by its parent (`flex-1` or a fixed height); the percentages need an extent.

## Variants & sizes

`splitter.variants.ts`, one slotted `tv()` (`splitterVariants`):

| Slot | `orientation` | `variant` |
| --- | --- | --- |
| `root` | `flex-row` / `flex-col` | `seam`: no gap; `panes`: `gap-2` |
| `pane` | none (flex comes from the animated style) | `seam`: `overflow-hidden`; `panes`: `rounded-lg border border-border bg-card overflow-hidden border-continuous` |
| `handle` (the 44pt touch box, absolutely positioned over the seam) | `w-11 h-full` / `h-11 w-full` | none |
| `line` (the visible 1pt rule, `seam` only) | `w-px h-full` / `h-px w-full` | `bg-border`; `panes` renders none |
| `grip` | `h-8 w-1` / `h-1 w-8` | `rounded-full bg-muted-foreground`; active `bg-foreground` (a state class, applied from a shared-value flag) |

No `size` axis: the touch box is fixed at 44pt (Apple HIG minimum), the grip is a fixed 4x32 capsule. A size axis would only let a caller build an untouchable handle. Default: `orientation="horizontal"`, `variant="seam"`.

Tokens: semantic only (`border`, `card`, `muted-foreground`, `foreground`). **No new tokens.** Corner is `rounded-lg` per the `--radius` card rule.

## States

- **Controlled / uncontrolled**: `useControllableState<SplitterLayout>({ value: layout, defaultValue, onChange: onLayoutChange })`. The live drag value is a `SharedValue<number[]>` seeded from the settled state; a controlled `layout` change writes into the shared value (with the settle animation) in an effect. `onLayoutChange` fires on gesture finalize, not per frame, so JS never round-trips during a drag.
- **Disabled**: root `isDisabled` or handle `isDisabled`: the pan is `enabled(false)`, the grip is `opacity-50`, `accessibilityState.disabled`.
- **Collapsed**: a collapsible pane at `collapsedSize` sets `accessibilityState.expanded=false` on its adjacent handle.
- **Invalid constraints** (mins sum above 100, length mismatch, non-finite): `resolveInitialLayout` falls back to equal shares and warns once in dev.
- No loading or empty state: panes own their content.

## Accessibility

- `Splitter.Handle`: `accessible`, `accessibilityRole="adjustable"`, `accessibilityLabel` (default "Resize"), `accessibilityValue={{ min: 0, max: 100, now: round(leadingPane), text: "35 percent" }}`. The value is the pane before the handle.
- `accessibilityActions`: `increment`, `decrement` (move the seam by `step`, via `resolveKeyboardStep`), `reset` ("Reset sizes"), and `collapse`/`expand` when an adjacent pane is collapsible. `onAccessibilityAction` calls the same JS setter the drag finalizer uses and fires `onLayoutChange`.
- Double-tap on a handle (a `Gesture.Tap().numberOfTaps(2)` composed `Exclusive` with the pan) calls `reset()`.
- Panes are layout, no role. Content order in the tree is pane, handle, pane, so a screen reader meets the handle between the regions it resizes.
- Reduce motion: dragging is behaviour and always tracks. The *settle* after a keyboard step, reset or collapse uses `withTiming(duration 0)` under `useReducedMotion()`, otherwise a short spring.
- Hardware keyboard (iPad, Android): handle is focusable; arrow keys map to increment/decrement. Verify RN `onKeyDown` availability on SDK 57 in the playground; if absent, scope to assistive actions only and note it in the AGENTS.md.

## Motion

- Pane sizes are one `useSharedValue<number[]>`. Each `Pane` runs `useAnimatedStyle(() => ({ flexGrow: sizes.value[i], flexBasis: 0, flexShrink: 1 }))`. Flex ratios do the percentage work on the UI thread; **no container measurement is needed to lay out panes**, only to convert a drag distance to a percent.
- `Splitter` measures its box once with `onLayout` into `extent: SharedValue<number>` (main-axis points). `Splitter.Handle` position is `left|top: cumulative(sizes, i)%`, also an animated style (percent strings are fine on both axes).
- `Handle` pan (`Gesture.Pan().minDistance(0).shouldCancelWhenOutside(false)`; same reasoning as Slider, so it wins a touch from a parent scroll): `onBegin` snapshots `start = sizes.value`; `onUpdate` computes `delta = translation / extent * 100`, calls `resolveDrag`, writes `sizes.value`; `onFinalize` rounds with `snapToStep`, writes the settled value, `scheduleOnRN(commit, layout)`.
- Edge haptic: a worklet tracks `wasClamped`; on the false-to-true edge, `playHaptic(haptic)` (imported from `../pressable/pressable`, the library's one haptic vocabulary). Never per frame while clamped.
- Active grip: a `isActive` shared value drives grip colour and a 1.0 to 1.25 scale on the cross axis with `withSpring`.
- Orientation change: percentages survive; only `extent` re-measures. No code path stores points.

## Reuses

- `Pressable`'s `playHaptic` / `HapticFeedback` (not `Pressable` itself: same reasons as `Slider`: its Tap and animated transform would fight the pan).
- `useControllableState`, `cn`, `tv` from `lib/tv`, `useThemeColor` (grip colour if animated).
- Gesture Handler + Reanimated + worklets (all existing peers).
- Pattern prior art: `Slider`'s `Track` (one pan, `minDistance(0)`, `onBegin` write, `onFinalize` report) and `Slider.Thumb` (adjustable role, increment/decrement actions, label from context).
- Not reused: `Surface` for `panes` (a pane needs `overflow-hidden` and a flex-grow animated style that Surface's API deliberately does not expose). Pane restates the same `rounded-lg border-border bg-card` classes; if `Surface` later grows a ref-forwarding animated escape hatch, switch.

## New peer deps

None. Alternative rejected: a third-party resizable-pane package (violates the no-third-party-kit rule and duplicates peers we already require).

## Cross-category dependencies

None. Standalone, no imports from Overlays, Navigation, Forms or Media. `Field` is deliberately not read (a splitter is not a form control).

## Pure logic to unit-test

All in `splitter.math.ts` (generic, shared with SplitView) plus `splitter.variants.ts` (tv + layout resolvers). Write these first.

`clamp(value, min, max)`
- `(5, 10, 20)` → `10`; `(15, 10, 20)` → `15`; `(25, 10, 20)` → `20`; `(NaN, 0, 1)` → `0`.

`snapToStep(value, step)`
- `(37, 5)` → `35`; `(38, 5)` → `40`; `(37.5, 5)` → `40` (half rounds up); `(12, 0)` → `12` (step 0 is identity).

`percentToFraction` / `fractionToPercent`
- `(35)` → `0.35`; round trip is identity within 1e-9.

`nearestSnapIndex(position, points)` (points ascending fractions)
- `(0.4, [0, 0.5, 1])` → `1`; `(0.24, [0, 0.5, 1])` → `0`; tie `(0.25, [0, 0.5, 1])` → `0` (lower wins, deterministic).

`projectSnap({ position, velocity, points, decelerationRate })` (velocity in fraction/s)
- Slow release near `0.5` with `velocity 0` → index of `0.5`.
- `position 0.45`, `velocity +2` (fast toward 1) → index of `1`, not `0.5`.
- Never returns an index outside `0..points.length-1`.

`resolveInitialLayout(constraints)`
- `[{}, {}]` → `[50, 50]`; `[{defaultSize: 30}, {}]` → `[30, 70]`; `[{defaultSize: 30}, {defaultSize: 30}, {}]` → `[30, 30, 40]`; defaults summing above 100 → equal shares; `[{minSize: 60}, {minSize: 60}]` → equal shares (infeasible).

`resolveDrag({ start, handleIndex, delta, constraints })` (moves the seam between pane `i` and `i+1`, others untouched, sum preserved)
- `start [50, 50]`, `delta +10` → `[60, 40]`.
- `start [50, 50]`, `delta +10`, pane 1 `minSize 45` → `[55, 45]` (neighbour floor wins).
- `start [50, 50]`, `delta -80`, pane 0 `minSize 20` → `[20, 80]`.
- Three panes `[30, 40, 30]`, `handleIndex 1`, `delta +20` → `[30, 60, 10]` with pane 2 `minSize 10`; pane 0 unchanged.
- Sum is `100` (within 1e-9) for every case above.
- Collapsible: pane 0 `{minSize 20, isCollapsible, collapsedSize 0}`, `start [30, 70]`, `delta -12` (18 < 20 but above 10) → `[20, 80]`; `delta -25` (5 < 10) → `[0, 100]`.
- `delta 0` → returns `start` values unchanged.

`resolveKeyboardStep({ layout, handleIndex, direction, step, constraints })`
- `[50, 50]`, `+1`, `5` → `[55, 45]`; at the ceiling stays put and returns the same layout.

`resolveCollapseToggle({ layout, index, constraints })`
- collapsible pane at 30 → `collapsedSize`, neighbour absorbs; collapsed pane → its `defaultSize` (or `minSize` when undefined).

`splitterVariants` (class assertions): `orientation` flips `flex-row`/`flex-col`; `panes` variant emits `rounded-lg` and `border-continuous` and no shadow in any cell; `seam` `line` slot exists, `panes` does not; handle touch box is 44pt cross axis in both orientations (assert via `h-11`/`w-11`); no `size-*` or raw palette colours anywhere in the matrix; every token named exists in both variants of `theme.css`.

## File map

```
packages/react-native-ui/src/components/splitter/
  index.ts                   → @delacour/react-native-ui/splitter (root, prop types, useSplitter, splitterVariants)
  splitter.tsx               Root + Object.assign (Pane, Handle) + displayName inside the assign
  splitter-pane.tsx          Splitter.Pane
  splitter-handle.tsx        Splitter.Handle (pan, tap-to-reset, a11y surface)
  splitter-grip.tsx          internal: animated grip capsule
  splitter.context.tsx       SplitterContext, SplitterIndexContext, useSplitter(), useSplitterPart()
  splitter.types.ts          SplitterSlotProps (shared by two or more parts)
  splitter.math.ts           shared pure maths, worklets, no RN imports (owned here, imported by SplitView)
  splitter.math.test.ts
  splitter.variants.ts       tv() + layout resolvers
  splitter.variants.test.ts
  AGENTS.md                  Design notes + file map
```

Also: row in the Components table of `packages/react-native-ui/AGENTS.md`; `bun run gen-exports`.

## Playground demo

`apps/playground/src/demos/splitter/` with `index.ts` (ordered `splitterDemos` via `defineDemoGroup`):

1. `anatomy.tsx` (**hero**, capture): two panes, seam variant, labelled panes, grip visible.
2. `panes.tsx` (capture): the `panes` variant with surfaces and gap.
3. `three-columns.tsx` (capture): three panes, two handles, landscape-friendly percentages.
4. `vertical.tsx` (capture): `orientation="vertical"`, editor over preview.
5. `collapsible.tsx` (capture): sidebar with `isCollapsible`, a `Button` calling `togglePane` through `useSplitter()`.
6. `controlled.tsx`: controlled `layout` with a readout; not captured.
7. `accessible-names.tsx`: adjustable labels; not captured.
8. `disabled.tsx`: not captured.

Every handle gets a `testID` (`handle-0`, `handle-1`); capture flows are `flow: "splitter/<id>"` files under `.argent` equivalents the repo already uses for slider. Demos import only from `@delacour/react-native-ui/*`, `react`, `react-native`.

Route: `apps/playground/src/app/(components)/splitter.tsx` (six-line `DemoGallery` shell, title "Splitter"). Home list: add a `splitter` row to the `ListGroup` in `apps/playground/src/app/index.tsx` with a Central icon (candidate `IconLayoutLeft`, already exported; confirm at build). Run `bun run gen-demos`.

## Docs page

`apps/web/content/docs/native/components/splitter.mdx`, frontmatter `title: Splitter`, `description`, `icon`. Outline: hero `<Preview id="splitter/anatomy" title={null} />`; Installation (`<ComponentInstall name="splitter" />`); Usage; Variants (seam, panes); Orientation; Three panes; Collapsible; Controlled layout; Accessibility (adjustable actions, reset gesture); API tables (Splitter, Splitter.Pane, Splitter.Handle, `useSplitter`); "Splitter or SplitView" comparison paragraph. Add to `meta.json`.

Registry `ITEM_META` in `packages/cli/src/registry/config.ts`:
```ts
splitter: {
	title: "Splitter",
	description: "Two or more panes divided by draggable handles, sized in percent.",
	categories: ["layout"],
},
```
`PACKAGE_INSTALL`: no new import (gesture-handler, reanimated, worklets already classified). Run `bun --filter delacour run registry:build` and commit `registry/`; run `verify:expo`.

## Changeset

`.changeset/add-splitter.md`: `"@delacour/react-native-ui": minor` and `"delacour": minor`: "Add `Splitter`, resizable panes divided by draggable, adjustable handles, sized in percent."

## Out of scope

- Snap points, flings and named heights (`SplitView`).
- Adaptive switching between side-by-side and stacked/pushed by window width (Navigation).
- Persisting layout (callers save `onLayoutChange` themselves).
- Nested-splitter gesture arbitration beyond "inner handle wins the touch".
- Pixel-based sizes (`minSize`/`maxSize` in points). Percent only; if needed later, add `minPoints` as a separate prop.
- A web/desktop pointer cursor.

## Acceptance checklist

- [ ] `splitter.math.test.ts` and `splitter.variants.test.ts` written first, failing, then passing (`bun test packages/react-native-ui/src/components/splitter`).
- [ ] `bun run typecheck` and `bun run check` clean; no `any`; no comments inside JSX.
- [ ] Every component and provider has a `DelacourUI.Splitter...` displayName; `display-name.test.ts` passes.
- [ ] `splitter.math.ts` has no React Native imports and every export is a worklet; SplitView imports only that leaf.
- [ ] `src/components/splitter/AGENTS.md` written; Components table row added; `docs.test.ts` passes.
- [ ] `bun run gen-exports` run; `exports` map contains `./splitter`.
- [ ] Demos listed in `index.ts`, `bun run gen-demos` run, route and home row added; 4 to 6 captured, one `hero`.
- [ ] Docs page added; `meta.json` updated; `ITEM_META` entry added; `registry:build` run and `registry/` committed; `verify:expo` passes.
- [ ] Changeset committed.
- [ ] Simulator (agent-device, device leased via `warden claim ios`): drag handle moves both panes with no dropped frames; seam stops at `minSize` and a haptic fires once; rotate to landscape keeps percentages; `snapshot -i` shows the handle as adjustable with a value; `increment` action moves it by `step`; double-tap resets; collapsible pane collapses past half of `minSize`; Reduce Motion on makes `togglePane` jump; handle inside a `Screen.ScrollArea` still wins the touch.
