# Compare — design spec

Two layers of one frame with a seam the finger drags across: before/after photos, light/dark
themes of one screen, a redesign against the original. Compound root plus `Compare.Before`,
`Compare.After`, `Compare.Handle` and `Compare.Label`. Folder `src/components/compare/`.

`import { Compare } from "@delacour/react-native-ui/compare";`

## 1. Purpose on mobile

- **A comparison is only legible if both halves stay in register.** The failure mode is the
  clipped layer being *squashed* (width animated on the content) instead of *revealed*. Both
  layers are therefore laid out at the full frame size and only a mask moves.
- **The seam is a drag target, not a tap target.** Phones put these inside feeds. A control that
  claims every touch on the image breaks vertical scrolling, so the default grab zone is the
  handle's 44pt band, and "scrub anywhere" is an opt-in with axis-aware activation offsets.
- **Slider semantics with a picture behind them.** The value is a position 0–1, it has an
  `adjustable` accessibility surface, it snaps, it ticks. It is `Slider`'s sibling in behaviour and
  deliberately not built on `Slider`: the track is the content, there is no groove, no fill.
- **Not a before/after *image* component.** It takes any `children` per side — images, a `Card`
  rendered in two themes, a map in two styles. The library has no `Image` primitive and this does
  not grow one.

## 2. Public API

```ts
export const COMPARE_ORIENTATIONS = ["horizontal", "vertical"] as const;
export type CompareOrientation = (typeof COMPARE_ORIENTATIONS)[number];

export const COMPARE_SIZES = ["sm", "md", "lg"] as const; // handle size
export type CompareSize = (typeof COMPARE_SIZES)[number];

export const COMPARE_COLORS = ["default", "primary", "success", "warning", "destructive", "info"] as const;
export type CompareColor = (typeof COMPARE_COLORS)[number]; // Slider's set

export type CompareGrab = "handle" | "anywhere";

export type ComparePosition = number; // 0..1, the fraction of the frame the Before layer covers, from the leading edge

export type CompareProps = {
  /** Controlled position. Omit for uncontrolled. */
  position?: ComparePosition;
  /** Starting position while uncontrolled. Default 0.5. */
  defaultPosition?: ComparePosition;
  /** Fires on every committed change during a drag, and on assistive/step changes. */
  onPositionChange?: (position: ComparePosition) => void;
  /** Fires once on release, after snapping. Where a network write belongs. */
  onPositionChangeEnd?: (position: ComparePosition) => void;
  orientation?: CompareOrientation; // default "horizontal"
  /** Where a drag may begin. Default "handle". */
  grab?: CompareGrab;
  /** Stops the seam can land on in 0..1; a release within `snapThreshold` of one lands on it. */
  snapPoints?: readonly ComparePosition[];
  /** In position units, default 0.04. Ignored without `snapPoints`. */
  snapThreshold?: number;
  /** Assistive increment/decrement size and `Compare` keyboard step. Default 0.1. */
  step?: number;
  /** The seam never leaves [minPosition, maxPosition]. Defaults 0 and 1. */
  minPosition?: ComparePosition;
  maxPosition?: ComparePosition;
  color?: CompareColor; // handle + divider paint, default "default"
  size?: CompareSize;   // handle size, default "md"
  isDisabled?: boolean;
  haptic?: false | HapticFeedback; // default "selection"; played at snap points and both ends
  accessibilityLabel?: string;     // names the adjustable; required in practice, warned in dev
  className?: string;              // the frame — give it a size or aspect-* class
  children: ReactNode;             // Before, After, Handle, Label parts
};

export type CompareLayerProps = { className?: string; children?: ReactNode };      // Before, After
export type CompareHandleProps = { className?: string; children?: ReactNode; testID?: string }; // children replaces the default grip glyph
export type CompareLabelProps =
  | { side: "before"; placement?: CompareLabelPlacement; className?: string; children: ReactNode }
  | { side: "after"; placement?: CompareLabelPlacement; className?: string; children: ReactNode };
export type CompareLabelPlacement = "start" | "end"; // along the cross axis, default "start"

export function useCompare(): CompareContextValue; // { position: SharedValue<number>, orientation, size: number, ... }
```

- **Compound surface**: `Object.assign(CompareRoot, { Before, After, Handle, Label })`.
- **Position semantics**: `0` shows only `After`, `1` shows only `Before`. `Before` always
  occupies the leading side (left; top when vertical; right under RTL).
- **Controlled** via `useControllableState<ComparePosition>`; a parent that rejects a drag leaves
  `position` unchanged and the seam springs back (the `settledDrags` token pattern from Slider).

## 3. File map

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/compare` (+ `COMPARE_*` tuples, types) |
| `compare.tsx` | Root: measurement, the pan, state, `Object.assign` |
| `compare-before.tsx` | Clipped layer: mask + counter-translated inner |
| `compare-after.tsx` | Full-frame back layer |
| `compare-handle.tsx` | Divider line, grip capsule, the whole accessibility surface |
| `compare-label.tsx` | A caption pinned to a side, fades as that side is covered |
| `compare.context.tsx` | `CompareContext`, `useCompare()`, `useCompareContext()`, `useComparePart()` |
| `compare.types.ts` | Prop types shared by two or more parts |
| `compare.variants.ts` | Slotted `tv()`, pure geometry/gesture/snap resolvers, no RN imports |
| `compare.variants.test.ts` | |
| `AGENTS.md` | Design decisions; row in `packages/react-native-ui/AGENTS.md` Components table |

## 4. Variants & sizes

- **`color`** (handle capsule + divider): `default`, `primary`, `success`, `warning`,
  `destructive`, `info` — the Slider/Switch set, the capsule takes the colour token and the grip
  glyph takes its `-foreground`. A test pins the pair and that every token exists in both variants
  of `theme.css`, as Slider does.
- **`size`** (handle only): `sm` / `md` / `lg` — capsule 28 / 36 / 44 along the cross axis, divider
  2pt at every size. The 44pt touch band is the capsule plus transparent padding, in the **same
  compound cell** as the capsule size (Slider's rule) so a retune cannot shrink the target.
- **`orientation`** is a compound axis with `size` for the capsule's long/short axis.
- **Divider is a plain 2pt rule in the colour**, no shadow (nothing in the package draws one). A
  `border-background` hairline either side keeps it visible over both bright and dark imagery; a
  test asserts it is present at every colour.
- **Frame**: no intrinsic size — `className` supplies `aspect-*` or `h-*`. `overflow-hidden` and
  `rounded-lg` are the default; `Surface`'s corner step.

## 5. States

| State | Behaviour |
| --- | --- |
| rest | Seam at `position`; handle capsule at rest scale |
| grabbed | Capsule scales 1 → 1.08 (UI-thread shared value `grabbed`), haptic confirms the grab |
| dragging | Position follows the finger, clamped to `[minPosition, maxPosition]`; snapping applies only on release (a live-snapping seam feels sticky) |
| snapped | On release within `snapThreshold` of a snap point, spring to it, haptic |
| disabled | Gesture off, capsule faded by the variant, `accessibilityState.disabled` |
| unmeasured | Frame `0×0` until `onLayout`; the seam and handle render `opacity: 0` (Slider's flicker rule) |
| controlled-rejected | Parent refuses the value → spring back to the prop |

## 6. Accessibility

- **`accessibilityRole="adjustable"` on the handle**, never on the frame, so the images stay
  individually reachable. Without `accessibilityActions` + `onAccessibilityAction` there is no
  assistive path to the position — the same hole Slider's docs call out.
- **`accessibilityValue={{ min: 0, max: 100, now: Math.round(position * 100), text }}`** where
  `text` comes from `resolveCompareValueText(position, labels)`: "50 percent before" /
  "Showing only after". It reads the percentage of the *Before* layer so the number matches what
  is drawn.
- **`accessibilityActions`**: `increment` / `decrement` call `stepPosition` by `step`, clamped and
  snapped through the same functions the pan uses. `onAccessibilityAction` also commits
  `onPositionChangeEnd`.
- **Name**: `accessibilityLabel` on the root is forwarded to the handle; an enclosing
  `Field.Label` string is read the way `Slider.Thumb` reads it. A development warning fires when
  neither exists — "unnamed adjustable".
- **Labels hide their duplicates**: `Compare.Label` is `accessible={false}` and
  `importantForAccessibility="no"` because the handle's value text already says which side is which.
- **Layers are content**: `Before`/`After` are not hidden; the author passes `accessibilityLabel`
  to the images. When the seam is at 0 or 1 the fully covered layer gets
  `importantForAccessibility="no-hide-descendants"` (a covered layer would otherwise be focusable
  while invisible).
- **Touch target ≥ 44pt** on the cross axis at every size.

## 7. Motion

- **One `Gesture.Pan()` on the root** (not a `Pressable`, for Slider's three reasons: a nested Tap
  inside a Pan, an animated style fighting for `transform`, and `onPress` firing on every drag).
  `HapticFeedback`/`playHaptic` are imported from `pressable.tsx`.
- **Write in `onBegin`**, not only `onUpdate` — a stationary tap on the frame must move the seam
  in `grab="anywhere"` mode, and `onFinalize` reports the drag finished (the only callback that
  fires on every path).
- **`grab="handle"`**: `onTouchesDown` runs `isWithinGrabBand(along, seamAlong, band)`; outside it
  calls `manager.fail()` so the touch falls through to the scroll view with no dead zone. Activation
  is `minDistance(0)`.
- **`grab="anywhere"`**: activation offsets along the axis (`activeOffsetX([-8, 8])` horizontal,
  `activeOffsetY` vertical) and `failOffset` on the cross axis (±12) — vertical scrolling wins on a
  vertical flick, horizontal drag wins on a horizontal one. Taps still jump the seam via `onBegin`
  only when the touch began inside the activation region.
- **`shouldCancelWhenOutside(false)`** — dragging off the frame must keep tracking.
- **The reveal is transform-only.** Layout animation per frame is the failure this prevents: the
  Before layer is a wrapper `Animated.View` (`absolute inset-0 overflow-hidden`) translated by
  `-(1 - p) * size` along the axis, and its inner full-size `Animated.View` is translated by
  `+(1 - p) * size`. Content never rescales or re-lays-out; only two transforms change.
  `resolveRevealTransforms(position, size, orientation, isRtl)` returns both offsets.
- **Handle** is a third animated view translated to `p * size - bandSize / 2`. Position is one
  `SharedValue<number>` the root writes; JS state mirrors it only on settle and on a step crossing
  (snapped to `step/100`-ish quantum) to bound re-renders when controlled.
- **Release**: `withSpring(target, { damping: 20, stiffness: 220, mass: 0.6 })` to the snapped
  position, using the velocity from the pan. Springs are the only animated release; a tap-to-jump
  in `anywhere` mode springs too, 0 duration under calm motion.
- **Haptics**: `shouldTickCompareHaptic(prev, next, snapPoints, min, max)` — tick on crossing a snap
  point (inside a small dead-band) and on reaching either bound, never per frame. The grab confirms
  with `selection`.
- **Calm / reduced motion**: `useCalmMotion()` true → no spring; the seam jumps to the release
  target in one frame; the grab-scale is 1. Dragging still follows the finger (it *is* the
  behaviour, not decoration).
- **Worklet hygiene**: every exported worklet in `compare.variants.ts` is flat (calls no sibling),
  and `scheduleOnRN` — never `runOnJS` — crosses back to JS.

## 8. Reuses

- `Pressable` module: `HapticFeedback`, `playHaptic` (leaf import from `../pressable/pressable`).
- `useControllableState`, `useThemeColor` (grip glyph colour as a plain string), `useCalmMotion`.
- `lib/cn`, `lib/tv`; `Icon` + Central Icons for the grip chevrons (names verified against
  `src/icons/central.ts` before use); `Text` for `Compare.Label`.
- `Field` context for the label string (read-only, like `Slider.Thumb`).
- `Surface` corner step only through the class (`rounded-lg`), not an import.

## 9. Dependencies

- **None new.** Reanimated 4, Gesture Handler, Pulsar and worklets are existing peers and are
  already in `PACKAGE_INSTALL`.
- `ITEM_META.compare` in `packages/cli/src/registry/config.ts`:
  `{ title: "Compare", description: "Two layers of one frame with a seam you drag across, revealed by a transform rather than a resize.", categories: ["media"] }` — confirm
  `"media"` against the category list in that file; else `["display"]`.
- No `dependencies` override: every import is scannable. Run `bun run registry:build` and read the
  resolved list.

## 10. Sibling / cross-category dependencies

- **Siblings (flip-card, qr-code): none.** No import crosses; all three branch independently.
  No wave order required.
- **Cross-category gaps**
  - **No `Image` primitive in the library.** Compare takes arbitrary children; the demos and docs
    use RN `Image`/`View`. Do not add one here. Scoped follow-up: an `Image` wrapper (placeholder,
    blur-up) is its own component.
  - **Demos may import only the library, `react`, `react-native` and native peers.** No demo
    asset bundle, so demos avoid bitmaps: the hero compares one `Card` rendered under `light`
    and `dark` via `ScopedTheme` (verify it is exported by Uniwind for demo use; otherwise two
    hand-coloured `View` compositions). A remote-URL image demo is not captured (network flake in
    the capture run).
  - **Category** `media` may not exist in `ITEM_META` categories — lead decides.

## 11. Pure logic to unit-test (TDD)

All in `compare.variants.ts`, tests in `compare.variants.test.ts`, written first.

```ts
clampPosition(position: number, min?: number, max?: number): number
// (0.5) → 0.5; (-1) → 0; (2) → 1; (NaN) → min (never propagate NaN); (0.9, 0.2, 0.8) → 0.8

resolvePositionFromGesture(input: {
  along: number; size: number; orientation: CompareOrientation; isRtl: boolean;
}): number
// horizontal ltr: (150, 300) → 0.5; vertical: along is y, top = 0; rtl horizontal mirrors (75, 300) → 0.75;
// size <= 0 → 0 (unmeasured guard); along < 0 or > size clamps to 0/1

snapPosition(position: number, snapPoints: readonly number[], threshold: number): number
// ([.5], .52, .04) → .5; (.56) → .56; empty points → unchanged; tie goes to the nearer, then the lower

stepPosition(position: number, direction: 1 | -1, step: number, bounds: {min:number; max:number}): number
// (.5, 1, .1) → .6; (.95, 1, .1) → 1 (lands on the bound, not .0000001 off); (.04, -1, .1) → 0
// float drift: ten +0.1 steps from 0 → exactly 1

resolveRevealTransforms(position: number, size: number, orientation: CompareOrientation, isRtl: boolean):
  { maskOffset: number; innerOffset: number; handleOffset: number }
// maskOffset === -innerOffset always; position 1 → offsets 0; position 0 → maskOffset === -size
// vertical uses the same numbers on the y axis; rtl negates the x offsets

isWithinGrabBand(along: number, seamAlong: number, band: number): boolean
// (100, 110, 44) → true; (100, 140, 44) → false; band edge inclusive

shouldTickCompareHaptic(prev: number, next: number, snapPoints: readonly number[], min: number, max: number): boolean
// crossing .5 snap → true; moving .31→.32 → false; reaching max (not leaving it) → true; reversed direction across a point → true

resolveCompareValueText(position: number, labels?: { before?: string; after?: string }): string
// .5 → "50 percent before"; 0 → "Showing only after"; 1 → "Showing only before"; custom labels substitute

resolveCoveredLayer(position: number): "before" | "after" | null
// 0 → "before" (zero width); 1 → "after"; .5 → null

resolveCompareHandleClasses({ color, size, orientation }) // tv slots; pins capsule+padding = 44 per size,
// colour/foreground pair per COMPARE_COLORS, divider present at every colour, no shadow-* class anywhere
```

Plus: mirror test (vertical vs horizontal give the same position for the same fraction), and the
token-existence sweep against both variants of `theme.css`.

## 12. Playground demos

`apps/playground/src/demos/compare/` — ordered barrel `index.ts` via `defineDemoGroup("compare", …)`,
one `.tsx` per demo, each with `meta` first and `Demo` last, `testID` on the handle.

| File | What it shows | Capture |
| --- | --- | --- |
| `anatomy.tsx` | Before / After / Handle / Label on two colour-block compositions; flow drags the seam | `hero`, `flow: "compare/anatomy"` |
| `themes.tsx` | One `Card` in `light` and `dark` side by side — the realistic use | capture, `align: "stretch"` |
| `vertical.tsx` | `orientation="vertical"` with a definite height | capture, flow |
| `snap-points.tsx` | `snapPoints={[0, .5, 1]}` with a readout; shows the haptic gate | capture, flow |
| `colours-and-sizes.tsx` | `COMPARE_COLORS.map` × sizes, handle only | capture |
| `controlled.tsx` | Controlled `position` driven by a button row and the drag | gallery only |
| `grab-anywhere.tsx` | `grab="anywhere"` inside a vertical `ScrollView` (shows scroll still wins) | gallery only |
| `accessible-names.tsx` | `Field.Label` naming and the unnamed warning case | gallery only |
| `disabled.tsx` | disabled state | gallery only |

Five `capture` demos, one `hero`. `COMPARE_COLORS.map(...)` with a `Record<CompareColor, string>`
label map (never render the raw value). Add `.argent/flows/previews/compare/*.yaml` flows
targeting the handle `testID`. Route file `apps/playground/src/app/(components)/compare.tsx`
renders `<DemoGallery demos={compareDemos} title="Compare" />`; add the row (icon: a Central
Icons columns/split glyph) to `src/app/index.tsx`; run `bun run gen-demos`.

## 13. Docs page

`apps/web/content/docs/native/components/compare.mdx`, frontmatter `title: Compare`,
`description`, `icon` (a Lucide name the docs site already maps, as `slider.mdx` does).

1. `<Preview id="compare/anatomy" title={null} />`
2. **Installation** — `<ComponentInstall name="compare" />`
3. **Usage** — minimal two-image example with `accessibilityLabel`.
4. **Themes** — the Card-in-two-themes example.
5. **Vertical** — with the "needs a definite height" callout.
6. **Snap points** and **Controlled** — `position`, `onPositionChangeEnd` for the write.
7. **Inside a scroll view** — `grab="handle"` vs `"anywhere"`, and the iOS
   `delaysContentTouches={false}` callout (identical to Slider).
8. **Accessibility** — adjustable, value text, step, naming, the unnamed warning.
9. **API Reference** — Anatomy table; `TypeTable` for `Compare`, `Compare.Handle`,
   `Compare.Label`, `Compare.Before/After`.

`meta.json`: add `"compare"` under `---Data Display---` (after `kpi`), or the media section if the
lead creates one.

## 14. Acceptance checklist

- [ ] `compare.variants.test.ts` written first, failing, then passing (`bun test src/components/compare`)
- [ ] `bun run typecheck` clean; no `any`; unions discriminated (`CompareLabelProps`)
- [ ] `bun run check` (Biome) clean; no comments inside JSX
- [ ] `AGENTS.md` in the folder; row in `packages/react-native-ui/AGENTS.md` Components table (`docs.test.ts` green)
- [ ] `displayName` on every part and provider, `DelacourUI.Compare.*` (`display-name.test.ts` green)
- [ ] `bun run gen-exports`; `package.json` `exports` has `./compare`
- [ ] Demos written; `bun run gen-demos`; `demos.test.ts` green (exactly one `hero`)
- [ ] Route file `(components)/compare.tsx` + row in `src/app/index.tsx`
- [ ] Docs page + `meta.json` entry
- [ ] `ITEM_META.compare` + `bun run registry:build` resolves no unknown package
- [ ] `.changeset/*.md` for `@delacour/react-native-ui` (minor)
- [ ] Simulator check: `warden claim ios`, install via the repo's warden command, drive with `agent-device`
      (`--platform ios --udid … --session compare`); release the lease after
- [ ] Seam stays in register: a text-heavy Before layer does not reflow at any position (screenshot at 0.25 / 0.75)
- [ ] Vertical `ScrollView`: a vertical flick over the image in `grab="handle"` scrolls; a drag on the handle moves the seam
- [ ] Android: transform + `overflow-hidden` clip has no bleed at the seam; RTL mirrors
- [ ] VoiceOver / TalkBack: increment/decrement change the value text; unnamed warning fires in dev
- [ ] Calm motion on (`isMotionCalm`): release does not spring
