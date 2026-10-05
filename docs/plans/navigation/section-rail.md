# NAV-05 — SectionRail

`import { SectionRail } from "@delacour/react-native-ui/section-rail";`

## Purpose on mobile

A thin rail of bars along one screen edge, one bar per section of a long screen, the active one
highlighted — like a scrollbar that knows the document's outline. Touching it expands a labelled
panel; tapping a row (or scrubbing along the rail) jumps to that section. Content stays almost
full-width until the reader asks for the outline.

## Depends on

**NAV-00** `useScrollSections` + `src/lib/scroll-sections.ts`, already on the branch. Reuse them.

## API

```tsx
const sections = useScrollSections();

<View className="flex-1">
  <Animated.ScrollView ref={sections.scrollRef} onScroll={sections.scrollHandler}>…</Animated.ScrollView>

  <SectionRail value={sections.activeId} onValueChange={sections.scrollTo} align="bottom">
    <SectionRail.Trigger>
      <SectionRail.Bar value="intro" />
      <SectionRail.Bar value="setup" />
      <SectionRail.Bar value="setup-ios" level={1} />
    </SectionRail.Trigger>
    <SectionRail.Content>
      <SectionRail.Item value="intro">Introduction</SectionRail.Item>
      <SectionRail.Item value="setup">Setup</SectionRail.Item>
      <SectionRail.Item value="setup-ios" level={1}>iOS</SectionRail.Item>
    </SectionRail.Content>
  </SectionRail>
</View>
```

```ts
type SectionRailPlacement = "end" | "start";        // default "end" (right in LTR)
type SectionRailAlign = "center" | "bottom";        // default "center"

type SectionRailProps = Omit<ViewProps, "children"> & {
  placement?: SectionRailPlacement;
  align?: SectionRailAlign;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  isOpen?: boolean;
  defaultOpen?: boolean;                 // default false
  onOpenChange?: (isOpen: boolean) => void;
  /** ms the panel lingers after a pick, so a mis-tap can be corrected. */
  closeDelay?: number;                   // default 300
  offset?: number;                       // default 12, from the safe-area edge
  haptic?: false | HapticFeedback;       // default false; "selection" tick per section crossed while scrubbing
  children: ReactNode;
  className?: string;
};

type SectionRailTriggerProps = ViewProps & { className?: string };
type SectionRailBarProps = ViewProps & { value: string; level?: number; className?: string };
type SectionRailContentProps = ViewProps & { maxWidth?: number | `${number}%`; className?: string }; // default "78%"
type SectionRailItemProps = Omit<PressableProps, "children"> & { value: string; level?: number; children: string; className?: string };
```

## Interaction

- **Tap the rail** → opens the panel.
- **Scrub**: a `Gesture.Pan` (activeOffsetY ±4, failOffsetX) on the trigger opens the panel and
  highlights the row under the finger's Y (mapped through the bar positions); releasing commits
  `onValueChange` for that row. Haptic tick per row crossed (worklet `playHaptic`).
- **Tap a row** → `onValueChange`, panel stays `closeDelay` ms then closes.
- Outside tap (transparent scrim) / Android back closes.
- Root `pointerEvents="box-none"` so the scroll view under it keeps scrolling everywhere but the
  rail's own hit area (rail hit width ≥ 44pt even though bars are ~3pt).

## Pure logic (`section-rail.variants.ts`)

- `resolveBarLength(level)` → class (`w-4`, `w-3`, `w-2`; level ≥ 2 clamps).
- `resolveItemIndent(level)` → `ps-*` class.
- `resolveScrubIndex(y, rowTops: readonly number[], rowHeights: readonly number[])` → index
  (worklet; clamps to ends).
- `shouldEmitSection(current, next)`.
- `resolveRailPlacementStyle(placement, align, insets, offset)` and
  `resolvePanelAnchor(placement, align)` → which corner the panel grows from (`bottom` align →
  grows upward from the corner).
- `sectionRailVariants` slots `root`, `trigger`, `bar`, `content`, `item`, `itemLabel`, `scrim`;
  axes `isActive` (bar `bg-foreground` vs `bg-muted-foreground/40`, item `text-foreground
  font-medium` vs `text-muted-foreground`), `placement`, `align`.

## Motion

Panel fades + scales from its anchor corner (`withTiming` 160ms, ease-out); the active bar's
colour/width eases 120ms. Reduce motion: fade only, no scale.

## Accessibility

- Trigger: `accessibilityRole="adjustable"`, label "Sections", value = active section title
  (read from the matching `Item`), `accessibilityActions` increment/decrement move to next/prev
  section; activate opens the panel.
- Bars hidden from AT (the trigger speaks for them).
- Items: `button`, `selected` on active; focus moves to active row when opened.
- Labels wrap to two lines then truncate (`numberOfLines={2}`).

## Reuses

`Pressable`, `Text`, Gesture Handler, Reanimated, `useControllableState`, `useScrollSections`,
`useSafeAreaInsets`, `playHaptic`.

## Decisions

- `placement` is `start`/`end` (RTL-correct), not left/right.
- Not portalled (no Overlays dependency); mount as last child of the screen container.
- A "pager mode" is just the same component with `value` driven by a pager's index — a demo, not
  a prop.

## Playground demos

`docs-page` (hero, capture, `align="bottom"`), `center` (capture), `start-edge` (capture),
`nested-levels` (capture), `pager` (driven by a horizontal pager), `controlled-open`.

## Acceptance

- [ ] Bars mirror items; nesting shortens bars and indents rows identically.
- [ ] Scrub highlights rows under the finger and commits on release; ticks per row.
- [ ] `closeDelay` respected; outside tap / back close.
- [ ] Scroll view remains scrollable outside the rail.
- [ ] VoiceOver adjustable increments sections.
- [ ] AGENTS.md, Components-table row, gen-exports, registry, demos, docs page, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
