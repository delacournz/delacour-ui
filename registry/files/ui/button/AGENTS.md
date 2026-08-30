# Button

A pressable action, composed from parts rather than configured by flags —
compound root plus `Button.Label`, `Button.StartContent` and `Button.EndContent`.
The reference implementation for the patterns in the package
[AGENTS.md](../../../AGENTS.md).

`import { Button } from "@registry/ui/button";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@registry/ui/button` |
| `button.tsx` | Root + the `Object.assign` compound surface |
| `button-label.tsx` | `Button.Label` |
| `button-start-content.tsx` | `Button.StartContent` |
| `button-end-content.tsx` | `Button.EndContent` |
| `button.context.tsx` | `ButtonContext`, `useButton()`, `useButtonContext()`, `useButtonPart()` |
| `button.types.ts` | Prop types shared by two or more parts |
| `button.variants.ts` | Pure `tv()` slots, no RN imports |
| `button.variants.test.ts` | |

## Design

- **Variants**: `primary`, `secondary`, `tertiary`, `outline`, `ghost`,
  `danger`, `danger-soft`. **Sizes**: `sm`, `md`, `lg`.
- **Icons are composed, never passed as props.** Put an `Icon` in the children,
  before or after the label. The button wraps its subtree in an
  `IconDefaultsProvider` carrying `buttonVariants({ size }).icon()` and
  `BUTTON_FOREGROUND_TOKEN[variant]`, so a bare `<Icon icon={IconPlus} />`
  comes out the right size and colour with nothing said at the call site. An
  explicit `size` or `color` on the icon still wins. `Button.StartContent` /
  `Button.EndContent` remain for wrapping non-icon content.
- **The corner is a token on the size axis, and nothing else sets one.** Each
  size names `rounded-button-{size}` — half its own height, so a button is a
  capsule and an icon-only one a circle. Keeping it out of the base and off
  every variant means exactly one `rounded-*` reaches the root, so a caller's
  `className="rounded-lg"` has a single class to beat and tailwind-merge is
  never picking between two. The shape is a default rather than a law: three
  numbers in `tokens.css` square the whole kit off without touching a
  component. Values above half the height are clamped by the renderer, which is
  why `tokens.test.ts` holds them under it.
- **`isIconOnly`** gives a square footprint. Always pair it with an
  `accessibilityLabel`; there is no text for a screen reader to fall back on.
- **String children** are wrapped in a `Button.Label` automatically. React
  Native crashes on bare text outside a `<Text>`, so never render a raw string
  in a component that accepts free-form children without doing the same. Note
  that *consecutive* strings collapse into one label — `Row {i}` is a single
  piece of text, and wrapping each part separately would space them apart by
  the button's own `gap`.
- **A button is a [`Pressable`](../pressable/AGENTS.md).** `ButtonProps` extends
  `PressableProps`, so `feedback`, `haptic` and the rest are inherited rather
  than restated; only the default differs, `scale`. It carried a narrowed
  `ButtonFeedback` union for a while — that is gone, because a second definition
  of a prop the button does not change is a definition that can drift. **Do not
  add ripple, ink, glow or highlight overlays** — no wash layers on pressables
  in this library. That rule is about wash layers, not the opacity axis, which
  `fade` and `scale-fade` are welcome to use.
- **`isLoading` replaces the icon on its own side, it does not join it.** The
  spinner takes the place of the composed `Icon` at the edge `spinnerPlacement`
  names — the first child at `start`, the last at `end` — so the label does not
  shift when work begins and shift back when it ends. The swap costs no layout
  because both glyphs are drawn at the button's own `size-icon-*` token: the
  root publishes one class and the icon and the spinner both read it. **An icon
  on the other side is not taken.** A button with one leading icon and
  `spinnerPlacement="end"` keeps the icon and gains a spinner at the end; taking
  the only icon whichever side it sat on used to draw the spinner opposite the
  side that was asked for. With no icon at that edge the spinner is inserted, as
  it always was. Only a bare `Icon` is swapped; a `Button.StartContent` wraps
  content of unknown height, and replacing one could resize the button.
  `resolveSpinnerSwapIndex` is the pure decision and is unit-tested.
- **`isLoading`** composes a `Spinner` in and blocks presses. Placement is
  `spinnerPlacement`: `start` (default), `end`, or `only` — which drops the
  children and centres the spinner in the footprint the button already has,
  carrying the label onto `accessibilityLabel` so a screen reader still has a
  name to read. `only` never squares the button on its own; pair it with
  `isIconOnly` when a square is what you want.
- **Loading is not disabled.** `isLoading` blocks the press and announces the
  button as *busy*, but keeps full contrast: the spinner already says the press
  landed, and dimming reads as "this control is unavailable". `isDimmedWhileLoading`
  opts into the faded treatment where a caller wants it.
- **A stretched button does not change width while loading**, because `only`
  keeps its footprint. In a *content-width* container — a `flex-row` — it still
  shrinks to the spinner, and that snap is un-animated on purpose: Pressable's
  `Animated.View` already runs a `useAnimatedStyle` on `opacity` and `transform`,
  and a native layout transition on the same view fights it for prop ownership.
  A caller who needs a stable width in a row pins it (`w-full`, `min-w-*`).
- **A definite width defeats `alignItems: stretch`.** A stretch-aligned child
  with a definite cross size resolves to cross-*start*, not centre — so any
  control that conditionally takes a fixed width inside a gap column jumps to
  the left edge unless it also sets `self-center`. This is what made an earlier
  `only` implementation collapse a full-width button into a small box flush
  left. Prefer not taking the width at all.
