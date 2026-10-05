# Marker

An inline note between the turns of a conversation or the entries of a feed —
something that **happened**, not something someone **said**: "Searched 128
files", "Read config.ts", "Yesterday". Centred, muted, no speaker, no bubble.
Compound root plus `Marker.Icon` and `Marker.Content`.

`import { Marker } from "@delacour/react-native-ui/marker";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/marker` |
| `marker.tsx` | Root + the `Object.assign` compound surface |
| `marker-icon.tsx` | `Marker.Icon`, the decorative glyph slot |
| `marker-content.tsx` | `Marker.Content`, with the running shimmer |
| `marker-shimmer-clock.ts` | `useMarkerShimmerClock`, the UI-thread loop and its settle |
| `marker.context.tsx` | `MarkerContext`, `useMarker()`, `useMarkerContext()`, `useMarkerPart()`, the internal shimmer registry |
| `marker.variants.ts` | Slotted `tv()`, `MARKER_VARIANTS`, constants, resolvers, the shimmer worklet — no RN imports |
| `marker.variants.test.ts` | |

## Design

- **Three variants, no sizes.** `default` is a bare centred row of glyph and
  text; `border` is the same row inside a hairline capsule (`border-border
  rounded-full`), for closing a section — "Task complete"; `separator` is a
  label with a rule each side, for day breaks. A marker is one quiet line, so
  `text-xs` muted is the whole type treatment; a size axis, if one is ever
  needed, is an addition rather than a guess now.
- **`border` hugs its content; the other two span the row.** `default` and
  `separator` are `self-stretch` and centre their content inside; `separator`
  needs the span for its rules to reach both edges. A `self-stretch` capsule
  would be a pill-shaped box drawn across the whole row around a few words, so
  `border` is `self-center`. A test asserts both halves.
- **The capsule keeps the plain marker's rhythm.** Every marker is `py-2` so
  stacked markers between bubbles breathe. The capsule needs `py-1` inside its
  border, so it spends the other half as `my-1` outside it — the line it
  occupies is as tall as a plain marker's.
- **`separator` composes two `Separator`s, never a hand-drawn border**, so it
  inherits the hairline, the `border` token and the hidden-from-assistive-
  technology rule. The `rule` slot is `flex-1 self-center`: `Separator`'s
  `self-stretch` is a long-axis rule, and inside a row the cross axis is
  vertical, so without `self-center` it would stretch tall and take no width
  of its own. `flex-1` gives it the remaining width either side of the label.
- **A marker is a note until it is given something to do.** With no `onPress`
  and no `onLongPress` the root is a plain `View` — `accessible`, role `text`,
  so VoiceOver reads its words once as one element and announces no button.
  Either handler makes it a [`Pressable`](../pressable/AGENTS.md) with role
  `button`. `resolveMarkerInteractive` is that decision and it is pure. It is
  the same rule as Badge's `resolveBadgeInteractive`, but written again here
  rather than imported, because the two components may diverge.
- **The press props are refused on a static marker at the type level.**
  `MarkerInteraction` is a union whose static branch types `feedback`, `haptic`,
  `hitSlop`, `pressedOpacity`, `pressedScale` and `accessibilityHint` as
  `undefined` — there is nothing for them to press.
- **Default press feedback is `fade`.** A scale on a full-width row reads as
  the whole conversation lurching.
- **Colour is on the `Text`** (package rule 1). `Marker.Content` paints
  `text-muted-foreground`; the root publishes `MARKER_ICON_TOKEN` —
  `muted-foreground` — and `size-icon-xs` through `IconDefaultsProvider`, so a
  bare `<Icon>` in `Marker.Icon` matches the text with nothing said. The
  provider takes the token and `Icon` resolves it, so the root calls no
  `useThemeColor` of its own. A test pins the token to the content slot's
  class and asserts both themes declare it.
- **`Marker.Icon` is hidden from assistive technology.** The glyph restates
  the text beside it; reading both would say the step twice.
- **Disabled is `opacity-50` on the root.** `Pressable` multiplies a class's
  opacity into its press rather than overwriting it, so the dim holds on an
  interactive marker too. On a static marker it dims and nothing else — there
  is no press to block.
- **String children** are wrapped in a `Marker.Content`, consecutive strings
  collapsing into one — the [`Badge`](../badge/AGENTS.md) and
  [`Button`](../button/AGENTS.md) rule.

## Shimmer

- **`Marker.Content shimmer` says the step is still running.** Drop it the
  moment the step finishes — a marker that shimmers forever reads as a stuck
  one.
- **It is an opacity breath, not a glyph-clipped band.** A highlight band
  clipped to the glyphs needs a mask — `@react-native-masked-view/masked-view`
  or Skia text — and neither is a peer of this package. Adding one for a single
  prop fails the catalog's cost/benefit. The text's opacity follows a cosine
  between `MARKER_SHIMMER_MIN_OPACITY` (0.45) and 1 over
  `MARKER_SHIMMER_CYCLE_MS` (1.6 s), on the UI thread; `markerShimmerOpacity`
  is the worklet and it is tested as a plain function. **Follow-up:** a
  glyph-masked band, if a mask peer is ever adopted.
- **The clock is local, not Skeleton's.** `useMarkerShimmerClock` copies the
  shape of `useSkeletonClock` — `ReduceMotion.Never` on the repeat, because the
  default policy completes `withTiming` instantly under reduce motion and
  `withRepeat(-1)` would spin a zero-length animation forever — rather than
  importing it across folders, so the two stay uncoupled.
- **Stopping eases back, it does not snap.** The loop is cancelled where it
  stands and a `blend` value eases to 0 over `MARKER_SHIMMER_SETTLE_MS`; the
  opacity is `1 - blend × (1 - sweep)`, so it returns to 1 from wherever it
  was. Starting resets the loop to 0, where the sweep is already opaque.
- **Calm motion stills it.** `resolveMarkerShimmer` returns false under
  `useCalmMotion()` — OS reduce motion or `DelacourProvider`'s `isMotionCalm` —
  and the text is drawn opaque and still. The words already say the step is
  running.

## Busy announcement

- **A shimmering `Marker.Content` registers with the root, and the root
  announces `busy`.** The spec allowed a root `isBusy` prop paired by hand with
  `shimmer`; that is two props saying one thing, and the pair drifts the first
  time someone clears one and not the other. Registration costs one state
  update on the root when shimmer toggles. The registry is a separate internal
  context, so `useMarker()` hands a custom child `isBusy` to read rather than a
  function to call. Calm motion does not clear it — the step is running whether
  or not the text moves.
- **Only a static marker announces busy.** `Pressable` owns its
  `accessibilityState` and its `busy` prop also **blocks the press**; a running
  step must stay tappable — expanding it is the point — so an interactive
  marker does not pass it. The running state is still in the words ("Searching
  files"). Announcing busy without blocking would need `Pressable` to accept a
  non-blocking busy, which is a change to the shared primitive and out of
  scope here.
