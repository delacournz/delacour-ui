# Skeleton

A placeholder standing in for content that is still loading: a tinted shape
with a glint sweeping across it, or a pulse, on the UI thread. Compound root plus
`Skeleton.Group`, which synchronises the skeletons inside it, and
`Skeleton.Lines`, a paragraph of placeholder lines.

`import { Skeleton } from "@delacour/react-native-ui/skeleton";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/skeleton` |
| `skeleton.tsx` | Root, `Skeleton.Lines` and the `Object.assign` compound surface |
| `skeleton-group.tsx` | `Skeleton.Group` — the shared clock and loading flag |
| `skeleton-shimmer.tsx` | The sweeping band, an internal leaf |
| `skeleton-clock.ts` | `useSkeletonClock`, the 0 → 1 UI-thread loop both animations read |
| `skeleton.context.tsx` | `SkeletonGroupProvider`, `useSkeletonGroup()` |
| `skeleton.variants.ts` | Pure `tv()` slots + resolvers + worklets, no RN imports |
| `skeleton.variants.test.ts` | |

## Design

- **Three shapes, and a shape is a corner plus a default size.** `rect` is a
  card-shaped `rounded-lg` (see **Sizing** in the package doc for why a card is
  that step), `line` is a line of text at `rounded-sm`, `circle` is an avatar at
  `rounded-full`. A childless skeleton also takes a default size — `h-24 w-full`,
  `h-3.5 w-full`, `size-10` — that a caller's `className` overrides, since
  tailwind-merge sees both in one chain. The defaults exist so an unsized
  skeleton is visible rather than a zero-height nothing.
- **Children are the content, and they size the placeholder.** A skeleton that
  wraps children renders them underneath at opacity 0 while loading, so the grey
  shape is exactly the size the content will be and **nothing moves when it
  lands**. The shape then contributes only its corner: a default height would
  fight the content, then clip it once shown. Flip `isLoading` off and the fill
  and the clip drop and the content fades in over `SKELETON_REVEAL_MS`. The
  children are never unmounted between the two states, so their own state
  survives the swap. `pointerEvents` is off on them while they are invisible —
  an invisible button that still takes a tap is a trap.
- **One clock drives both animations.** `useSkeletonClock` loops 0 → 1 every
  `SKELETON_CYCLE_MS`. A shimmer reads it as the band's position
  (`skeletonShimmerOffset`), a pulse as a point on a cosine
  (`skeletonPulseOpacity`). That is what lets a `Skeleton.Group` hold a single
  clock for every skeleton inside it without caring which each one draws.
- **`Skeleton.Group` exists to keep a region in step.** Separate skeletons
  start their clocks when they mount, so a list whose rows mount a frame apart
  shimmers as a ripple of unrelated glints. Inside a group they read the
  group's clock and move together, and one `isLoading` reveals the whole
  region. A skeleton's own `isLoading` and `animation` still win over the
  group's; it starts a clock of its own only when there is no running group
  clock to share.
- **The fill is a tint, `bg-muted-foreground/20`, not `bg-muted`.** `muted`
  sits within 0.015 lightness of the light page, and a placeholder drawn in it
  was verified on the simulator to all but vanish there. A fifth of the muted
  foreground lands a clear step off whatever it sits on — page or card, light or
  dark — because it is translucent, and it still leaves headroom above it for
  the glint. `SKELETON_FILL_CLASS` names it and a test pins it to a tint.
- **The glint is painted in `elevated`, not white.** `elevated` is the raised
  surface in both themes — white in light, a lifted grey in dark — so it sits
  above the tinted fill either way. White would glare on dark; a translucent
  black would darken rather than lighten in light mode. Following the token
  also means a pasted palette carries the glint with it. The band is
  a react-native-svg gradient, transparent at both ends, with low quarter stops
  so it reads as a soft glint rather than a ridge.
- **The band sweeps from wholly off one edge to wholly off the other.**
  `skeletonShimmerOffset(0)` is `-bandWidth`, `(1)` is the placeholder width, so
  the band enters from nothing and leaves to nothing and the wrap back to 0 has
  no visible jump. Its width is a share of the placeholder, bounded both ways —
  a chip still gets a visible band and a full-bleed card does not get a wash.
  The band is sized by Yoga from its class (`w-3/5 min-w-12 max-w-60`), and
  both widths are read with `measure` inside the animated style, so the skeleton
  never re-renders to animate and each frame writes only `transform` and
  `opacity`. Until both are measured the band is transparent.
- **The gradient is a unit viewBox stretched over an absolutely filled `Svg`.**
  Found on the simulator: an `Svg` at `width="100%"` kept its first size when
  the band resized, so when raising `Skeleton.Lines`' count turned the old last
  line into a full one, that line's glint sat off-centre and swept visibly out
  of step with the rest. `StyleSheet.absoluteFill` plus
  `preserveAspectRatio="none"` makes the native view follow the band.
- **Reduce-motion stills the skeleton, it does not hide it.**
  `resolveSkeletonAnimation` returns `none` while the OS setting is on, and the
  clock is never started. The shape is the message: a placeholder that stops
  moving still reads as content on its way. The clock's own timing sets
  `ReduceMotion.Never` because the decision has already been made one level up —
  under the default `System` policy `withTiming` completes instantly and
  `withRepeat(-1)` would spin a zero-length animation forever, the trap
  [Spinner](../spinner/AGENTS.md) documents too.
- **The pulse owns `opacity`.** Its animated style goes after the caller's
  `style`, so an `opacity` passed there has no effect while it pulses. The floor
  is `SKELETON_PULSE_MIN_OPACITY`, well above zero — a placeholder that blinks
  out reads as a failing layout, not a loading one.
- **Hidden from assistive technology unless labelled.** An unlabelled grey box
  announces nothing worth hearing, and a screen of them announces it many times
  over, so the default is `accessibilityElementsHidden` plus
  `importantForAccessibility="no-hide-descendants"`. A `label` turns the
  skeleton into one busy `progressbar` status. Label the one that stands for the
  region — or the `Skeleton.Group`, or the `Skeleton.Lines` paragraph — never
  each line. Once loaded the skeleton contributes no accessibility props at all
  and the content speaks for itself. `resolveSkeletonAccessibility` returns a
  discriminated union (`hidden` / `status` / `content`) so the three cases are
  pinned in `bun test`.
- **An unlabelled group takes no role.** It may hold real content beside its
  placeholders, and hiding the group would hide that too; each skeleton already
  hides itself.
- **`Skeleton.Lines` lives in the root file.** It renders `SkeletonRoot`
  directly, and a file of its own would have to import `./skeleton` and close a
  cycle (package rule 3). Only the last line is shortened, and only with two or
  more — a single line is a title whose length the caller already knows. Its
  line keys are positional because lines never reorder. **Outside a group it is
  a `Skeleton.Group` of its own.** Found on the simulator: with a clock per line,
  a line added by raising `lines` started from zero and glinted out of step with
  the rest. Inside a group it is a plain container, since the group's clock
  already serves every line.
- **A number is not a class here either.** An arbitrary height like `h-[200px]`
  only exists once Tailwind has scanned it; pass a computed dimension through
  `style`, which the root spreads before the pulse.
