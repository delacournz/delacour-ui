# NAV-07 — Tour

`import { Tour, useTour } from "@delacour/react-native-ui/tour";`

## Purpose on mobile

A guided walkthrough of a screen's controls: the app dims, a hole is cut around one control, and
a card beside it explains it. Next/Back/Skip move through the steps. The hole is the point — it
removes any doubt about which control is meant.

## API

```tsx
<Tour defaultOpen onFinish={markSeen} onSkip={markSeen}>
  <Screen>
    <Tour.Step order={1} title="Search" description="Find anything in your library.">
      <SearchButton />
    </Tour.Step>
    <Tour.Step order={2} title="New note" description="Start writing." shape="circle">
      <Fab />
    </Tour.Step>
  </Screen>
</Tour>

const tour = useTour(); // { isOpen, step, start(step?), next(), back(), skip(), finish(), goTo(order) }
```

```ts
type TourShape = "rect" | "circle";
type TourPlacement = "auto" | "top" | "bottom";

type TourLabels = { next: string; back: string; skip: string; finish: string; progress: (current: number, total: number) => string };

type TourProps = {
  isOpen?: boolean;
  defaultOpen?: boolean;                 // default false
  onOpenChange?: (isOpen: boolean) => void;
  step?: number;                         // the current step's `order`
  defaultStep?: number;                  // default: lowest order
  /** Fires before the step is measured — scroll the target into view here. */
  onStepChange?: (step: number) => void;
  onFinish?: () => void;
  onSkip?: () => void;
  padding?: number;                      // default 8
  radius?: number;                       // default 12
  shape?: TourShape;                     // default "rect"
  placement?: TourPlacement;             // default "auto"
  isDismissible?: boolean;               // default true — scrim tap / Android back skips
  hasProgress?: boolean;                 // default true — "2 of 5"
  hasSkip?: boolean;                     // default true
  /** Let the spotlit control receive touches; the app advances the tour itself. */
  isInteractive?: boolean;               // default false
  labels?: Partial<TourLabels>;
  cardClassName?: string;
  children: ReactNode;
};

type TourStepProps = ViewProps & {
  order: number;
  title: string;
  description?: string;
  shape?: TourShape; padding?: number; radius?: number; placement?: TourPlacement;
  className?: string;
  children: ReactNode;
};
```

## Mechanics

- `Tour` is a context provider; it renders `children` untouched plus, while open, a React Native
  `Modal` (`transparent`, `statusBarTranslucent`, `navigationBarTranslucent`,
  `animationType="none"`, `onRequestClose` → skip when dismissible). No teleport/portal
  dependency.
- `Tour.Step` wraps its child in a `View` (`collapsable={false}`) holding a ref; it registers
  `{ order, ref, title, description, overrides }` with the provider on mount and unregisters on
  unmount. It is always mounted — a layout descriptor, not an overlay element.
- On step change: call `onStepChange(order)`, wait one frame (`requestAnimationFrame`), then
  `ref.measureInWindow` → target rect. Re-measure on `Dimensions` change (rotation).
- **Mask**: full-window `react-native-svg` `Path` with `fillRule="evenodd"`: outer rect +
  rounded-rect (or circle) hole. Hole rect is a SharedValue animated with `withTiming` 280ms
  between targets via `useAnimatedProps`; reduce motion jumps. Scrim colour from the `overlay`
  token (`useThemeColor("overlay")`).
- **Touch**: `isInteractive=false` → full-screen `Pressable` scrim swallows touches (tap = skip
  if dismissible). `isInteractive=true` → the Modal's root has `pointerEvents="box-none"` with
  four scrim rectangles around the hole, so touches inside the hole fall through… **but** a
  `Modal` is a separate native window: touches cannot reach the app beneath. Therefore in
  interactive mode render **without Modal**: an absolutely positioned overlay inside `Tour`'s
  own root `View` (`StyleSheet.absoluteFill`, `pointerEvents="box-none"`). Spec decision: `Tour`
  wraps children in a `flex-1` root `View` so the overlay can live there; the Modal path is used
  only for non-interactive tours (covers status bar/tabs).
- **Card**: `Surface`-styled card (`bg-card rounded-lg border-border p-4`) with `Text.Header`
  title, `Text.Paragraph` description, footer row: progress ("2 of 5"), Skip (ghost `Button`),
  Back (outline, hidden on first), Next/Finish (primary). Placement `auto`: below the hole if
  the card fits under it within the safe area, else above; horizontally centred on the hole and
  clamped to the screen gutter. Each step measures and caches its own card height so placement
  never flips mid-transition.

## Pure logic (`tour.variants.ts`)

- `sortSteps(steps)` by `order`; `resolveStepIndex(orders, order)`; `resolveAdjacent(orders, order, dir)`.
- `resolveHoleRect(target, padding, shape)` → `{ x, y, width, height, radius }` (circle: square
  around the larger side, radius = half).
- `buildMaskPath(window, hole)` → SVG path string (worklet).
- `resolveCardPlacement({ hole, cardHeight, window, insets, gap, preference })` →
  `{ side: "top" | "bottom"; top: number; left: number; width: number }`.
- `resolveTourProgressLabel(current, total, labels)`.
- `tourVariants` slots `scrim`, `card`, `title`, `description`, `footer`, `progress`.

## Accessibility

- On step show: focus moves to the card title (`AccessibilityInfo.setAccessibilityFocus`); the
  card is `accessibilityViewIsModal`; the rest of the app is `importantForAccessibility="no-hide-descendants"`
  only in non-interactive mode.
- Card announces "Step 2 of 5" + title + description.
- `onAccessibilityEscape` (iOS two-finger Z) and Android back skip when dismissible.
- Reduce motion: hole jumps, card fades.

## Reuses

`Button`, `Text`, `Surface`/card tokens, `react-native-svg`, Reanimated,
`useControllableState`, `useSafeAreaInsets`, `useThemeColor`.

## Decisions

- No arrow on the card in v1.
- No persistence ("seen") — `onFinish`/`onSkip` give the app the hook.
- Labels English by default, overridable.

## Playground demos

`basic` (hero, capture), `circle-shape` (capture), `placement` (capture), `interactive`
(app advances on the spotlit control's press), `scroll-into-view` (uses `onStepChange` + a
`ScrollView` ref, `animated: false`), `custom-labels` (capture).

## Acceptance

- [ ] Pure resolvers table-tested: placement above/below/clamped, circle hole, path string.
- [ ] Spotlight measures in window coordinates and survives rotation.
- [ ] Next/Back/Skip/Finish fire the right callbacks; Back hidden on step 1.
- [ ] Interactive mode passes touches through the hole only.
- [ ] Android back and VoiceOver escape skip when dismissible.
- [ ] Reduce motion: no travel.
- [ ] AGENTS.md, Components-table row, gen-exports, registry, demos, docs page, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
