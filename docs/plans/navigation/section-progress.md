# NAV-04 — SectionProgress

`import { SectionProgress } from "@delacour/react-native-ui/section-progress";`

## Purpose on mobile

A floating pill over a long reading screen (an article, a policy, a long form) that shows two
things at once: a ring filling with scroll progress and the title of the section being read.
Tapping it opens a card listing every section; picking one scrolls there.

## Depends on

**NAV-00** `useScrollSections` (`src/hooks/use-scroll-sections.ts`) and
`src/lib/scroll-sections.ts`, already on the branch this workspace was created from. Do not
re-implement them; extend them only if a bug forces it, with tests.

## API

```tsx
const sections = useScrollSections({ readingLine: 96 });

<View className="flex-1">
  <Animated.ScrollView ref={sections.scrollRef} onScroll={sections.scrollHandler} scrollEventThrottle={16}>
    <View onLayout={sections.register("intro")}>…</View>
    <View onLayout={sections.register("pricing")}>…</View>
  </Animated.ScrollView>

  <SectionProgress
    scroll={sections}
    value={sections.activeId}
    onValueChange={sections.scrollTo}
  >
    <SectionProgress.Item value="intro">Introduction</SectionProgress.Item>
    <SectionProgress.Item value="pricing" color="success">Pricing</SectionProgress.Item>
  </SectionProgress>
</View>
```

```ts
type SectionProgressPlacement =
  | "bottom-center" | "top-center"
  | "bottom-start" | "bottom-end" | "top-start" | "top-end";

type SectionProgressColor = "foreground" | "primary" | "success" | "warning" | "info" | "destructive";

type SectionProgressScroll = Pick<UseScrollSectionsResult, "progress" | "scrollY">;

type SectionProgressProps = Omit<ViewProps, "children"> & {
  /** From useScrollSections — drives the ring and the reveal. */
  scroll?: SectionProgressScroll;
  /** Overrides the scroll-derived ring fill (0–1). */
  progress?: SharedValue<number> | number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  isOpen?: boolean;
  defaultOpen?: boolean;                    // default false
  onOpenChange?: (isOpen: boolean) => void;
  placement?: SectionProgressPlacement;     // default "bottom-center"
  /** Points from the safe-area edge. */
  offset?: number;                          // default 16
  /** Scroll Y before the pill appears. Stays once shown. 0 = always visible. */
  revealAt?: number;                        // default 64
  haptic?: false | HapticFeedback;          // default false; fires on section change
  accessibilityLabel?: string;              // default "Sections"
  children: ReactNode;                      // SectionProgress.Item[]
  className?: string;
};

type SectionProgressItemProps = Omit<PressableProps, "children"> & {
  value: string;
  color?: SectionProgressColor;
  children: string;                         // the title — also the pill label
  className?: string;
};
```

## Layout

- Root is `absolute` within the caller's container, `pointerEvents="box-none"`, inset by
  safe area (`useSafeAreaInsets`) + `offset` on the placement's edge.
- The pill: ring (20pt, `react-native-svg` `Circle` with animated `strokeDashoffset` via
  `useAnimatedProps`) + label `Text` (one line, truncated, `max-w` ~ 60% screen).
- The panel opens **from the pill** as a bordered card (`bg-card border-border rounded-lg`); the
  pill row becomes the card's bottom edge (top edge for `top-*`). List of items scrolls after
  six rows (`max-h` computed from row height × 6).
- A full-screen transparent `Pressable` scrim behind the open panel closes it on outside tap.

## Pure logic (`section-progress.variants.ts`)

- `resolveRingDashOffset(progress, circumference)`.
- `resolveRevealed(scrollY, revealAt, wasRevealed)` — latches true.
- `resolvePlacementStyle(placement, insets, offset)` → `{ top?|bottom?, start?|end?, alignSelf }`
  and `resolvePanelDirection(placement)` → `"up" | "down"`.
- `resolveSectionLabel(items, value)` → title or first item's title.
- `resolveSectionProgressAccessibilityValue(title, progress)` → "Pricing, 42 percent".
- `resolveSectionColorToken(color)` → theme token; test asserts it is declared in `theme.css`.
- `sectionProgressVariants` slots `root`, `pill`, `ring`, `label`, `panel`, `list`, `item`,
  `itemLabel`, `itemMarker`, `scrim`; axes `placement`, `isActive`.

## Motion

- Reveal: `FadeIn` 200ms once; never hides again.
- Ring: driven every frame from `progress` SharedValue on the UI thread (no React renders);
  when scrolling stops it eases to the settled value (`withTiming` 180ms).
- Label change: cross-fade keyed by value (`FadeIn`/`FadeOut` 120ms).
- Panel: scale-from-pill + fade (`withSpring`, damping high, no overshoot). Reduce motion: fade
  only; ring still tracks (it is information, not decoration).

## Accessibility

- Pill: `accessibilityRole="button"`, label = `accessibilityLabel` ("Sections"), value from
  `resolveSectionProgressAccessibilityValue`, `expanded` state.
- Panel items: `accessibilityRole="button"`, `selected` on active. When opened, focus moves to
  the active item (`AccessibilityInfo.setAccessibilityFocus`); `onAccessibilityEscape` closes.
- Ring hidden from AT.
- Android back closes the panel (`BackHandler` while open).

## Reuses

`Pressable`, `Text`, `react-native-svg`, Reanimated, `useControllableState`, `useScrollSections`,
`useSafeAreaInsets`, `playHaptic`.

## Decisions

- `haptic` prop (house vocabulary) replaces a boolean; no `expo-haptics`.
- Not portalled: the caller mounts it as the last child of the screen's container (documented).
- AGENTS.md must tell the caller to leave bottom padding at the scroll end so the pill never
  covers the last line.

## Playground demos

`article` (hero, capture), `placements` (capture), `colored-sections` (capture),
`manual-progress` (progress prop driven by a slider; capture), `controlled-open`.

## Acceptance

- [ ] Ring tracks scroll without React re-renders (verify with a render counter in a demo).
- [ ] Reveal latches after `revealAt`.
- [ ] Tapping an item scrolls to that section and updates the label.
- [ ] Panel scrolls after six rows; outside tap and Android back close it.
- [ ] VoiceOver reads "Sections, Pricing, 42 percent".
- [ ] AGENTS.md, Components-table row, gen-exports, registry, demos, docs page, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
