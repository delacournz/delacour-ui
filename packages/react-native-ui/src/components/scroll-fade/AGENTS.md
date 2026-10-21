# ScrollFade

A gradient at a scrollable's start and end edges, drawn while there is more
content past them, so content reads as passing beneath the boundary rather than
being cut. Vertical or horizontal. Pattern A — a styled wrapper with no parts.

`import { ScrollFade } from "@delacour/react-native-ui/scroll-fade";`

It is the first of the **scroll family** built on the shared modules described
under "The scroll family's shared code" in the package `AGENTS.md`. It owns
none of them; it reads them:

| Module | What ScrollFade takes from it |
| --- | --- |
| `src/hooks/use-scroll-source.tsx` | `useResolvedScrollSource` and the `ScrollSource` type |
| `src/lib/scroll-maths.ts` | `scrollEdgeOpacity`, the per-edge opacity worklet |
| `src/lib/scroll-edges.ts` | `SCROLL_EDGES`, `resolveFadeEdges`, `resolveFadeBand`, `resolveFadeGradient` |

Their rules and tests live with them. Nothing here keeps a copy.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/scroll-fade` |
| `scroll-fade.tsx` | `ScrollFade` — resolves the source and the colour, mounts the edges |
| `scroll-fade-edge.tsx` | One animated edge band — internal, memoised |
| `scroll-fade.variants.ts` | Pure `tv()` slots, the defaults, and `SCROLL_FADE_EDGES` — `lib/scroll-edges`' union under ScrollFade's name |
| `scroll-fade.variants.test.ts` | |

## Design

- **It overlays, it never wraps.** The scrollable is a child and the bands paint
  after it, but nothing touches the scrollable's props. Cloning a child to attach
  an `onScroll` would collide with Reanimated's handler composition, and every
  `Screen` scrollable already owns its handler — `use-screen-scroll-insets`
  drives the reserves from it — so a second writer would take a handler already
  spoken for. The caller spreads `useScrollSource`'s `scrollProps` instead.
- **The source resolves explicit → ambient → throw.** A `scrollSource` prop wins;
  otherwise the nearest `ScrollSourceProvider`, which every `<Screen>` mounts
  through its bridge; otherwise `useResolvedScrollSource` throws naming
  `ScrollFade`. A fade with nothing to follow would draw its resting state
  forever and look like it works.
- **A nested `Screen` hands over the outermost Screen's scroll.** A `Screen`
  inside another reports to the outer one, so its bridge publishes the *outer*
  scrollable's values. A fade over a nested Screen's body therefore follows the
  wrong scroller — the playground gallery is a Screen pager, which is why its
  demo goes through a `ScrollSourceProvider` instead. Pass `useScrollSource`'s
  source explicitly whenever the Screen is not the route's own.
- **There is no `orientation` prop.** The axis is `source.orientation`, fixed by
  whoever created the source, so the fade cannot disagree with the scroller about
  which way it moves.
- **Each edge is in only while there is content past it** — `scrollEdgeOpacity`.
  The start is clear at rest and arrives over the first `fadeInDistance` points;
  the end is in at rest and leaves over the last. Rubber-banding past either end
  keeps that end clear. A list too short to scroll draws neither: an edge that
  promises content which does not exist is worse than a hard one.
- **Unmeasured means "draw the end".** With either size still 0 the start
  follows the offset and the end reads 1. That is `Screen`'s policy and it is
  forced: a Screen's source learns its sizes only from the first scroll event,
  and a tall body has to show its end fade at rest. `useScrollSource` measures on
  `onLayout` / `onContentSizeChange`, so over its own sources a short list loses
  the end fade within a frame of laying out.
- **`fadeInDistance` 0 is a step**, in the moment there is a point past the edge.
  It is separate from `size` on purpose: the depth of the band and how fast it
  arrives are two different decisions.
- **Name the surface, through `color`.** The fade is a colour, not a mask, so over
  a `card` it has to be the card. `color` takes a theme token (`"card"`) or a
  literal and goes through `useThemeColor`; the default `background` over a card
  reads as a grey band.
- **The far stop is the near colour at zero alpha, never `transparent`.** The
  keyword is transparent *black* and drags every stop between through grey.
  `transparentOf` takes the alpha off instead, and for a notation it cannot take
  apart the component renders its children with no fade rather than reaching for
  the keyword after all.
- **`insetStart` / `insetEnd` hold a band in from its edge** — under a bar this
  component cannot see. It is not `Screen.ScrollShadow`'s `coverTop`: there is no
  solid band here.
- **`enabled={false}` draws nothing without unmounting**, so the scrollable keeps
  its position and state when a fade is toggled.

## Motion

- **UI thread only, zero React renders while scrolling.** Each edge is one
  memoised component with one `useAnimatedStyle` reading the source's shared
  values; the gradient itself is static and only its opacity moves.
- **Every worklet in `scroll-maths.ts` and `scroll-edges.ts` is self-contained.** A module-scope helper
  called from inside a worklet can be missing from its closure on the UI thread
  — `undefined is not a function` mid-scroll, invisible to unit tests. Each
  function writes its own clamp inline and calls no other. Do not tidy that into
  a shared helper.
- **No calm-motion branch.** The opacity follows the user's own finger; nothing
  loops or moves on its own, so there is nothing for reduce motion to still.

## Accessibility

- **Purely visual.** Each band is `pointerEvents="none"`, `accessible={false}`
  and `importantForAccessibility="no-hide-descendants"`. The wrapper is a plain
  `View` and adds nothing to the accessibility tree; the scrollable's own
  elements read exactly as they would without it.

## Layout

- **`start` and `end` follow the scroll axis in layout space** — top and bottom,
  left and right. They do not flip under right-to-left on their own; a
  right-to-left horizontal list has to be checked by hand.
- **The wrapper is `relative` and nothing else**, so it shrink-wraps the
  scrollable like any `View`. Over a `Screen` body give it `className="flex-1"`.

## Relation to `Screen.ScrollShadow`

`Screen.ScrollShadow` stays as it is. It measures the navbar and footer, has
solid `coverTop` / `coverBottom` bands and an `anchor`, and is the tool for a
Screen body under floating chrome. `ScrollFade` is element-local: the edges of
its own box, either axis, any container — a card row, a list in a `Card`, a sheet
body, a chip strip. Moving `ScrollShadow`'s opacity onto `scrollEdgeOpacity` is a
follow-up, not part of this component.

## Dependencies

- **`expo-linear-gradient`** — already a hard peer, already imported by
  `Screen.ScrollShadow` from `components/`. A native gradient view is cheaper per
  frame than an SVG one, and `Screen` already pays for it.
- `react-native-reanimated` for the source and the animated styles.

## Verification

Checked on an iOS simulator (iPhone 17, dev client, light and dark), 2026-10-05:
a vertical list fades only its end at rest, gains the start within a few points
of scrolling, and loses the end at the bottom; a horizontal row does the same on
x; the fade matches `card`, `secondary` and `background` in dark with no grey
band; the provider path finds its source with no prop; the scroll worklets never
threw; the accessibility snapshot shows no node for any band. Not exercised on a
device: a list too short to scroll (covered by `scrollEdgeOpacity`'s tests),
VoiceOver itself, right-to-left, Android, and a `Screen` route body (the bridge
was seen to resolve, but only nested inside the gallery's own Screen — see
Design). Preview media is captured from the dev client on an iPhone 17 Pro:
`vertical-list` (hero clip), `horizontal-cards` and `single-edge` (clips) and
`on-a-surface` (still), each in both themes.
