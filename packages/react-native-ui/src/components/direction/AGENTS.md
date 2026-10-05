# Direction

Sets the reading direction — LTR or RTL — for a subtree: Yoga mirrors its layout, Uniwind's `rtl:` /
`ltr:` variants resolve against it, and `useDirection()` / `useDirectionSign()` tell JS-side maths
which way is start.

`import { Direction, useDirection, useDirectionSign } from "@delacour/react-native-ui/direction";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/direction` |
| `direction.tsx` | `Direction` (`DelacourUI.Direction`) — the box, Uniwind's `LayoutDirection`, the provider |
| `direction.context.tsx` | `DirectionProvider` (`DelacourUI.Direction.Provider`), `useDirection`, `useDirectionSign`, `useDirectionContext`, `directionContextValue` |
| `direction.variants.ts` | `DIRECTIONS` and the pure, `"worklet"`-tagged resolvers: `resolveDirection`, `directionSign`, `physicalSide`, `mirrorX`, `logicalDelta` |
| `direction.variants.test.ts` | The resolvers, pinned |

There is no `tv()`: Direction has no tokens and no styled parts. The `*.variants.ts` file exists
only because a component's pure resolvers live in a leaf with no React Native imports, so
`bun test` reaches them.

## Design

- **Two mechanisms, neither enough alone.** `I18nManager.forceRTL` is process-wide and needs a
  restart — right for the app's locale, useless for one subtree or a live preview. Yoga's
  `direction` style flips one subtree on the next frame but does nothing for `translateX`, gesture
  deltas, Skia or worklet geometry, or Uniwind's variants. `Direction` applies the Yoga style,
  scopes the Uniwind variants, and publishes the value through context so the rest can follow.
- **With `dir` set, the wrapper is a real `View`, not `display: contents`.** The spec planned to
  wrap Uniwind's `LayoutDirection`, a `display: contents` View carrying `direction`. Verified on an
  iPhone 17 simulator (RN 0.86, Uniwind 1.12, 2026-10-05): Yoga does **not** pass `direction` from
  a contents node to its children — the toggle demo's row stayed "One Two Three" in RTL. A plain
  `View style={{ direction }}` flips them. So the outer `View` carries the direction, and
  `LayoutDirection` is still rendered inside it, because its `rtl` context is what scopes Uniwind's
  `rtl:` / `ltr:` variants (verified: the variants demo paints `ltr:bg-primary` and
  `rtl:bg-destructive` per subtree). Do not "simplify" back to `LayoutDirection` alone.
- **Because it is a box, it takes `className`.** A wrapper around a screen needs `flex-1`; the spec
  had no `className` only because the contents node had no box to style. No `style` prop — the
  style slot is the direction.
- **With `dir` omitted it is `display: contents` and writes no direction**, so an unconditional
  wrapper adds nothing to layout. It still publishes the inherited value through context.
- **Text alignment does not follow.** Yoga's direction mirrors rows, `start`/`end` insets, margins
  and padding; native text keeps the app's natural alignment (seen on the simulator: Arabic header
  left-aligned inside an RTL card). The docs and the nested-override demo use `rtl:text-right`.
  Making `Text` read the direction is a follow-up, not this component.
- **`useDirection()` never throws.** Outside any `Direction` it derives the value from
  `I18nManager.isRTL`, so a library component reading it works with no setup. That flag changes only
  on restart, so reading it per call is enough.
- **One context object per direction** (`directionContextValue`), so the value is referentially
  stable and a consumer's memo keyed on it re-runs only when the direction changes.
- **No `dir` on `DelacourProvider`.** Direction nests; the provider is the wrong owner of a concern
  that can. An app mounts `<Direction>` inside it.
- **The resolvers are `"worklet"`-tagged** so a gesture or `useAnimatedStyle` can call them on the UI
  thread. `useDirectionSign()` returns a plain number for a worklet to close over.

## What it does not do

- Translate, or format numbers and dates.
- Reach portals. BottomSheet, Popover and Toast content render outside the tree and inherit neither
  the Yoga direction nor the context; they must re-wrap with the value `useDirection()` read before
  the jump. Flagged for the Overlays owner.
- Flip content with intrinsic direction — a media timeline, a chart's time axis, a play glyph.
- Bidi text shaping, locale detection, or `forceRTL` / reload orchestration.

## Consumer follow-ups (separate changes)

| Component | Change |
| --- | --- |
| Switch | multiply thumb travel by `sign` |
| Slider | `logicalDelta` in the pan; anchor the fill with `start-0` |
| Tabs | `mirrorX` for the indicator; reverse pager order |
| Carousel | initial offset and snap order from `sign` |
| Progress, Meter | `start-0` fills |
| Text | align by direction, so `rtl:text-right` is not needed |
| Chevrons, back arrows | `rtl:-scale-x-100` where the meaning is directional |

## Verification

- `bun test packages/react-native-ui/src/components/direction` — the resolvers.
- Simulator, 2026-10-05, via warden + agent-device on the toggle demo: before the toggle,
  `dir-step-one` at x 37; after, at x 261 and `dir-step-three` at x 37. The nested LTR row
  (`dir-fixed-1..3`) kept x 37 / 149 / 261 in both states.
- No preview media is captured: argent is uninstalled on the capture machine, so the demos carry no
  `capture` and the docs page has no `<Preview>`. `.argent/flows/previews/direction/toggle.yaml` is
  ready for when they are captured — restore `capture` on `mirrored-rows` (hero, `align: "stretch"`),
  `nested-override` and `toggle` (`flow: "direction/toggle"`), run `bun run previews -- --only direction`,
  and add the `<Preview>` tags.
