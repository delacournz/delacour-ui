# ToggleButton

A button that stays pressed — on its own, or as one of a group that owns the
selection. Compound root plus `ToggleButton.Label` and `ToggleButton.Group`.

`import { ToggleButton } from "@delacour/react-native-ui/toggle-button";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/toggle-button` |
| `toggle-button.tsx` | Root + the `Object.assign` compound surface |
| `toggle-button-label.tsx` | `ToggleButton.Label` |
| `toggle-button-group.tsx` | `ToggleButton.Group`, which owns the selection |
| `toggle-button.context.tsx` | `ToggleButtonContext` and `ToggleButtonGroupContext`, with their hooks |
| `toggle-button.variants.ts` | The appearance table, the group's `tv()` and three pure resolvers |
| `toggle-button.variants.test.ts` | |

There is no `toggle-button.types.ts`: every prop type here has exactly one
consumer, so each lives beside the component it types. See
[Compound component layout](../../../AGENTS.md#compound-component-layout).

## Design

- **Variants**: `default`, `outline`, `ghost`. **Sizes**: the button's own —
  `sm`, `md`, `lg` and the square `icon-sm`, `icon-md`, `icon-lg`. **Selection
  modes**, on the group: `multiple` (default) and `single`. **Layouts**, on the
  group: `attached` (default) and `detached`. **Orientations**, on the group:
  `horizontal` and `vertical`.
- **A toggle is a `Button`, and owns no paint.** Each state names a button
  variant — `TOGGLE_BUTTON_APPEARANCE` — and the toggle renders a `Button` with
  whichever one applies. The fill, the border, the label colour, the colour a
  composed `Icon` inherits, the corner, the loading spinner and the press
  feedback all come from the button, so there is no second table of colours
  here to drift from it. Every button variant draws the same `border` box, so
  switching state never resizes the toggle. A test asserts every entry names a
  real button variant and that `on` never equals `off`.
- **No state is destructive.** A pressed toggle is a choice, not a warning; the
  appearance table never names `destructive` or `destructive-soft`, and a test
  holds it there.
- **A square is a size, not a flag.** `size="icon-md"` is the button's own
  square step — there is no `isIconOnly`. Always pair one with an
  `accessibilityLabel`.
- **The state is announced, not only drawn.** `resolveToggleButtonAccessibility`
  makes a standalone toggle, or a member of a `multiple` group, a
  `togglebutton` with `accessibilityState.checked` — read out as on or off. A
  member of a `single` group is a `radio` with `accessibilityState.selected`,
  and that group is a `radiogroup`: announcing an either-or option as a toggle
  promises that pressing it again turns it off, which a group with
  `isSelectionRequired` refuses to do. A `multiple` group has no role, the same
  call `Button.Group` makes.
- **The toggle keeps the role, the state and the press handler.**
  `accessibilityRole`, `accessibilityState` and `variant` are `Omit`ted from its
  props, and the three it computes are set *after* the caller's spread, so
  nothing passed in can make the announced state and the drawn state disagree.
  A caller's `onPress` still runs — first, before the state moves, so a
  handler reading the state it closed over sees what the toggle was when
  pressed.
- **A toggle works with or without a group.** On its own it is `isSelected` +
  `onSelected`, or uncontrolled from `defaultSelected`, through
  `useControllableState`. Inside a `ToggleButton.Group` its `value` identifies
  it, the group owns the state, and its own `isSelected` is ignored. The hook is
  still called in a group — a hook may not sit behind a branch — and its state
  is never read. A grouped toggle with no `value` can never be selected, and
  warns in development.
- **Children may be a function of the state.** `{({ isSelected }) => …}` is
  for content that changes with the toggle — a label that reads *Saved* once
  pressed, a glyph that swaps. `useToggleButton()` answers the same question
  for a custom child that would rather read context.
- **`ToggleButton.Label` is a `Button.Label` with a part check.** The colour is
  already right — the toggle hands its button the variant for the state it is
  in — so the part adds nothing but an error that names the toggle when it is
  rendered outside one.

## ToggleButton.Group

- **State is one array of the members' `value`s**: `selected` + `onSelected`,
  or `defaultSelected` alone. `resolveToggleSelection` is the whole decision
  and is pure: `multiple` adds or removes the one pressed, keeping press order;
  `single` replaces the selection with it; a re-press in `single` clears it.
- **`isSelectionRequired` keeps an answer on the board.** The last selection
  cannot be cleared, in either mode. A segmented choice like text alignment
  always has one.
- **A press that changes nothing notifies nobody.** The resolver returns
  `null` rather than the same list back, so `onSelected` is never called with a
  value the caller already holds — the rule `Radio.Group` keeps for a re-press
  of the current option.
- **A controlled `single` group handed several values collapses** to the one
  pressed rather than carrying the others along.
- **`attached` is a `Button.Group`, not a copy of one.** The toggles join into
  one run with the button's own corner squaring, hairline seam and fade-not-scale
  feedback, and `Button.Group.Separator` works between two of them. Restating
  any of that here is how the two runs would stop matching. An attached group
  therefore owns the size *step* outright — controls of different heights do not
  join — while a square member stays square (`resolveGroupedButtonSize`).
- **`detached` is a wrapping row, or a column, spaced by a gap** — the one thing
  an attached run must never have. It is the shape for a row of filters. The
  classes are compound cells on `layout` × `orientation`, and an attached group
  emits none of them.
- **The axes are defaults, not overrides.** `variant`, `size`, `isDisabled` and
  `haptic` are published raw, so a member's own value wins and one option can
  disable itself inside a group that did not — `own ?? group ?? default`, the
  `Checkbox.Group` ladder.
- **The group paints nothing.** A disabled group publishes `isDisabled` and each
  member fades itself; a group fading too would compound the two.
