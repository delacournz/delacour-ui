# SelectionMode

Pick several things at once — messages to archive, people to share with,
swatches to apply — then act on them from a bar. A compound root plus
`SelectionMode.Item`, `.Indicator`, `.Header`, `.Bar`, `.Action` and `.Group`,
and `useSelectionMode()`.

`import { SelectionMode } from "@delacour/react-native-ui/selection-mode";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/selection-mode` |
| `selection-mode.tsx` | Root — owns the mode and the selection — plus the `Object.assign` compound surface |
| `selection-mode-item.tsx` | `SelectionMode.Item`: wraps a child, decides what a press does, slides the leading mark in |
| `selection-mode-indicator.tsx` | `SelectionMode.Indicator`, the round mark, and the internal `ring` (`DelacourUI.SelectionMode.Item.Ring`) |
| `selection-mode-header.tsx` | `SelectionMode.Header`: close, the count and select-all, while the mode is on |
| `selection-mode-bar.tsx` | `SelectionMode.Bar`: the absolute action bar over the bottom edge |
| `selection-mode-action.tsx` | `SelectionMode.Action`: an icon over a label, handed the selection |
| `selection-mode-group.tsx` | `SelectionMode.Group`: a stacked card, a grid or a horizontal strip |
| `selection-mode.context.tsx` | The selection context and the per-item context, with their hooks |
| `selection-mode.types.ts` | `SelectionModeState` — what the root builds and the context carries |
| `selection-mode.variants.ts` | The slotted `tv()`, the motion constants, the tokens and every pure resolver |
| `selection-mode.variants.test.ts` | |

## Design

- **Axes**: `indicator` (`leading` default, `ring`, `none`) on an item;
  `placement` (`edge` default, `floating`) on the bar; `isSelected` and
  `isDestructive` drive the indicator's fill and an action's colour.
- **Selection is a set of ids, never indices.** A `string[]` in the order things
  were picked. An index changes meaning the moment a list is sorted, filtered or
  paged; an id does not, so a selection survives a refetch.
- **It is a mode, not a property of each row.** Off, the list is for reading and
  each item runs its own `onPress`. A long press turns the mode on with that item
  picked; then a press toggles and the row's own handler does not run.
  `resolveItemPress` is the whole decision and is pure.
- **A disabled item keeps its own press, even while the mode is on.** It never
  toggles and never starts the mode, but a section header or a "load more" row
  still has to work while someone is picking.
- **Exit clears an uncontrolled selection and leaves a controlled one alone.**
  The close button and `exit()` call `setActive(false)`; only when `selected` is
  uncontrolled do they also clear. A caller that owns `selected` may want to keep
  it — a draft that survives leaving the mode — and clearing behind its back
  would fight it.
- **Both pairs are controllable.** `isActive`/`defaultActive`/`onActiveChange`
  and `selected`/`defaultSelected`/`onSelectedChange`, through
  `useControllableState`. A change that changes nothing — a toggle refused at
  the cap, a select-all with nothing left to add — notifies nobody
  (`resolveIsSameSelection`), the rule `ToggleButton.Group` keeps.
- **`max` caps toggling and select-all, and never takes a pick away.** An
  unpicked item at the cap does not go on, but a picked one still comes off, so
  the way out of a full selection is always open. Select-all fills up to the cap
  keeping existing picks first, and never drops a controlled pick that is already
  past it.
- **Select-all flips to "Deselect all" at the cap, not only at the total.**
  `resolveIsAllSelected` is true once every value is picked or once the cap is
  reached below the total — past that point select-all would do nothing, and a
  control that does nothing reads as broken.
- **`values` is optional, and the header degrades without it.** With it the
  label is `"{title} · n of m"` and select-all shows; without it the label is
  `"n selected"` and select-all is dropped, because there is nothing to pick all
  of.
- **The indicator is round on purpose.** A square box is a form control being
  filled in; a round one is a thing picked out of a set. `Checkbox` stays square.
  22pt (`size-5.5` — the icon scale skips 22), `border-2 border-border`, picked
  `bg-primary` with a `primary-foreground` check. It pops from 0.8 on a spring.
- **The leading mark pushes the content rather than covering it.** A spacer
  opens from 0 to 34pt (`SELECTION_MODE_INDICATOR_OFFSET`, the mark plus a 12pt
  gap) and the mark is drawn *after* the content, absolutely positioned over the
  gap, so a child with a fill of its own never paints over it. A picked leading
  row also takes `bg-primary/5`.
- **`ring` draws a 2pt primary ring a 2pt gap outside the item** (`-inset-1`)
  with a small check badge at the top-end. Its corner is `rounded-xl` by default;
  `ringClassName` reshapes it — `rounded-full` around a round swatch. That prop
  is an addition: a ring that cannot match the item's own corner looks wrong on
  anything round.
- **`none` draws nothing.** The caller reads `useSelectionMode().isSelected` and
  paints its own state, or places a `SelectionMode.Indicator` itself.
- **The bar is absolute, over the list.** It never shrinks the list, so the list
  must pad its own bottom (`pb-24`). It is hidden while nothing is picked unless
  `isShownWhenEmpty`, and never shown with the mode off. `edge` pads its own
  bottom with the safe-area inset (at least 8pt); `floating` lifts the whole
  card by the inset instead, so the card keeps its own padding.
- **An action is handed the selection as it stands at the press.** A handler
  that closed over `selected` would see a stale list; `onPress(selected)` cannot.
  `isExitOnPress` exits afterwards — a delete, whose picks no longer exist.
- **The root fills the height it is offered** (`flex-1`). Give it one: inside a
  `ScrollView` with no height the bar has no bottom to sit on. An `h-*` class on
  the root itself is not enough — `flex-1` sets a zero basis, and in a parent
  with no height of its own the root collapses to nothing. Size the parent, or
  add `flex-none` to a root that should take its content's height (an always-on
  picker with no bar).
- **Haptics are off by default.** `haptic` plays on entering the mode and on each
  toggle that changed something — called from JS through `playHaptic`, since
  neither moment is a gesture callback.
- **Every part but the root throws outside a `SelectionMode`**, by name.
- **The header's two controls take their own `testID`s** — `closeTestID` and
  `selectAllTestID` — the way `Alert` and `Chip` forward one to their close
  control. A `testID` on the header lands on its row, and a test that has to
  leave the mode cannot reach a button the component draws for itself.

## Motion

- Indicator: the check fades in 200ms and the mark pops on a spring. The leading
  spacer opens on the same spring while the mark fades.
- Header: fades in from 8pt above (`FadeInDown` with an 8pt initial value).
- Bar: slides up and fades in (`FadeInUp`), fades out downward.
- **Reduced motion is opacity-only, 150ms, and never disappears.** Every
  transition sets `ReduceMotion.Never` on its 150ms fade, because under the
  default policy a fade completes instantly — and the fade *is* the information
  that the mode changed. The spacer snaps rather than sliding.

## Accessibility

- **While the mode is on, an item is a checkbox.** `accessibilityRole="checkbox"`,
  `accessibilityState={{ checked, disabled }}`, hint "Double-tap to select".
  `resolveItemAccessibility` is the decision and is pure.
- **While off, an item keeps the semantics of what it wraps** — a `button` when
  it has an `onPress`, no role otherwise — and offers a `longpress` action
  labelled "Start selecting", so the mode can be entered without the gesture. A
  disabled item offers nothing it cannot do.
- **The count is announced.** The header label is a polite live region on
  Android; iOS has none, so the header calls
  `AccessibilityInfo.announceForAccessibility` when the label changes.
- **A group's `label` is its `accessibilityLabel`**, and a grid or strip is a
  `list`.

## Group

- **`resolveGroupLayout` decides the shape.** `isHorizontal` is a strip and wins
  over `columns`; two or more columns is a grid (floored); otherwise a stack.
- **A stack is a card** (`rounded-lg border border-border bg-card`) with a
  `Separator` between rows unless `hasSeparators={false}`.
- **A grid measures itself.** Each cell is `resolveGridItemWidth` — the measured
  width less the gaps, split evenly — and nothing renders until the first layout,
  so no cell flashes at the wrong width. `hasSeparators` does not apply.
- **A strip pads its scroll content by 8pt** so a ring and its badge are not
  clipped by the scroll view.

## Out of scope

- **`SelectionMode.Sheet`.** Importing `../bottom-sheet` would force the optional
  sheet engine and `react-native-teleport` on every consumer of this component.
  The `in-a-sheet` demo shows the composition instead: `SelectionMode` wraps the
  `BottomSheet` (context reaches through the portal), the items go in the sheet's
  scroll view, and the bar goes in `BottomSheet.Footer sticky` as
  `className="relative border-t-0 bg-transparent"` with `isSafeAreaAware={false}`. A
  first-class part is a follow-up, possibly on its own subpath.
- **Drag to select a range.** A pan across rows would fight the list's own
  scroll; not in v1.
- **Replacing the screen's navbar.** The header renders where it is placed; a
  screen that wants it in place of its navbar hides the navbar itself while
  `isActive`.
