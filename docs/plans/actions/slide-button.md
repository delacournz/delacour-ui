# ACT-01-P3 — SlideButton (drag to confirm)

Read [README.md](README.md) first. The closest relatives are `slider/` (pan gesture, thumb,
haptic ticks via `playHaptic`) and `switch/` (thumb drag and spring), plus `progress-button.md`,
whose sizes it must match.

## Purpose on mobile

A control confirmed by **dragging a handle across a rail**, as in "Slide to ship" or "Slide to
transfer $240". It suits an action that deserves deliberation where a dialog would be too much
ceremony. A stray tap cannot reach it, and neither can habit. It differs from ProgressButton in
what it asks for: SlideButton asks for movement and shows a distance, and ProgressButton asks for
time.

## Anatomy

```tsx
<SlideButton onComplete={ship}>
  <SlideButton.Label>Slide to ship</SlideButton.Label>
  <SlideButton.Thumb />            {/* optional; children replace the chevron */}
</SlideButton>
```

## API

```ts
type SlideButtonVariant = "secondary" | "destructive" | "success";
type SlideButtonSize = "sm" | "md" | "lg";

type SlideButtonProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	className?: string;                     // the rail
	variant?: SlideButtonVariant;           // default "secondary"
	size?: SlideButtonSize;                 // default "md"
	isFullWidth?: boolean;
	threshold?: number;                     // fraction 0.1..1, default 0.9
	onComplete?: () => void;
	isCompleted?: boolean;                  // controlled
	defaultCompleted?: boolean;
	onCompletedChange?: (completed: boolean) => void;
	isAutoReset?: boolean;
	autoResetDelay?: number;                // ms, default 1000
	isDisabled?: boolean;
	haptic?: false | HapticFeedback;        // tick on arming (crossing threshold), knock on commit
	accessibilityActionLabel?: string;      // default "Confirm" — imperative, names the outcome
};
type SlideButtonLabelProps = Omit<TextProps, "children"> & { children: ReactNode; className?: string };
type SlideButtonThumbProps = ViewProps & { children?: ReactNode; className?: string };
```

`useSlideButton()` exposes `{ variant, size, isCompleted, offset /* SharedValue */, travel }`.

There is no `primary` variant on purpose. With a neutral handle, primary draws the same picture as
secondary in any theme whose primary sits close to its foreground. Write that rationale in
AGENTS.md.

## Visual design

- The rail is **the same box as ProgressButton at each size**: `h-button-{size}`,
  `rounded-button-{size}`, and `bg-{variant}-soft` (or `bg-secondary` for secondary). The two
  controls must line up in a column. Assert this in a test that compares the two `tv` root height
  classes.
- The **handle is neutral**, a stadium (`bg-background`, with `border-border` hairline) inset 4pt
  inside the rail. Its height is rail minus 8 and its width is about 1.6× its height. The default
  glyph is a chevron toward the travel direction (Central `IconChevronRight` /
  `IconChevronLeft` under RTL) in `text-foreground`.
- The **trail** (`bg-{variant}`, or `bg-foreground/15` for secondary) fills from the rail's start
  edge up to the handle's *tail*, so the trail and handle share one edge.
- The **label is centred in the whole rail and does not fade or move**. The handle passes over it.
  If it faded, the button would say nothing for the second half of the gesture.
- On completion the chevron crosses into a tick (fade and rotate, 180ms). The handle stays at the
  far end.
- `isDisabled`: `opacity-50`. The handle does **not** follow the finger. Following and springing
  back would read as a failed slide rather than a refused one.

## Behaviour

- `Gesture.Pan()` with `activeOffsetX([-8, 8])` and `failOffsetY([-12, 12])`, so it survives
  inside a vertical ScrollView.
- `travel = railWidth - handleWidth - 2*inset` (measured with `onLayout` into a shared value).
- During the drag, `offset = clamp(start + translationX * dir, 0, travel)`, where `dir = -1` under
  `I18nManager.isRTL`. There is no easing on the way out: the handle tracks the finger exactly.
- On release, `projected = offset + velocityX * dir * 0.08` (a small look-ahead).
  `progress = projected / travel`. If `progress >= threshold` and `offset/travel >= threshold - 0.25`,
  it completes. Otherwise it springs home. **With `threshold === 1`** there is no velocity
  shortcut: completion needs `offset >= travel - 0.5`.
- Completing springs the handle to `travel` with the release velocity, then `scheduleOnRN(complete)`.
- Haptic: `playHaptic(haptic)` the first time a drag crosses the threshold (armed; re-arms if it
  goes back under). `playHaptic("success")` on commit.
- `isAutoReset` → after `autoResetDelay`, spring home and set completed `false`. A controlled
  `isCompleted` going false also springs home. A controlled `isCompleted` true keeps the handle
  at the end. While the caller's async work is in flight, the handle sits at the end
  (`isCompleted` not yet true) and does not spring back: completion was *requested*.

## Reduced motion

Springs become short `withTiming` (180ms). The handle still travels, because a confirmation
control that shows nothing is broken.

## A11y

The rail is `accessibilityRole="button"` with `accessibilityLabel` taken from the label's text and
`accessibilityActions=[{ name: "activate", label: accessibilityActionLabel }]`. On `activate` it
completes (animating the handle to the end) and fires `onComplete`. `accessibilityState={{ disabled,
checked: isCompleted }}`.

## Pure logic (`slide-button.variants.ts` + test first)

- `resolveSlideThreshold(t?: number)` → default 0.9, clamped to [0.1, 1], and NaN gives the
  default.
- `resolveSlideRelease({ offset, velocity, travel, threshold, lookahead })` →
  `"complete" | "return"`, including the `threshold === 1` no-shortcut rule and the
  "flick from halfway does not complete" case.
- `resolveSlideTravel({ railWidth, handleWidth, inset })`.
- `slideButtonVariants`, a slotted `tv`: `root`, `trail`, `label`, `thumb`, `thumbGlyph`, with
  axes `variant × size × isFullWidth × isDisabled`. Add a token-existence test, and a test that
  each size's root height class equals `progressButtonVariants`' at the same size. If
  ProgressButton has not merged yet, assert against `h-button-{size}` directly and leave a TODO
  in the test **name** for the category lead to tighten at merge.

## Files

`slide-button/`: `index.ts`, `slide-button.tsx`, `slide-button-label.tsx`,
`slide-button-thumb.tsx`, `slide-button.context.tsx`, `slide-button.variants.ts`,
`slide-button.variants.test.ts`, `AGENTS.md`.

## Playground demos

`slide-to-ship` (hero, capture), `variants` (capture), `sizes` (capture), `threshold`
(0.5 vs 1, capture), `controlled-async`, `auto-reset`, `custom-thumb` (unlock glyph), `disabled`.

## Docs

`slide-button.mdx` under `---Actions---`.

## Acceptance checklist

- [ ] A drag past the threshold and release fires `onComplete` once. A short release springs home.
- [ ] A committed flick past ~70% completes, a lazy flick from 50% does not, and `threshold=1`
      demands the far end.
- [ ] The handle tracks the finger 1:1. Only the release is sprung.
- [ ] Works inside a vertical ScrollView (a vertical scroll is not hijacked).
- [ ] RTL: the handle rests at the right, travels left, and the chevron is mirrored.
- [ ] Disabled: the handle does not move at all.
- [ ] Screen-reader activate completes, with an action label that names the outcome.
- [ ] Sizes match ProgressButton's heights.
- [ ] Docs, demos, AGENTS.md, registry, changeset (minor) and gen-exports are done.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green.
