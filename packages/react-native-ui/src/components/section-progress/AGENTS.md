# SectionProgress

A floating pill over a long reading screen — an article, a policy, a long form. A ring fills with
scroll progress beside the title of the section being read; tapping the pill grows it into a card
listing every section, and picking one scrolls there. Compound root plus `SectionProgress.Item`.

`import { SectionProgress } from "@delacour/react-native-ui/section-progress";`

```tsx
const sections = useScrollSections({ readingLine: 96 });

<View className="flex-1">
  <Animated.ScrollView ref={sections.scrollRef} onScroll={sections.scrollHandler} scrollEventThrottle={16}>
    <View onLayout={sections.register("intro")}>…</View>
    <View onLayout={sections.register("pricing")}>…</View>
  </Animated.ScrollView>

  <SectionProgress scroll={sections} value={sections.activeId} onValueChange={sections.scrollTo}>
    <SectionProgress.Item value="intro">Introduction</SectionProgress.Item>
    <SectionProgress.Item value="pricing" color="success">Pricing</SectionProgress.Item>
  </SectionProgress>
</View>
```

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/section-progress` |
| `section-progress.tsx` | Root — value, open state, reveal latch, ring source, a11y percent, haptic, back handler, and the `Object.assign` |
| `section-progress-item.tsx` | `SectionProgress.Item` — one row of the panel: marker and title |
| `section-progress-pill.tsx` | The pill — ring and label, as a capsule or as the panel's edge row. Internal |
| `section-progress-panel.tsx` | The open card — the pill row, a rule, the scrolling list. Internal |
| `section-progress-ring.tsx` | The Skia ring — a track circle and a trimmed fill path, driven by a shared value. Internal |
| `section-progress.context.tsx` | The root's context and `useSectionProgress` |
| `section-progress.variants.ts` | Pure `tv()` slots + every resolver, no RN imports |
| `section-progress.variants.test.ts` | |

There is no `section-progress.types.ts`: every prop type has exactly one consumer, and the house
rule keeps such a type in its consumer's file.

## Reads `useScrollSections`, re-implements nothing

- **The scroll side is the shared hook.** `useScrollSections` (`src/hooks/`, pure logic in
  `src/lib/scroll-sections.ts`) owns the active section, the progress shared value and `scrollTo`.
  The pill takes the hook's result as `scroll` (it reads `progress` and `scrollY`), its `activeId`
  as `value` and its `scrollTo` as `onValueChange`. A custom table of contents can read the same hook.
- **`value={sections.activeId}` is controlled even while it is undefined.** `activeId` is undefined
  until the first scroll event, and `useControllableState` would read that as uncontrolled and warn
  when it flipped. The root checks for the `value` **key** instead, and treats an undefined value as
  "no section yet" — the pill then shows the first item's title.
- **Re-picking the active section still emits.** Scrolled halfway down a section, picking it again
  is how the reader gets back to its top.

## Layout

- **Not portalled.** Mount it as the last child of the screen's container, a sibling of the scroll
  view. The root is `absolute inset-0` with `pointerEvents="box-none"`, so the screen under it keeps
  every touch the pill does not cover. No teleport or bottom-sheet engine is imported — both are
  optional peers.
- **Leave bottom padding at the end of the scroll content** (about the pill's height plus `offset`
  plus the bottom inset) so the pill never covers the last line. The pill cannot add it for you: it
  does not own the scroll view.
- **Placement is one vertical edge, a symmetric gutter and an alignment.** `resolvePlacementStyle`
  returns `top` or `bottom` (safe-area inset + `offset`), `start` and `end` both set to the wider
  horizontal inset + `offset`, and `alignItems`. The spec named the last field `alignSelf`; it is
  `alignItems` because the box spans the gutter and aligns its one child. A symmetric gutter is what
  keeps `start`/`end` correct under RTL without reading the layout direction.
- **The panel is the pill grown into a card.** Open, the pill's content is drawn as the card's
  edge row — the bottom edge for `bottom-*`, via `flex-col-reverse`, and the top for `top-*` — with a
  rule between it and the list. Closed, it wears its own capsule. One `SectionProgressPill` renders
  both, so the two can never disagree.
- **The list scrolls past six rows.** Rows are `min-h-11` — a 44pt touch target — and the list's
  max height is six of them plus its `py-1`. Both numbers are read
  back out of the slots, so retuning a row moves the threshold with it<!-- registry:omit --> (`section-progress.variants.test.ts` pins this)<!-- /registry:omit -->.
- **A transparent full-screen scrim closes the panel on an outside tap.** It is a `Pressable` with
  `feedback="none"`, hidden from assistive technology — the escape gesture is VoiceOver's way out.
- **The label is capped at sixty percent of the window, on one line.** `resolveLabelMaxWidth`.

## Motion

- **The ring never renders React.** It is one small Skia canvas: a track `Circle` and a fill
  `Path` — the whole circle, built once at module scope from twelve o'clock clockwise — whose
  `end` trim is a derived value (`resolveRingTrimEnd`, clamped 0..1, NaN → 0) passed straight
  to the Skia prop. Nothing crosses to the JS thread per frame and no path is rebuilt; the
  trim follows a shared value. A scroll moves that value directly, frame by frame; a jump of more than
  `SECTION_PROGRESS_RING_JUMP` — a picked section, a new `progress` — eases over 180ms
  (`resolveRingTransition`). That is how the spec's "eases to the settled value" is read: scroll
  events already arrive every frame, so the ease belongs to the moments the value leaps.
- **The reveal latches.** `resolveRevealed` is true once `scrollY` reaches `revealAt` and never
  false again, so the pill does not blink near the top. `revealAt={0}`, or no `scroll`, shows it at
  once. It fades in over 200ms, once.
- **The label fades in when the section changes**, keyed by value (120ms). There is no matching
  fade-out: the old label would hold its width in the row while it faded, and the pill would grow
  wide for a frame — so the new title simply replaces it and fades up.
- **The panel scales out of the pill's own corner and fades**, on a damped spring that does not
  overshoot. `transformOrigin` takes no `start`/`end`, so `resolvePanelTransformOrigin` resolves
  the side against `I18nManager.isRTL`. Reduce motion: a fade only. The ring keeps tracking under
  reduce motion — it is information, not decoration.

## Accessibility

- **The pill is one button**: name `accessibilityLabel` ("Sections"), value
  `resolveSectionProgressAccessibilityValue` ("Pricing, 42 percent"), state `expanded`.
- **The percent reaches React only while a screen reader is on.** Keeping the accessibility value
  current means a render per percent; with no screen reader listening there is nobody to read it,
  so the root subscribes to `screenReaderChanged` and only then crosses each whole-percent change
  over with `scheduleOnRN`. Scrolling with VoiceOver off renders nothing.
- **Opening moves focus to the active item** (`AccessibilityInfo.setAccessibilityFocus`, after the
  panel has laid out). The panel is `accessibilityViewIsModal`, and `onAccessibilityEscape` closes it.
- **Items are buttons, the active one `selected`.** The ring and the marker dots are hidden.
- **Android back closes the panel** — a `BackHandler` subscription held only while it is open.
- **The pill takes `${testID}-pill`** from the root's `testID`, through the context — it is internal,
  so a test or a preview flow has no other way to name it. The closed capsule and the open panel's
  edge row share the id; only one is mounted at a time, so one `tap` opens and the same `tap` closes.

## Colour

- **An item's `color` paints its marker, and the ring while that section is active.** The marker is
  a `bg-*` class; the ring is Skia and takes the same token through `useThemeColor`, resolved
  above the canvas — context does not cross into Skia's reconciler.
  `resolveSectionColorToken` names it, and the suite asserts each one is declared in both themes and
  that the marker slot emits the matching `bg-*`. The ring's track is `border`.
- **Text colour is on the label slots, never the pressables** (rule 1). The active row is tinted
  `bg-muted` and its title `foreground`; the rest are `muted-foreground`.

## Haptics

- **`haptic` plays on a section change**, through `playHaptic` — scrolling across a boundary, or a
  pick. Off by default: a long article would otherwise buzz at every heading.

## Peers

- **`@shopify/react-native-skia` is an optional peer, needed here.** The ring draws with it, as
  `Chart`, `Flow` and `Sketch` do; `react-native-svg` is no longer imported by this component.

## What it does not do

- **No measuring of the scroll view.** Sections come from `useScrollSections().register`, whose
  `onLayout` reports `y` relative to the parent — a registered section must be a direct child of
  the scroll content.
- **No nesting.** One flat list of sections; a sub-heading is a section of its own.
- **No portal and no popover.** The card is a positioned view in the pill's own tree.
