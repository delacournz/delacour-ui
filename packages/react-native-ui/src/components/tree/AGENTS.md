# Tree

A hierarchy opened one level at a time — a file browser, nested settings, a category
picker, a table of contents. Compound root plus `Tree.Item`, `Tree.Trigger`,
`Tree.Indicator`, `Tree.Icon`, `Tree.Label`, `Tree.Actions` and `Tree.Group`. Expansion
and selection are independent: branches open and close, and optionally one or many nodes
are selected.

`import { Tree } from "@delacour/react-native-ui/tree";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/tree` |
| `tree.tsx` | Root — the expanded set, the selection, and the `Object.assign` |
| `tree-item.tsx` | `Tree.Item` — the branch test, the depth, and the layout transition |
| `tree-trigger.tsx` | `Tree.Trigger` — the row, its `Pressable` body, and `splitChildren` |
| `tree-indicator.tsx` | `Tree.Indicator` — the chevron and its quarter turn, or a spacer on a leaf |
| `tree-icon.tsx` | `Tree.Icon` |
| `tree-label.tsx` | `Tree.Label` |
| `tree-actions.tsx` | `Tree.Actions` |
| `tree-group.tsx` | `Tree.Group` — the children, the depth they read, and the guide line |
| `tree.context.tsx` | The tree's, the item's and the level's contexts, with their hooks |
| `tree.types.ts` | `TreeSlotProps`, shared by `Tree.Icon` and `Tree.Actions` |
| `tree.variants.ts` | Pure `tv()` slots, the constants and every resolver — no RN imports |
| `tree.variants.test.ts` | |

## Design

- **Sizes**: `sm` (36pt rows) and `md` (44pt, the default). Size moves the row height, the
  label's `Text` step, the glyph step and the indicator's column, on one axis. There is
  no variant axis: a tree sits on whatever surface holds it — a `Card`, a sheet, a screen.
- **A selected row is filled `bg-accent` and its label, icon and chevron turn
  `accent-foreground`.** `resolveTreeForeground` names the token a composed `Icon` gets and
  the suite asserts the `label` slot emits `text-<that token>` and that `theme.css` declares
  it — the `Steps` pattern, so a numeral and a glyph can never drift apart.
- **The chevron is a step quieter than the label** (`muted-foreground`) until the row is
  selected, when both are `accent-foreground` — a muted glyph on an accent fill reads as
  disabled.
- **The disabled fade lands on the outer row, never the `Pressable` body.** `Pressable`'s
  `Animated.View` writes `opacity` every frame — see [`Radio`](../radio/AGENTS.md). A root
  `isDisabled` either way wins over an item's own (`resolveTreeDisabled`), the radio
  group's ladder.
- **Start and end only.** The indent is `paddingStart`, the guide line is placed with
  `start`, the slots use `ps-*`/`pe-*`, and a test fails on any `left`/`right` utility.
  Under right-to-left the chevron is mirrored and turns −90° to reach the same "down".

## Depth comes from context

- **A node is one level deeper than the group it sits in.** The root provides level 0 and
  each `Tree.Group` re-provides its own item's level, so an item reads `parent + 1` and
  nesting is written, never counted. There is no `level` prop.
- **`level` is one-based**, so a top-level row is "Level 1" to VoiceOver, the way an
  outline is numbered. The spec wrote `resolveTreeIndent(level, indent)` as "level 0 → 0";
  with one-based levels it is `(level - 1) * indent`, clamped, so level 0 and level 1 both
  sit at the edge.
- **A node is a branch when a `Tree.Group` is among its direct children**, or when
  `hasChildren` says so. The children are walked the way `Steps` counts its items: a
  `.map()` is flattened and seen, a group behind a wrapper component of the caller's own is
  not — pass `hasChildren` then.
- **`hasChildren` is lazy loading.** The indicator shows and the row announces `expanded`
  before any group exists; the caller fetches in `onExpandedChange` and renders the group,
  or a loading row, once it has something.

## The row

- **A row is three siblings: indicator, body, actions.** `Tree.Trigger` lifts a
  `Tree.Indicator` and any `Tree.Actions` out of its children wherever they were written and
  renders them beside the `Pressable` body, never inside it. Two nested tap gestures race
  for one touch, and an action merged into the body's accessibility element could not be
  reached by VoiceOver at all — `Steps.Panel`'s lesson. Siblings have neither problem: the
  chevron always toggles, an action's tap never reaches the row, and an action is its own
  element.
- **An indicator is composed in when the children hold none**, and on a leaf it is the
  same width of nothing, so every label lines up whether its row is a branch or not.
- **`resolveTreeRowPress` is the whole press rule.** A branch toggles while
  `expandOnPress` is on; any row selects while the tree selects. `expandOnPress={false}`
  makes the row select-only and leaves opening to the chevron — so selecting a branch
  never opens it. A caller's `onPress` runs after. With nothing to do the body has no
  handler and plays no haptic.
- **`single` keeps a re-pressed node selected.** `Radio.Group`'s rule: a stray tap never
  leaves the tree with nothing chosen, and `onValueChange` is not called for a change that
  did not happen. `multiple` toggles, as a flat set.
- **The indicator's column is narrower than a touch target**, so it takes a symmetric hit
  slop out to 44pt on both axes (`resolveTreeIndicatorHitSlop`). Where that slop overlaps
  the body, the body is later in the tree and wins the touch; the slop's real reach is into
  the indent.
- **`className` styles the outer row; every other prop reaches the body**, as on
  `Steps.Item` — `testID` and the accessibility props belong to what is pressed.

## Guide lines

- **`hasLines` draws one hairline per open group**, absolutely positioned down its start
  edge under the branch's own indicator — `resolveTreeLineOffset`: the row inset, the
  branch's indent, half the indicator column, less half the hairline. A child sits one
  indent deeper, so the line runs through the space its children were moved in by.
- **The numbers are pinned against the classes.** `TREE_ROW_INSET`, `TREE_INDICATOR_WIDTH`
  and `TREE_ROW_HEIGHT` are restated in TypeScript because an inline style needs points;
  the suite reads `pe-2`, `w-5`/`w-6` and `min-h-9`/`min-h-11` back out of the slots, so a
  retuned class fails the suite instead of moving the line off its chevron.
- **The line is drawn over the rows, with `pointerEvents="none"`,** so a selected row's
  fill does not cut it, and hidden from assistive technology like `Separator`.

## Motion

- **The chevron turns a quarter on `Collapsible`'s spring**, restated as `TREE_SPRING` and
  pinned equal by the test — imported, `delacour add tree` would copy a collapsible in
  too. Reanimated's default reduce-motion policy snaps it.
- **A closed group unmounts.** A tree of a few hundred nodes would otherwise hold every row
  of every closed folder in the layout pass. Expansion lives on the root, so reopening a
  folder restores whatever was open inside it. This is a deliberate difference from
  `Accordion`, which measures and clips a panel that stays mounted: an accordion panel is
  one block of content, a tree group is an unbounded number of rows.
- **A group fades in; the rows below make room on a `LinearTransition`** sprung with the
  same constants. Both are dropped under reduce motion, so the change is a cut. The
  transition is confined to the tree's own items — content below the tree jumps to its
  new place.

## Accessibility

- **The root is a `list`; each row's body is one `button` element**, whose name is its
  text. `resolveTreeAccessibility` is the one source: `expanded` on a branch only, `selected`
  only when the tree selects, `disabled` always, and `accessibilityValue.text` "Level 2" —
  VoiceOver reads "src, Level 2, collapsed, button".
- **A branch offers `expand` or `collapse` as a custom action** — only the one that
  applies, and none while disabled. `resolveTreeAccessibilityAction` refuses an action that
  would change nothing.
- **The chevron and the guide lines are hidden from assistive technology.** They restate
  what the row already announces.

## What it does not do

- **No tri-state cascade.** Multi-select is a flat set: selecting a folder does not select
  its files, and a folder with some files selected is not "mixed". A caller can put a
  `Checkbox` in `Tree.Icon` and drive it from `value`.
- **No virtualisation.** Expect a ceiling of a few hundred visible rows. The future path is
  to flatten the open nodes into a list of `{ value, level }` and render them with a
  `LegendList`, which this compound shape would sit on unchanged from a caller's side.
- **No keyboard or arrow-key navigation** — it is a touch component.
- **No drag to reorder.**
