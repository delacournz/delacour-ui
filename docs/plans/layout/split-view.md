# SplitView

Two stacked panes with a grip between them that settles on one of a few named heights, flung there by the release velocity.

Plan ID: LAYOUT-12
Folder: `packages/react-native-ui/src/components/split-view`
Import: `@delacour/react-native-ui/split-view`
Build order: **second**. Depends on LAYOUT-13 (`Splitter`) for one leaf file, `splitter/splitter.math.ts`. Do not start until that merges.

## Purpose on mobile

The in-flow, snap-to-stops layout for a screen with a primary region and a secondary one that the user wants bigger or smaller in steps: a map above a list of results, a camera preview above a form, a document above its comments, a chart above its table. Stops are named by the app (`[0.3, 0.6, 1]`), so the layout is always one the designer intended and never a sliver.

Deliberately not:
- Not `BottomSheet`. A sheet floats over the app, dismisses, and owns a backdrop and keyboard handling. A SplitView is part of the screen's layout; both panes are always on screen, nothing is dismissed.
- Not `Splitter`. No free resize, no horizontal axis, no third pane (see the table below).
- Not an adaptive master-detail container. It does **not** switch to side-by-side on tablets or push a screen on phones; a width-driven layout switch is a navigation decision and belongs to the Navigation category. An app that wants it composes `useWindowDimensions` and renders `Splitter` (horizontal) on wide screens and `SplitView` on narrow ones. Say so in the docs page.
- Not a scroll container. Each pane takes any content; scrollables inside a pane are the caller's.

### Decision: why two components and not one

The two share a gesture and an idea but diverge in every observable behaviour: release (continuous vs snapped and flung), pane count (N vs 2), axis (both vs vertical), unit (percent vs fraction-or-points), and handle anatomy (a seam over the shared edge vs a drag row with its own height). Forcing one API to cover both would mean a `snapPoints` prop that is meaningless for three panes and a `layout` prop meaningless when snapped. So: two public components, **one owner of shared maths** (`splitter.math.ts`), no shared components.

| | SplitView (this) | Splitter (LAYOUT-13) |
| --- | --- | --- |
| Panes | exactly 2 | 2..N |
| Axis | vertical | horizontal or vertical |
| Release | named snap point, velocity-projected | stays where released, rounded to `step` |
| Controlled value | `snapIndex` | `layout` |
| Handle | `DragArea` row holding a grip, takes layout room | seam over the shared edge, takes none |

## API

```ts
export type SplitViewVariant = "panes" | "seam";

/** A stop for the top pane's height. `<= 1` is a fraction of the box; `> 1` is points. */
export type SplitViewSnapPoint = number;

export type SplitViewProps = Omit<ViewProps, "children" | "style"> & {
	/** Stops for the top pane, in any order (sorted internally, deduped). Default `[0.35, 0.65, 1]`. Length >= 2. */
	snapPoints?: readonly SplitViewSnapPoint[];
	/** Controlled index into the *sorted* `snapPoints`. */
	snapIndex?: number;
	/** Initial index when uncontrolled. Default: the middle stop. */
	defaultSnapIndex?: number;
	/** Fires when the settle target changes (on release, on assistive action, on tap of the grip). */
	onSnapIndexChange?: (index: number) => void;
	/** Floor for the top pane, points. Stops below it are lifted to it. Default 0. */
	minTopHeight?: number;
	/** Floor for the bottom pane, points. Stops that would crush it are lowered. Default 0. */
	minBottomHeight?: number;
	/** `panes`: two rounded surfaces with a gap holding the drag row. `seam`: flush panes joined by a hairline grip, for use inside a `Card` or sheet. */
	variant?: SplitViewVariant; // "panes"
	isDisabled?: boolean;
	/** Haptic when the settle target changes. `false` is silent. */
	haptic?: false | HapticFeedback; // "selection"
	className?: string;
	/** Exactly: `SplitView.Top`, `SplitView.DragArea`, `SplitView.Bottom`, in that order. */
	children: ReactNode;
};

export type SplitViewPaneProps = Omit<ViewProps, "style"> & { className?: string };

export type SplitViewDragAreaProps = Omit<ViewProps, "style"> & {
	/** Default "Resize panes". */
	accessibilityLabel?: string;
	/** Default: a `SplitView.Handle`. Pass your own grip or nothing-but-a-label. */
	children?: ReactNode;
	className?: string;
};

export type SplitViewHandleProps = Omit<ViewProps, "children" | "style"> & { className?: string };

export type SplitViewContextValue = {
	snapIndex: number;
	snapCount: number;
	variant: SplitViewVariant;
	isDisabled: boolean;
	/** Animate to stop `index`, clamped to range. */
	snapTo: (index: number) => void;
};

export function useSplitView(): SplitViewContextValue; // throws outside a root
```

```tsx
import { SplitView } from "@delacour/react-native-ui/split-view";

<SplitView className="flex-1" snapPoints={[0.3, 0.6, 1]} defaultSnapIndex={1}>
	<SplitView.Top>
		<ResultsMap />
	</SplitView.Top>
	<SplitView.DragArea />
	<SplitView.Bottom>
		<ResultsList />
	</SplitView.Bottom>
</SplitView>;
```

Mount order is enforced the same way as `Splitter`: the root maps `Children.toArray` and warns in development on any other shape. `SplitView.DragArea` with no children renders a `SplitView.Handle` itself, so the minimal usage above is complete.

## Variants & sizes

`split-view.variants.ts`, one slotted `tv()` (`splitViewVariants`):

| Slot | `variant="panes"` | `variant="seam"` |
| --- | --- | --- |
| `root` | `flex-col` | `flex-col` |
| `top` / `bottom` | `overflow-hidden rounded-lg border border-border bg-card border-continuous` | `overflow-hidden` |
| `dragArea` (height fixed 44pt, full width; owns the gesture) | `items-center justify-center` | `items-center justify-center`, plus a 1pt `bg-border` rule behind the grip |
| `handle` (the capsule) | `h-1 w-10 rounded-full bg-muted-foreground`; active `bg-foreground` | same |

The drag row is part of layout in both variants: 44pt is the touch target and is not a size axis. No `size` or `color` axis; the grip is chrome, not an accent. Default `variant="panes"`.

Tokens: semantic only (`border`, `card`, `muted-foreground`, `foreground`). **No new tokens**, so no `tokens.css`, `tokens.ts` or `theme.css` edits. Corner is `rounded-lg`.

## States

- **Controlled / uncontrolled**: `useControllableState<number>({ value: snapIndex, defaultValue, onChange: onSnapIndexChange })`. A controlled change animates to the new stop; an uncontrolled settle sets state. The live height is a shared value; React state holds only the index.
- **Disabled**: pan `enabled(false)`, handle `opacity-50`, `accessibilityState.disabled`, no actions registered.
- **Constraint clash** (`minTopHeight + minBottomHeight` above the box): every stop collapses to the feasible range; if empty, the root renders both panes at 50/50 and warns once in dev.
- **Box not yet measured**: both panes render at `flex: 1` so nothing flashes at a garbage height; the top height is applied after the first `onLayout`.
- **Invalid `snapIndex`**: clamped; dev warning.
- No loading or empty state.

## Accessibility

- `SplitView.DragArea`: `accessible`, `accessibilityRole="adjustable"`, `accessibilityLabel` (default "Resize panes"), `accessibilityValue={{ min: 0, max: snapCount - 1, now: snapIndex, text: "Position 2 of 3" }}`.
- `accessibilityActions`: `increment` (next larger top pane), `decrement` (next smaller). Disabled at the ends so the action list never offers a no-op.
- A plain tap on the grip with no drag cycles to the next stop (wrapping), for users who cannot drag but also do not use an assistive technology. It fires the same haptic and `onSnapIndexChange`.
- On a settle that changes the index, announce via `AccessibilityInfo.announceForAccessibility("Position 2 of 3")` only when a screen reader is on and the change came from an action (VoiceOver already reads the adjustable value for swipe changes; this avoids a double read).
- Panes are layout, no role. Reading order: top, drag area, bottom.
- Reduce motion (`useReducedMotion()`): drag still tracks (it is behaviour); the post-release settle and `snapTo` use `withTiming` duration 0 so the pane jumps to the stop.

## Motion

- Top height is one `useSharedValue<number>` in points. The top pane runs `useAnimatedStyle(() => ({ height: top.value }))`; the bottom pane is `flex: 1`, so it can never disagree with the top, and the drag row sits between them in flow.
- Box height is measured once (`onLayout` on the root) into `extent`. Resolved stop heights are a `useDerivedValue` over `extent` and `snapPoints`: `resolveSnapHeights` output (points).
- Pan on the drag area: `Gesture.Pan().minDistance(0).shouldCancelWhenOutside(false)`. `onBegin` records `start = top.value`; `onUpdate` sets `top.value = clamp(start + translationY, lowest, highest)` with a slight rubber band beyond the extremes (`rubberBand`, in the math leaf); `onEnd` computes the target with `projectSnap` from `velocityY` and runs `withSpring(stop, { velocity: velocityY, damping: 28, stiffness: 260, mass: 0.9 })`, then `scheduleOnRN(commit, index)`.
- Haptic fires on the UI thread when the *projected* target changes mid-drag (once per change, so a fling across three stops buzzes at most on landing), via `playHaptic` from `../pressable/pressable`.
- Content of a pane that contains a `ScrollView` is unaffected: the gesture lives only on the 44pt drag row.
- Orientation change: stops are fractions or points, resolved against the new extent; the pane re-settles to the same `snapIndex` without animating (no `withSpring` on an extent change).

## Reuses

- `splitter/splitter.math.ts` (leaf import, `../splitter/splitter.math`): `clamp`, `nearestSnapIndex` and `projectSnap` only. Everything SplitView needs that is generic lives there; anything SplitView-only (`resolveSnapHeights`, `rubberBand`, `sortSnapPoints`) is in `split-view.variants.ts` or a `split-view.math.ts` and is **not** moved into Splitter unless Splitter also needs it.
- `Pressable`'s `playHaptic` / `HapticFeedback`.
- `useControllableState`, `tv` from `lib/tv`, `cn`.
- Gesture Handler, Reanimated, worklets (existing peers).
- Prior art: `Slider.Track` for the pan recipe and `Slider.Thumb` for adjustable semantics. Not `BottomSheet`'s engine: its snap points track a sheet over content with backdrop and keyboard logic; reusing it would drag in `react-native-teleport`.
- Not reused: `Splitter.Handle`. The anatomy differs (a row with layout height vs an overlay on a seam); the two grips are 6 lines of `tv()` each and sharing a component would force a cross-folder component import for no benefit.

## New peer deps

None. All imports are already classified in `PACKAGE_INSTALL`. Nothing imports an Expo package, so nothing goes in `src/expo/`.

## Cross-category dependencies

- **None from other categories.**
- **Intra-category**: `splitter/splitter.math.ts` from LAYOUT-13. Only after that PR merges to `develop`; if LAYOUT-12 must start earlier, build with a local `split-view.math.ts` that has the same three function signatures, then swap the import in the follow-up and delete the copy (the tests move with it).
- Registry: the CLI derives item dependencies from imports, so `delacour add split-view` pulls `splitter` for the one math file. Check `registry:build` output shows the edge; if the registry copies the whole `splitter` item for one leaf, accept it (documented) rather than duplicating.

## Pure logic to unit-test

Generic functions are tested in `splitter.math.test.ts` (LAYOUT-13); SplitView adds the following in `split-view.variants.ts` and tests them in `split-view.variants.test.ts`. Write first.

`sortSnapPoints(points)`
- `[1, 0.3, 0.6]` → `[0.3, 0.6, 1]`; `[0.5, 0.5, 1]` → `[0.5, 1]` (dedupe); `[]` or `[0.5]` → throws a typed error value (return `Result` from `@delacour/types`) with a message naming the minimum of 2; `NaN` and negatives are dropped.

`resolveSnapHeights({ points, extent, minTop, minBottom, dragAreaHeight })` → points
- `([0.3, 0.6, 1], 800, 0, 0, 44)` → usable = 756 → `[227, 454, 756]` (rounded to integers).
- `([200, 400], 800, 0, 0, 44)` → `[200, 400]` (> 1 means points).
- `([0, 1], 800, 100, 100, 44)` → `[100, 656]` (min top lifts 0; min bottom caps 1).
- Fraction `1` with `minBottom 100` → `656`, never crushing the bottom.
- Infeasible (`minTop + minBottom > usable`) → every height equals `usable / 2`.
- Stops that collapse to equal heights are kept (the index map must not shift); resolving twice is idempotent.

`resolveInitialSnapIndex({ count, defaultIndex })`
- `(3, undefined)` → `1`; `(4, undefined)` → `2`; `(3, 7)` → `2`; `(3, -1)` → `0`.

`rubberBand(overshoot, extent)` (monotonic, bounded)
- `(0, 800)` → `0`; `rubberBand(x) < x` for `x > 0`; strictly increasing; `rubberBand(1e6, 800) < 800 * 0.5`.

`resolveNextIndex({ index, direction, count, wrap })`
- `(1, +1, 3, false)` → `2`; `(2, +1, 3, false)` → `2`; `(2, +1, 3, true)` → `0`; `(0, -1, 3, true)` → `2`.

`resolveSnapAccessibility({ index, count })`
- `(1, 3)` → `{ min: 0, max: 2, now: 1, text: "Position 2 of 3", canIncrement: true, canDecrement: true }`; `(0, 3)` → `canDecrement: false`; `(2, 3)` → `canIncrement: false`.

`splitViewVariants` class assertions: `panes` surfaces carry `rounded-lg`, `border-continuous`, no shadow; `seam` panes carry no border or fill; drag row is `h-11` in both; no `size-*` or raw palette colours; every token named exists in both variants of `theme.css`.

## File map

```
packages/react-native-ui/src/components/split-view/
  index.ts                     → @delacour/react-native-ui/split-view
  split-view.tsx               Root + Object.assign (Top, DragArea, Bottom, Handle); displayName in the assign
  split-view-top.tsx           SplitView.Top (animated height)
  split-view-bottom.tsx        SplitView.Bottom (flex 1)
  split-view-drag-area.tsx     SplitView.DragArea (pan, tap-to-cycle, a11y surface)
  split-view-handle.tsx        SplitView.Handle (the grip capsule)
  split-view.context.tsx       SplitViewContext, useSplitView(), useSplitViewPart()
  split-view.types.ts          SplitViewSlotProps
  split-view.variants.ts       tv() + the pure resolvers above
  split-view.variants.test.ts
  AGENTS.md
```

Top and Bottom get a file each: `Top` reads context for its animated height, so the pure-preset carve-out does not apply.

Also: Components table row in `packages/react-native-ui/AGENTS.md`; `bun run gen-exports`.

## Playground demo

`apps/playground/src/demos/split-view/` with `index.ts` (`splitViewDemos` via `defineDemoGroup`):

1. `anatomy.tsx` (**hero**, capture): `panes` variant, three stops, top pane a colour block, bottom a short list.
2. `seam.tsx` (capture): `variant="seam"` inside a `Card`.
3. `snap-points.tsx` (capture): points mixed with fractions (`[120, 0.5, 1]`) to show both units.
4. `controlled.tsx` (capture): external `Button`s calling `useSplitView().snapTo` and a readout of `snapIndex`.
5. `scrolling-panes.tsx` (capture): a `Screen.ScrollArea` list in the bottom pane, proving the drag row wins.
6. `accessible-names.tsx`: not captured.
7. `disabled.tsx`: not captured.

`testID` on the drag area (`drag-area`) and on each pane. Route: `apps/playground/src/app/(components)/split-view.tsx` (six-line `DemoGallery` shell, title "SplitView"). Home row in `apps/playground/src/app/index.tsx` with a Central icon (candidate `IconLayoutTopBottom` is already used by `screen`, so use a different glyph: check `icons/central` for a top-over-bottom split variant; `IconLayoutBottomFull` is exported today). Run `bun run gen-demos`.

## Docs page

`apps/web/content/docs/native/components/split-view.mdx`. Outline: hero preview; Installation (`<ComponentInstall name="split-view" />`); Usage; Snap points (fractions vs points); Variants (`panes`, `seam`); Controlled index and `snapTo`; Scrolling content in panes; Accessibility (adjustable, tap cycles); "SplitView, Splitter or BottomSheet" decision table; "Tablets and landscape" recipe composing `useWindowDimensions` with `Splitter`; API tables for root, Top, DragArea, Bottom, Handle, `useSplitView`. Add to `meta.json`.

Registry `ITEM_META`:
```ts
"split-view": {
	title: "SplitView",
	description: "Two stacked panes with a grip that settles on named heights.",
	categories: ["layout"],
},
```
`PACKAGE_INSTALL`: no new import. Run `bun --filter delacour run registry:build`, commit `registry/`, run `verify:expo`.

## Changeset

`.changeset/add-split-view.md`: `"@delacour/react-native-ui": minor` and `"delacour": minor`: "Add `SplitView`, two stacked panes with a drag row that settles on named snap points."

## Out of scope

- Horizontal split, three or more panes (`Splitter`).
- Width-adaptive master-detail and push navigation (Navigation).
- Overlaying content, backdrops or dismissal (`BottomSheet`).
- Persisting the chosen stop.
- Dragging the panes' content (only the drag row is a handle).
- Animated pane content reflow beyond a height change.

## Implementation notes

- **Stacked on `layout-splitter`** (branch `feature/layout-splitter`) rather than waiting for it to merge; imports only `../splitter/splitter.math` (`clamp`, `projectSnap`). `nearestSnapIndex` is not needed directly — `projectSnap` calls it.
- **`Result` is restated, not imported.** `@delacour/types` is private to the monorepo and this folder is copied into consumers' repos and published to npm, so `sortSnapPoints` returns a local `SplitViewResult` of the same shape.
- **Indices are ordered by resolved height.** `resolveSnapHeights` sorts its output, because mixed units (`[120, 0.5, 1]`) only have an order once the box is known. With one unit this equals the sorted `snapPoints`.
- **Projection uses UIScrollView's `fast` deceleration (0.99)**, not the leaf's `normal` default, which turned every lazy release into a skip.
- **Announcement**: activate (VoiceOver double tap = tap-to-cycle) announces "Position N of M" when a screen reader is on; increment/decrement do not, since VoiceOver reads the adjustable value itself.
- **Tap and pan share a 6pt slop** (`SPLIT_VIEW_TAP_SLOP`) so one touch is a tap or a drag, never both.
- **Demos**: `scrolling-panes` uses Gesture Handler's `ScrollView`; `Screen.ScrollArea` pads for screen insets a pane does not have. Home-row icon is `IconLayoutAlignTopBottom` (`IconLayoutBottomFull` is `bottom-sheet`'s).
- **Previews: deferred**, as for Splitter — the capture tool is not installed, so no demo carries `capture` and the docs page has no `<Preview>`.
- **Simulator**: checked 2026-10-05; see the component AGENTS.md. Rotation, Reduce Motion, haptics and VoiceOver actions not checked.

## Acceptance checklist

- [ ] LAYOUT-13 merged; `split-view` imports only `../splitter/splitter.math`, never `../splitter`.
- [ ] `split-view.variants.test.ts` written first, failing, then passing (`bun test packages/react-native-ui/src/components/split-view`).
- [ ] `bun run typecheck` and `bun run check` clean; no `any`; no comments inside JSX; `Result` from `@delacour/types` used for the bad-`snapPoints` case.
- [ ] Every component has a `DelacourUI.SplitView...` displayName; `display-name.test.ts` passes.
- [ ] `AGENTS.md` written (including the SplitView vs Splitter vs BottomSheet decision); Components table row added; `docs.test.ts` passes.
- [ ] `bun run gen-exports` run; `exports` contains `./split-view`.
- [ ] Demos listed, `bun run gen-demos` run, route and home row added; 4 to 6 captured, one `hero`.
- [ ] Docs page, `meta.json`, `ITEM_META`, `registry:build` and `verify:expo` done; `registry/` committed.
- [ ] Changeset committed.
- [ ] Simulator (agent-device, device leased via `warden claim ios`): a slow drag follows the finger and settles on the nearest stop; a fast flick skips a stop; a selection haptic fires on the stop change; rotating keeps `snapIndex`; the drag area reads as adjustable with "Position 2 of 3" and `increment` moves a stop; tapping the grip cycles; scrolling the bottom list never moves the divider; Reduce Motion on makes release jump with no spring.
