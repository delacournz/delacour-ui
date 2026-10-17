# Direction

Sets the reading direction (LTR or RTL) for a subtree, mirrors layout natively, and tells JS-side maths which way is "start".

Plan ID: LAYOUT-02
Folder: `packages/react-native-ui/src/components/direction`
Import: `@delacour/react-native-ui/direction`

## Purpose on mobile

Apps ship in Arabic, Hebrew, Persian and Urdu, and some screens mix directions (a phone number or code sample inside an RTL paragraph). React Native has two mechanisms, neither enough alone:

- `I18nManager.isRTL` / `forceRTL` is process-wide and needs an app restart. Fine for the app locale, useless for a per-subtree override or a live preview in the playground.
- Yoga's `direction` style (`'ltr' | 'rtl' | 'inherit'`) mirrors `flexDirection: row`, `start`/`end` insets and margins, and text alignment for one subtree on the next frame. It does nothing for `translateX`, gesture maths, Skia/worklet geometry, or Uniwind's `rtl:`/`ltr:` variants.

`Direction` closes both gaps: it applies the Yoga style, scopes Uniwind's `rtl:`/`ltr:` variants to the subtree, and publishes the direction through context so components read it with `useDirection()` / `useDirectionSign()` instead of `I18nManager`.

It is not: a translation layer, a locale/number/date formatter, or a replacement for `I18nManager.forceRTL` at app level (that stays the app's call; `Direction` defaults to following it). It does not flip content that has intrinsic direction (a media timeline, a chart's time axis, a play-icon) unless the component opts in.

Uniwind 1.12 already ships `LayoutDirection` (exported from `uniwind`): a `display: contents` View with `direction` style that also overrides Uniwind's internal `rtl` context. `Direction` wraps it rather than re-implementing the Uniwind half. Peer already present, so zero new deps.

## API

```ts
export const DIRECTIONS = ["ltr", "rtl"] as const;
export type DirectionValue = (typeof DIRECTIONS)[number];

export type DirectionProps = {
	/** Force a direction for this subtree. Omitted, the subtree inherits the enclosing Direction, else the app's I18nManager.isRTL. */
	dir?: DirectionValue;
	children?: ReactNode;
};

export type DirectionContextValue = {
	dir: DirectionValue;
	isRTL: boolean;
	/** 1 in LTR, -1 in RTL. Multiply a physical x delta or translateX by it. */
	sign: 1 | -1;
};

export function Direction(props: DirectionProps): ReactElement;
export function useDirection(): DirectionContextValue;          // never throws; falls back to I18nManager
export function useDirectionSign(): 1 | -1;                      // sugar for useDirection().sign
export function DirectionProvider(props: { value: DirectionContextValue; children: ReactNode }): ReactElement; // leaf, in direction.context.tsx
```

No `style` prop. *Superseded on implementation:* the wrapper is a real `View` when `dir` is set (see open question 1), so it takes `className`.

Worklet-safe helpers (pure, in `direction.variants.ts`, usable from `useAnimatedStyle`):

```ts
export function resolveDirection(own: DirectionValue | undefined, parent: DirectionValue | null, system: boolean): DirectionValue;
export function directionSign(dir: DirectionValue): 1 | -1;
export function physicalSide(side: "start" | "end", dir: DirectionValue): "left" | "right";
export function mirrorX(x: number, width: number, dir: DirectionValue): number; // x from the start edge to x from the left edge
export function logicalDelta(dx: number, dir: DirectionValue): number;          // physical gesture dx to along-the-start-axis delta
```

Usage:

```tsx
<DelacourProvider>
  <Direction dir={locale.isRTL ? "rtl" : "ltr"}>
    <App />
  </Direction>
</DelacourProvider>

<Direction dir="rtl">
  <Text>مرحبا</Text>
  <Direction dir="ltr"><Text.Code>+1 555 010 4477</Text.Code></Direction>
</Direction>
```

`DelacourProvider` gets no `dir` prop (its AGENTS.md rule: no layer-named props). An app mounts `Direction` inside it; `DelacourProvider` is the wrong owner of a concern that can nest.

## Variants & sizes

None. No `tv()`, no tokens, no `className`. `direction.variants.ts` exists only for the pure resolvers above, matching the house rule that a component's resolvers live in a `*.variants.ts` leaf with no RN imports.

## States

- Controlled only, by nature: `dir` is a prop. No `useControllableState`.
- `dir` omitted: pass-through. Renders `LayoutDirection` with `rtl` undefined (no style written), so an unconditional wrapper costs nothing.
- Changing `dir` at runtime re-resolves on the next frame with no remount; context value is memoised on `dir`.
- No provider anywhere: `useDirection()` returns `I18nManager.isRTL`-derived value (read once per call; it only changes on restart).

## Accessibility

- Mirrors what VoiceOver/TalkBack read: swipe order follows layout direction on iOS; on Android row order follows `direction`.
- Adds no role, label or announcement. `accessibilityLanguage` is the caller's.
- Mirrored directional glyphs (chevrons, back arrows) are a consumer concern, see the follow-ups below.

## Motion

None of its own; a direction switch is instant (Yoga relayout). It does not animate the flip. Reduce-motion has nothing to calm.

Consumers do the real work in worklets: read `sign` on the JS thread via `useDirectionSign()` and close over it (a number, so it crosses to the UI thread in a worklet closure and updates when it re-renders), or compute through the pure helpers, which are marked `"worklet"`.

## Reuses

- `LayoutDirection` from `uniwind` (the Yoga style plus the `rtl` Uniwind context).
- `I18nManager` from `react-native` for the fallback only.
- React 19 `use()` for context, matching `useListGroupContext`.

## New peer deps

None. `uniwind` is already a peer. Alternative if `LayoutDirection` ever breaks: write `<View style={{ display: "contents", direction }}>` ourselves and lose only the Uniwind `rtl:` scoping.

## Cross-category dependencies

None. Pure foundation; nothing from Overlays/Navigation/Forms/Media.

Overlay note for the Overlays owner: portal and teleport content (BottomSheet, Popover, Toast) renders outside the tree and will not inherit the Yoga direction. Those components must re-wrap with `useDirection()`'s value. Out of scope here, flagged only.

## Consumer follow-ups (separate plans, not part of this component)

| Component | Today | Change | Size |
| --- | --- | --- | --- |
| Switch | thumb on `translateX`, "RTL is not handled" in AGENTS.md | multiply travel by `sign`; swap `StartContent`/`EndContent` is already layout-driven | small |
| Slider | drag maths on physical x | `logicalDelta` in the pan, fill anchored with `start-0` | medium |
| Tabs indicator + pager | measured `x` is physical | `mirrorX` for indicator, reverse pager page order | medium |
| Carousel (planned) | scroll offset physical | initial offset and snap order from `sign` | medium |
| Progress / Meter bar fill | `left-0` style fills | use `start-0` | trivial, do inline when touched |
| Icons: chevron, back arrow | physical glyph | `rtl:-scale-x-100` class where meaning is directional | trivial |
| Steps, Rating | row order flips by layout already | verify only | none |

The "trivial" rows may land with their own component's next change; nothing is bundled into LAYOUT-02.

## Pure logic to unit-test

`direction.variants.test.ts`, written first:

| Function | Input | Expected |
| --- | --- | --- |
| `resolveDirection` | `("rtl", "ltr", false)` | `"rtl"` (own wins) |
| `resolveDirection` | `(undefined, "rtl", false)` | `"rtl"` (inherits parent) |
| `resolveDirection` | `(undefined, null, true)` | `"rtl"` (system) |
| `resolveDirection` | `(undefined, null, false)` | `"ltr"` |
| `directionSign` | `"ltr"`, `"rtl"` | `1`, `-1` |
| `physicalSide` | `("start","rtl")`, `("end","rtl")`, `("start","ltr")` | `"right"`, `"left"`, `"left"` |
| `mirrorX` | `(10, 100, "ltr")` | `10` |
| `mirrorX` | `(10, 100, "rtl")` | `90` |
| `mirrorX` | `(0, 0, "rtl")` | `0` |
| `logicalDelta` | `(12, "rtl")`, `(12, "ltr")` | `-12`, `12` |

Also assert `DIRECTIONS` is exactly `["ltr","rtl"]` and that `mirrorX` is an involution (`mirrorX(mirrorX(x,w,d),w,d) === x`).

## File map

```
packages/react-native-ui/src/components/direction/
  AGENTS.md
  index.ts
  direction.tsx                 Direction (displayName DelacourUI.Direction)
  direction.context.tsx         DirectionProvider, useDirection, useDirectionSign, useDirectionContext
  direction.variants.ts         DIRECTIONS + pure resolvers, "worklet"-tagged
  direction.variants.test.ts
```

Then `bun run gen-exports`. Provider display name: `DelacourUI.Direction.Provider`.

## Playground demo

`apps/playground/src/demos/direction/` with `index.ts` (ordered) and:

| File | Shows | Capture |
| --- | --- | --- |
| `mirrored-rows.tsx` (hero) | the same `ListGroup` rendered in LTR and RTL side by side | yes, `align: "stretch"` — captured 2026-10-06 |
| `nested-override.tsx` | RTL paragraph with an LTR phone number | yes |
| `toggle.tsx` | a `Switch` flipping `dir` for a sample card at runtime | yes, flow `direction/toggle` |
| `uniwind-variants.tsx` | `rtl:`/`ltr:` classes resolving per subtree | no |

Route `apps/playground/src/app/(components)/direction.tsx` (`DemoGallery`), row in `components-index.ts` (group `Layout`, description "RTL and LTR for a subtree") and its icon in `app/index.tsx`. `demos.test.ts` plus `bun run gen-demos`.

## Docs page

`apps/web/content/docs/native/components/direction.mdx`: Installation (`<ComponentInstall name="direction" />`), Usage, "Whole app vs one section", Nesting, "Reading the direction" (`useDirection`, `useDirectionSign`, worklet example), "What it does not do" (translation, number/date formatting, portals), API tables.

Registry: `ITEM_META.direction = { title: "Direction", description: "Sets LTR or RTL for a subtree and exposes the sign for gesture maths.", categories: ["utilities"] }`. `PACKAGE_INSTALL`: `uniwind` is already classified; add nothing new.

## Changeset

`@delacour/react-native-ui` minor: "Add Direction, a per-subtree LTR/RTL wrapper with useDirection and useDirectionSign."

## Out of scope

- Any consumer change in the follow-up table (separate plans).
- Locale detection, `expo-localization`, `I18nManager.forceRTL` / reload orchestration.
- Mirroring images, icons or charts automatically.
- A `dir` prop on `DelacourProvider`.
- Bidi text shaping (`unicode-bidi`, isolates).

## Acceptance checklist

- [ ] `direction.variants.test.ts` written first, fails, then passes (`bun test packages/react-native-ui/src/components/direction`)
- [ ] `bun run typecheck` and `bun run check` clean
- [ ] Every component and the context provider carry a `DelacourUI.`-prefixed `displayName`; `display-name.test.ts` passes
- [ ] `direction/AGENTS.md` written with file map; Components table row added to `packages/react-native-ui/AGENTS.md`; `docs.test.ts` passes
- [ ] `bun run gen-exports` run; `./direction` in `exports`
- [ ] `bun run gen-demos` run; `demos.test.ts` passes
- [ ] Docs page, `ITEM_META` entry; registry build passes
- [ ] Changeset added
- [ ] No `any`; no comments inside JSX
- [ ] Simulator via agent-device: `warden claim ios`, open the toggle demo, `press id=dir-toggle`, `wait` and `is` that the row's first child moved to the trailing edge (compare `get` frame x before/after); nested LTR block keeps its order; `close` session and `warden release`
- [ ] Verified on device that `direction` on a `display: contents` View inherits to children (open question below)

## Open questions

1. Does Yoga honour `direction` on a `display: contents` node on RN 0.86 (Uniwind's own component relies on it)? Verify first on the simulator; if not, render a plain `View style={{ direction }}` with `flex: 1` and keep the Uniwind context. `1.a` verify, fallback ready.
   **Resolved 2026-10-05 (iPhone 17 sim, warden + agent-device): no.** `LayoutDirection` alone left the toggle demo's row unflipped. `Direction` now renders a plain `View style={{ direction }}` (no default `flex: 1` — it takes `className` instead, `flex-1` around a screen) with `LayoutDirection` inside it for the Uniwind `rtl:`/`ltr:` scope, which does work per subtree. With `dir` omitted the View stays `display: contents`.
   Also found: unset text alignment follows the app locale, not the subtree; set, `text-left` is read as start inside an RTL `Direction` (`text-right` lands on the left). Docs and demos use `text-left`.
2. Should `useDirection()` throw outside a `Direction`? Recommended no: fall back to the system value, so library components work with zero setup. `2.a` no-throw.
