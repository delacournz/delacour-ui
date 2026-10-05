# ScrollCanvas

An image in a frame that stays put while the picture moves inside it as the page
scrolls — parallax, zoom, a wipe reveal, or a frame sequence scrubbed by the
thumb. The frame is the layout; only what is inside it moves. A single component
(pattern A + a slotted `tv()`), no compound parts and no `useScrollCanvas`.

`import { ScrollCanvas } from "@delacour/react-native-ui/scroll-canvas";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/scroll-canvas` |
| `scroll-canvas.tsx` | The root: the frame, its accessibility, effect dispatch |
| `scroll-canvas-image.tsx` | `parallax` / `zoom` / `reveal` — one animated image, plus the cover for `reveal` |
| `scroll-canvas-sequence.tsx` | `sequence` — N stacked frames, one opaque, and the internal frame leaf |
| `use-frame-progress.ts` | Resolves the source, measures the frame, derives 0–1 progress on the UI thread |
| `scroll-canvas.types.ts` | `ScrollCanvasProps` — the `source` / `sources` union, shared by the root and the test |
| `scroll-canvas.variants.ts` | Pure `tv()` slots, constants and worklet resolvers, no RN imports |
| `scroll-canvas.variants.test.ts` | The effect maths, the slots and the props union (`@ts-expect-error`) |

## Design

- **It follows a scroll source; it never wraps a scrollable.** It reads the
  family's `ScrollSource` (`hooks/use-scroll-source.tsx`) — a `scrollSource`
  prop, else the nearest provider, which a `<Screen>` mounts. It reuses nothing
  else from the family but that hook; its own maths lives in
  `scroll-canvas.variants.ts`, and it imports neither `ScrollFade` nor
  `ScrollBlur`.
- **Where the frame is comes from the first of three sources that applies.**
  (1) `progress` given → nothing is measured. (2) the source has a scroller ref
  (`useScrollSource`) → `measureLayout(frame, scroller)` on layout, and again on
  every `contentSize` change, because an image loading above the canvas moves it
  without re-laying it out. (3) no ref (a Screen's source) → `onLayout`'s `y`,
  which is content-space **only for a direct child of the scroll content
  container**. A canvas nested inside a card in a Screen must be given a
  `useScrollSource` source or `progress`, or its window is off by the card's top.
- **The source is resolved by hand, not through `useResolvedScrollSource`.**
  That hook throws when there is no source, but a canvas driven by `progress`
  needs none — it can sit in a static layout or a pager — and nor does one
  switched off with `enabled={false}`. With none of the three, the canvas
  throws, naming the ways out. Reduce Motion does **not** waive the source: a
  canvas that only rendered with the setting on would break the moment it was
  turned off.
- **A window, not a range of offsets.** The caller places the effect in viewport
  terms — `start` and `end` are where the frame's top sits (1 = bottom edge,
  0 = top, negative = past the top) — so one number reads the same on every
  screen size. Every effect starts as the frame enters (`1`). Parallax ends as
  the frame's bottom leaves (`-frameHeight / viewport`), so it drifts for its
  whole time on screen; the others complete at `0.3`, while the picture is still
  well in view. A zero-width window is a step.
- **Parallax never shows a frame edge.** The image is the frame plus `travel`
  above and below (`distance` × frame height, clamped 0–1) and drifts from
  `-travel` to `+travel`, so at either end of the run one image edge is flush
  with the frame's. The oversize is laid out in percent — `resolveParallax` at a
  frame height of 100 — so React never waits on a measured height; only the
  drift reads it, on the UI thread.
- **`transform` only.** No height, top or opacity on the frame animates — no
  relayout mid-scroll. `reveal` is a cover sliding up out of the clipped frame,
  not a frame that grows; `zoom` is a scale that settles to 1 by `end`.
- **A sequence mounts every frame and toggles opacity.** Swapping one image's
  `source` would decode on the JS thread and flash `bg-muted` between frames;
  opacity flipped on the UI thread snaps. No cross-fade — a scrub lands on a
  frame. `fadeDuration={0}` stops Android's decode fade. The cost is memory, so
  more than `SCROLL_CANVAS_SEQUENCE_WARN_FRAMES` (30) warns in development; keep
  frames at display size.
- **Motion off draws the resting state, not nothing.** Reduce Motion, the E2E
  `isMotionCalm` (both via `useCalmMotion`) and `enabled={false}` pin progress to
  `resolveStaticProgress`: parallax centred (0.5), zoom natural (1), reveal
  uncovered (1), sequence frame 0. This is the one family member that gates
  scroll-linked motion, because the picture moves independently of the finger —
  a vestibular trigger, where an edge fade is not.
- **Accessible as one image, or not at all.** A non-empty `accessibilityLabel`
  makes the frame `accessible` with `accessibilityRole="image"`; a sequence is
  announced once, never per frame. No label → decorative: `accessible={false}`
  and `importantForAccessibility="no-hide-descendants"`.
- **The frame is the placeholder.** `bg-muted` shows until the picture paints,
  and stays if it fails — no error UI; a caller wanting one wraps it. Corner is
  `rounded-lg`, the card step. `aspectRatio` is a numeric style, default 16/10.
- **RN `Image`, not `expo-image`.** `expo-image` would move the component under
  `src/expo/` and add a peer (rule 4). A `renderImage` / injected image
  component can follow if asked, as can a Media-category `Image` once it lands.
- **Every resolver is a self-contained worklet.** The same rule as
  `lib/scroll-maths.ts`: each clamps inline and none calls another.
- **Vertical only.** A horizontal source warns in development and the effect
  does not track it. Horizontal canvases are out of scope, as are video, Lottie,
  GIF, remote preloading, blurhash, sticky scroll-story sections and pager
  gestures.

## Verification notes

`bun test` covers the maths, the slots and the props union. Rendering was checked
on an iOS simulator (iPhone 17, warden lease, agent-device) on 2026-10-05:

- **Parallax** drifts the picture down through the frame as the page rises and
  never shows a frame edge. **Zoom** settles to scale 1. **Reveal** uncovers from
  the bottom edge and ends fully uncovered. **Sequence** steps monotonically
  with the scroll (15 → 19 → 23 → 24 of 24 across one drag, matching
  `resolveEffectProgress` for that viewport). The resting-states demo draws all
  four at rest with no source.
- **`measureLayout` returns content-space coordinates**, not viewport ones: a
  canvas nested in a `View` measured 628, and after a 100pt spacer grew above
  it while scrolled 461pt, re-measured 744 (100 + the 16pt gap). The
  `contentSize` reaction is what triggered that re-measure.
- **Accessibility tree:** a labelled canvas is one `image` with its label (a
  sequence once, not per frame); unlabelled canvases do not appear at all.
- **`w-full` on the image slot is load-bearing.** The first run drew only the
  left 36% of every picture — an `Image` with a bundled source keeps the
  asset's width as a default style, and `inset-x-0` does not override it.

Not yet checked, and why:

- **The OS Reduce Motion switch** itself — the resting states were checked
  through `enabled={false}`, which takes the same path (`resolveStaticProgress`)
  as `useCalmMotion`.
- **A `Screen`-ambient canvas** (`onLayout.y`, no ref): every demo passes a
  `useScrollSource` source.
- **Android** (`fadeDuration={0}` on sequence frames).
- **Captured preview media.** `bun run previews` needs the argent CLI, which is
  not installed on this machine, and a demo marked `capture` without a manifest
  entry fails `demos.test.ts`. So no demo carries `capture` yet and the docs
  page has no `<Preview>`. Once it can run: capture `parallax` (hero, flow
  `scroll-canvas/parallax`), `zoom`, `reveal`, `sequence` (each with its flow
  under `.argent/flows/previews/scroll-canvas/`) and `reduced-motion` (still),
  then add a `<Preview>` under each section of the docs page.
