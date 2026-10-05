# ACT-01-P2 — ProgressButton (hold to confirm)

Read [README.md](README.md) first. The closest existing relatives are `button/` (sizes, label,
corners), `progress/` (fill) and `pressable/` (gesture and haptic). Read their `AGENTS.md` files.

## Purpose on mobile

A button that has to be **held** rather than tapped. A fill grows from the leading edge, and the
action fires when the fill reaches the end. It suits an irreversible action that would otherwise
need a confirmation dialog, such as erasing or paying. Two taps in a row is a rhythm a hand falls
into. A two-second hold cannot be done by accident or by habit.

Nothing fires before the fill completes. There is no tolerance near the end. Released early, the
fill **plays back** at the same rate. It does not snap to empty.

## Anatomy

```tsx
<ProgressButton onComplete={erase} variant="destructive">
  <ProgressButton.Label>Hold to erase</ProgressButton.Label>
  <ProgressButton.Done />            {/* optional; default tick is drawn when omitted */}
</ProgressButton>
```

## API

```ts
type ProgressButtonVariant = "primary" | "secondary" | "destructive" | "success";
type ProgressButtonSize = "sm" | "md" | "lg";
type ProgressButtonShape = "pill" | "rounded";

type ProgressButtonProps = Omit<ViewProps, "children"> & {
	children: ReactNode;
	className?: string;
	variant?: ProgressButtonVariant;      // default "primary"
	size?: ProgressButtonSize;            // default "md"
	shape?: ProgressButtonShape;          // default "pill"
	isFullWidth?: boolean;                // w-full, self-stretch
	holdDuration?: number;                // ms, default 2000, floored at 200
	onComplete?: () => void;
	isCompleted?: boolean;                // controlled
	defaultCompleted?: boolean;           // default false
	onCompletedChange?: (completed: boolean) => void;
	isAutoReset?: boolean;                // default false
	autoResetDelay?: number;              // ms, default 1000
	isDisabled?: boolean;
	haptic?: false | HapticFeedback;      // tick when the hold takes; "success" knock on completion. Default false
	accessibilityHint?: string;           // default "Press and hold to confirm"
};
type ProgressButtonLabelProps = Omit<TextProps, "children"> & { children: ReactNode; className?: string };
type ProgressButtonDoneProps = ViewProps & { children?: ReactNode; className?: string };
```

`useProgressButton()` exposes `{ variant, size, isCompleted, progress /* SharedValue<number> 0..1 */ }`.

## Visual design

- **The box is the button's box.** Height comes from `h-button-{size}` and padding from the
  button's `px-*` at that size. With `shape="rounded"` the corner is `rounded-lg`. With `pill`
  (the default) it is `rounded-button-{size}`. The pill sends the wipe's leading edge out as a
  curve, so the button reads as filling up. Reuse the button's size tokens and never mint new ones.
- **Every variant rests on the same surface (`bg-secondary`) and carries its colour in the label
  and the fill.** The fill is `bg-{variant}` (`bg-primary`, `bg-destructive`, `bg-success`; and
  for `secondary`, `bg-foreground`). The resting label is `text-{variant}` (for secondary,
  `text-secondary-foreground`).
- **The label is drawn twice**, once on the surface in the variant colour and once inside the fill
  in `text-{variant}-foreground`. The fill is a clipped `Animated.View`
  (`overflow-hidden absolute inset-y-0 start-0`) whose width is `progress * width`. The inner
  label copy is laid out at the button's **measured full width** (`onLayout`), so both copies
  wrap identically and the wipe boundary falls inside a glyph. A single label under a translucent
  wash goes muddy at the boundary, which is where the eye is.
- **On completion**, the labels cross-fade out and `ProgressButton.Done` (default: a
  `IconCheckmark2Small` (or the nearest Central tick) at `size-icon-{size}` in the fill
  foreground) fades and scales in. If the caller writes `<ProgressButton.Done>` it replaces the
  default, so a `Done` part is lifted out of children by type.
- `isDisabled`: `opacity-50` and the gesture is off. The fill never starts.

## Behaviour

- Gesture: Gesture Handler `LongPress` is the wrong tool here (it fires once). Use a
  `Gesture.Manual()` or a `Gesture.Pan().minDistance(0)` with `onBegin` / `onFinalize`, and
  `shouldCancelWhenOutside(false)`. Allow 16pt of drift (`maxDist`), because a hand resting on a
  control for two seconds moves.
- On begin, `progress.value = withTiming(1, { duration: remaining(progress.value), easing: linear })`.
  `remaining = holdDuration * (1 - p)`, so a second attempt resumes rather than restarting.
- On release before 1, `withTiming(0, { duration: holdDuration * p })`: the same rate, played
  backwards.
- **Completion is read from the animation**, in the timing callback (`finished === true` at 1),
  then `scheduleOnRN(complete)`. It never comes from a JS `setTimeout` running alongside. Two
  clocks disagree under load.
- Once completed, release does not drain. Further presses are ignored until a reset, either from
  `isAutoReset` after `autoResetDelay`, or from a controlled `isCompleted` going `false`. A reset
  **travels** back (`withTiming(0)`); it is never set to 0.
- Haptic: `playHaptic(haptic)` on begin, and `playHaptic("success")` on completion when `haptic`
  is set.

## Reduced motion

`useReducedMotion()` → the fill advances in **five discrete steps** (`Math.floor(p*5)/5` applied
in the animated style) rather than sweeping. It stays an indicator, because a control that asks
you to wait and shows nothing is broken.

## A11y

- `accessibilityRole="button"`, `accessibilityHint` (the default says it must be held), and
  `accessibilityState={{ disabled, checked: isCompleted }}`.
- `accessibilityActions=[{ name: "activate" }]`. On `activate`, complete immediately. A screen
  reader cannot hold, and the hint announces the action. **Decision:** activate completes,
  matching SlideButton, so the action is reachable at all. Record it in AGENTS.md.

## Pure logic (`progress-button.variants.ts` + test first)

- `resolveHoldDuration(ms?: number): number` → default 2000, floor 200, and a non-finite value
  gives the default.
- `resolveRemainingDuration({ holdDuration, progress }): number` for forward and reverse.
- `resolveSteppedProgress(p, steps = 5)`: stepping for reduced motion. Pure TS; the worklet
  restates it inline (worklet bodies must be self-contained). Test the TS copy.
- `progressButtonVariants`, a slotted `tv`: `root`, `fill`, `label`, `fillLabel`, `done`, with
  axes `variant × size × shape × isFullWidth × isDisabled`. Test that every token named exists in
  both themes (copy the pattern from `bottom-sheet.variants.test.ts` / `theme-tokens.test.ts`).

## Files

`progress-button/`: `index.ts`, `progress-button.tsx`, `progress-button-label.tsx`,
`progress-button-done.tsx`, `progress-button.context.tsx`, `progress-button.variants.ts`,
`progress-button.variants.test.ts`, `AGENTS.md`.

## Playground demos (`demos/progress-button/`)

`hold-to-erase` (hero, capture), `variants` (capture), `sizes` (capture), `shape-rounded`
(beside an outline Button, capture), `controlled` (async submit with `isCompleted`), `auto-reset`,
`custom-done`, `disabled`.

## Docs

`progress-button.mdx` under `---Actions---`. Use `icon: Hand` or the nearest lucide name that the
docs `icon` frontmatter accepts; check what the neighbours use.

## Acceptance checklist

- [ ] Holding for `holdDuration` fires `onComplete` exactly once, and releasing at 90% does not.
- [ ] Release mid-way plays back at the same rate. Re-pressing resumes from the current point.
- [ ] Completion is driven off the animation's finish callback (no `setTimeout` for completion).
- [ ] The label stays readable across the wipe in light and dark for every variant (double label).
- [ ] Default tick appears on completion. A custom `Done` replaces it.
- [ ] `isAutoReset` and controlled `isCompleted` rewind by travelling.
- [ ] Reduced motion steps in fifths.
- [ ] Screen-reader activate completes. Role, hint and checked state are announced.
- [ ] Docs, demos, AGENTS.md, registry, changeset (minor) and gen-exports are done.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green.
