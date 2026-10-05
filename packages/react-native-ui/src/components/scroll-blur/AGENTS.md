# ScrollBlur

A progressive blur at a scrollable's start and end edges, so a control floating
over a list — a button row, a search field, a sheet footer — stays legible over
any background. With no blur engine, or with Reduce Transparency on, it falls
back to a gradient wash.

```ts
import { ScrollBlur, ScrollBlurLayerProvider } from "@delacour/react-native-ui/scroll-blur";
import { ExpoBlurLayer } from "@delacour/react-native-ui/expo/blur-layer";
```

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/scroll-blur` |
| `scroll-blur.tsx` | The root: resolves the source, the engine and the wash, renders `children` then one band per edge |
| `scroll-blur-band.tsx` | One edge — its strips, the wash over them, the scroll-linked opacity. Memoised |
| `scroll-blur.context.tsx` | Leaf. `ScrollBlurLayerProvider` and `useBlurLayer` |
| `scroll-blur.types.ts` | Leaf. `BlurLayerProps` / `BlurLayerComponent` — the engine contract — `BLUR_MATERIALS`, `ScrollBlurProps` |
| `scroll-blur.variants.ts` | The slotted `tv()`, `resolveBlurLayers`, `resolveBlurWash` |
| `scroll-blur.variants.test.ts` | The strip and wash maths |
| `../../expo/blur-layer.tsx` | `ExpoBlurLayer` — the only file in the package that imports `expo-blur` |
| `../../hooks/use-reduce-transparency.ts` | `useReduceTransparency()` — the iOS setting, live |

Shared with the rest of the scroll family and not owned here: `hooks/use-scroll-source.tsx`,
`lib/scroll-maths.ts` (`scrollEdgeOpacity`) and `lib/scroll-edges.ts` (`resolveFadeEdges`,
`resolveFadeBand`, `resolveFadeGradient`).

## Design

- **The blur engine is injected, never imported.** `expo-blur` is an optional native peer, and rule
  4 keeps every Expo import under `src/expo/`. The folder defines a contract — `BlurLayerComponent`,
  one native view taking `intensity`, `material` and `style` — and `ExpoBlurLayer` implements it.
  The app names the engine once with `ScrollBlurLayerProvider`, or per call with `layer`. An app that
  does neither never resolves `expo-blur` and gets the wash. `ScrollHeader`'s blur bar renders the
  same contract, so **keep `BlurLayerProps` stable** — a field added here is a field every engine
  must accept.
- **A progressive blur is a stack of strips.** No engine blurs along a gradient, so a band is cut
  into `layers` equal strips (1–16, default 8), edge first, each blurring
  `intensity * (layers - k) / layers` (`resolveBlurLayers`). More strips is a smoother ramp and one
  more native view each.
- **The strips are drawn as nested views, never side by side.** Laid edge to edge, each blur view
  blurs only what is behind it, so every boundary is a hard cut between two radii — on the
  simulator that showed as a ladder of seams over a light ground that no wash could hide.
  `resolveBlurStack` pins every view at the band's edge, reaching inward to where its strip ends,
  each adding an equal share of the edge intensity: a blur view blurs the ones beneath it, so a point
  under `n` views sits at its strip's intensity and each boundary is one small share. Each view is
  placed by `resolveFadeBand` at inset 0, so the geometry exists once.
- **The wash goes over the strips, not under them.** Adjacent strips at different intensities show
  a step at every seam; a gradient of the surface colour across them — `tint` alpha at the edge
  (`withAlpha`), zero inward (`transparentOf`) — is what turns a staircase into a ramp. The far stop
  is the colour at zero alpha, never `transparent`, for the reason `transparentOf` gives.
- **The fallback is the wash at a solid edge.** No engine, or Reduce Transparency on, drops the
  strips and forces the wash's edge alpha to 1 — a plain gradient fade that still hides content
  fully at the edge. Reduce Transparency is the reason the fallback exists, not just the
  missing-dependency path: a blur behind text is exactly what that setting removes.
  `enabled={false}` draws no band at all.
- **Only the band's opacity animates.** `scrollEdgeOpacity` drives one `Animated.View` per edge on
  the UI thread. Strip intensities are fixed per render: animating a native blur's radius per frame
  is expensive on iOS and unreliable on Android. So a scroll re-renders nothing. The opacity follows
  the user's own gesture, so it stays under Reduce Motion and there is no calm-motion branch.
- **Bands paint after `children`, so a floating control is a sibling.** A control placed inside a
  `ScrollBlur` would sit under its own blur. The docs and demos put it after the `ScrollBlur` in a
  `relative` parent; there is deliberately no overlay slot.
- **Decorative.** Every band is `pointerEvents="none"`, so taps reach the rows beneath it, and the
  band carries no accessible content.
- **Android draws the wash.** `ExpoBlurLayer` returns `null` there: `expo-blur` 57's Android blur
  only blurs a registered `BlurTargetView`, not whatever sits behind it. Revisit once that path is
  verified against a plain scrollable.
- **Prefer `ScrollFade` over a flat colour.** A gradient into the surface colour is cheaper and
  indistinguishable there; the blur earns its native views only over media, tints and gradients.

## Out of scope

A `blurLayer` prop on `DelacourProvider` (the provider folder is shared across categories — mount
`ScrollBlurLayerProvider` instead); real blur on Android and the web; animating blur intensity per
frame; vibrancy; Skia backdrop blur (it needs the scrollable inside a Skia canvas); a general
`BlurView` component.

## Demos and preview media

Six demos in `apps/playground/src/demos/scroll-blur/`, four captured: `list-under-button` (the hero,
a clip), `search-over-media` and `horizontal` (clips), and `blur-vs-fade` (a still).
`layers-and-intensity` and `fallback` are gallery-only.

**Every flow's return swipe matches its forward swipe.** With `momentum: false` the two cancel
exactly, so the clip ends on its first frame. An overshoot back past the start rubber-bands, and the
clip settles visibly before the loop seam. The list's swipe starts on the list, above the button: a
drag that starts on the button is a press on it, not a scroll.

`blur-vs-fade` compares against the wash fallback (`ScrollBlurLayerProvider layer={null}`) rather
than `ScrollFade`, which ships on a separate branch and must not be imported from this one. A
`ScrollBlurLayerProvider` takes `null` for exactly this: turning the blur off for a subtree.

## Simulator check

iPhone 17 simulator (warden lease), a dev client rebuilt with `expo-blur` 57.0.3, through
agent-device and the `/preview` route:

- `list-under-button`, dark: rows defocus under the band and the button's label stays legible; the
  end band is gone once the list reaches its end; drags starting on the button are taken by the
  button, so the band passes touches through.
- `search-over-media`: the start band is clear at rest and arrives with the first points of travel.
- `horizontal`, light: left and right bands follow the row.
- `blur-vs-fade`, light: the fade side is a gradient into the page, the blur side keeps the tile
  colour. The first build stepped visibly between strips; the nested stack above is the fix.

Not checked: Reduce Transparency toggled live (no `simctl` switch for it — check by hand in
Settings › Accessibility › Display & Text Size), the Android emulator (`ExpoBlurLayer` renders
`null` there, so it is the wash), and a React DevTools profile while scrolling.
