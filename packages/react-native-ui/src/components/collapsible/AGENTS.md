# Collapsible

One section of content, shown and hidden by its own trigger. Compound root plus
`Collapsible.Trigger`, `Collapsible.Title`, `Collapsible.Description`,
`Collapsible.Indicator` and `Collapsible.Content`. It is a single
[Accordion](../accordion/AGENTS.md) item without the group — the same row, the
same measured panel, the same spring — so read that file's **The measured panel**
section first. What follows is only where a standalone disclosure differs.

`import { Collapsible } from "@delacour/react-native-ui/collapsible";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/collapsible` |
| `collapsible.tsx` | Root — owns the open state, `progress`, the measured height and the spring; the `Object.assign` |
| `collapsible-trigger.tsx` | `Collapsible.Trigger`, and the row it assembles from its children |
| `collapsible-title.tsx` | `Collapsible.Title` |
| `collapsible-description.tsx` | `Collapsible.Description` |
| `collapsible-indicator.tsx` | `Collapsible.Indicator`, the one rotation |
| `collapsible-content.tsx` | `Collapsible.Content` — the measured clip |
| `collapsible.context.tsx` | `CollapsibleContext`, `useCollapsible` and the internal part hook |
| `collapsible.types.ts` | `CollapsibleTextProps`, shared by the title, description and trigger |
| `collapsible.variants.ts` | Pure `tv()` slots, the constants, the toggle and the accessibility resolver — no RN imports |
| `collapsible.variants.test.ts` | |

## Design

- **It looks exactly like a one-item `Accordion`, and a test holds it there.**
  Variants (`default`, `secondary`, `tertiary`, `transparent`), sizes (`sm`,
  `md`, `lg`), the trigger's metrics, the type scale, the glyph step and the
  panel's inset are `Accordion`'s class for class. A collapsible and an accordion
  on one screen are the same control at two scales; if either retunes, the test
  fails until the other follows.
- **Its constants are restated, not imported from `../accordion`.** The registry
  derives an item's dependencies from its imports, so importing even the
  accordion's leaf would make `delacour add collapsible` copy an accordion in
  too. The spring, fade, rotation, variants, sizes and glyph step are written
  again here and pinned equal by `collapsible.variants.test.ts` — the test file
  is the only thing that imports both, and tests are not shipped.
- **The root owns the state and the travel.** With no item layer, what
  `Accordion.Item` owns — `progress`, `contentHeight`, the spring, the
  `onMeasured` re-run counter — lives on the root. The race that counter closes
  (`onLayout` landing either side of React's effects) is the same one, so the
  panel reports its first measurement and never starts the spring itself.
- **The disabled fade lands on the root.** Never on the trigger, which is a
  `Pressable` whose `Animated.View` writes `opacity` every frame; the accordion
  fades its item for the same reason, and a collapsible's root is its item.

## State

- **`isOpen` / `defaultOpen` / `onOpenChange`, `BottomSheet`'s names.** One
  boolean through `useControllableState`, so it is controlled or uncontrolled
  from one hook and `onOpenChange` hears the trigger and `toggle()` alike.
- **Disabled refuses the tap in both directions.** `toggleCollapsibleOpen`
  returns the current state while disabled, so a disabled section that is open
  stays open. A disabled control is one that cannot be used, not one that undoes
  itself. The trigger is also a disabled `Pressable`; the pure rule is the second
  line, and it is what keeps a caller's own `useCollapsible().toggle()` honest.
- **A refused toggle reports nothing.** The root compares the next state with
  the current and skips `setOpen`, so `onOpenChange` never fires for a change
  that did not happen.
- **`toggle` and the change callback are ref-backed**, so the context keeps its
  identity across a caller passing a fresh arrow. `Accordion`'s trampoline.

## The trigger

- **A `Pressable` with `fade` and `haptic="selection"`**, `Accordion.Trigger`'s
  two defaults for its two reasons. `onPress` is `Omit`ed: the press *is* the
  toggle, and a side effect belongs on `onOpenChange`, which also hears changes
  the trigger never sees.
- **It assembles its own row** — bare strings become one `Collapsible.Title`,
  titles and descriptions stack in a column, anything else stays on the row, and
  the indicator moves to the end or is composed in when absent. Same rule, same
  limitation: an indicator must be a *direct* `Collapsible.Indicator` child, so
  the indicator takes a render function (`({ isOpen }) => …`) rather than asking
  for a wrapper.

## Accessibility

- **`resolveCollapsibleAccessibility` is the one source.** The trigger announces
  `expanded` and `disabled` from it; the panel takes
  `accessibilityElementsHidden` and `importantForAccessibility` from it. Pure, so
  `bun test` holds the matrix.
- **A closed panel is out of the tree, not just clipped.** It stays mounted after
  its first open, and mounted content is content a screen reader reads. A
  disabled but open panel is still on screen and still read.
- **The root is a plain `View` with no role**, the accordion's rule.
- **Reduce motion is Reanimated's default `System` policy.** With it on, the
  spring completes instantly: the panel snaps between its two states. The state
  is carried by whether the panel is there, so that is the right degradation.
