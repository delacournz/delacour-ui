# NAV-03 — Tree

`import { Tree } from "@delacour/react-native-ui/tree";`

## Purpose on mobile

A hierarchy you open one level at a time: a file browser, nested settings, a category picker, a
table of contents. Branches expand and collapse; optionally one or many nodes can be selected.
Selection and expansion are independent.

## API

```tsx
<Tree selectionMode="single" value={selected} onValueChange={setSelected} hasLines>
  <Tree.Item value="src">
    <Tree.Trigger>
      <Tree.Indicator />
      <Tree.Icon><Icon icon={IconFolder1} /></Tree.Icon>
      <Tree.Label>src</Tree.Label>
      <Tree.Actions><Badge>3</Badge></Tree.Actions>
    </Tree.Trigger>
    <Tree.Group>
      <Tree.Item value="src/index.ts">
        <Tree.Trigger><Tree.Label>index.ts</Tree.Label></Tree.Trigger>
      </Tree.Item>
    </Tree.Group>
  </Tree.Item>
</Tree>
```

```ts
type TreeSize = "sm" | "md";

type TreeSelection =
  | { selectionMode?: "none" }
  | { selectionMode: "single"; value?: string | null; defaultValue?: string | null; onValueChange?: (value: string | null) => void }
  | { selectionMode: "multiple"; value?: readonly string[]; defaultValue?: readonly string[]; onValueChange?: (value: string[]) => void };

type TreeProps = ViewProps & TreeSelection & {
  size?: TreeSize;                          // default "md"
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (expanded: string[], details: { value: string; isExpanded: boolean }) => void;
  /** Pressing the row (not just the chevron) toggles a branch. */
  expandOnPress?: boolean;                  // default true
  /** Hairline guides from a branch to its children. */
  hasLines?: boolean;                       // default false
  /** Points per nesting level. */
  indent?: number;                          // default 16
  isDisabled?: boolean;
  haptic?: false | HapticFeedback;          // default "selection"
  className?: string;
};

type TreeItemProps = ViewProps & {
  value: string;
  isDisabled?: boolean;
  /** Mark as a branch before its Group is rendered — lazy loading. */
  hasChildren?: boolean;
  className?: string;
};
```

`Tree.Trigger` (Pressable row), `Tree.Indicator` (chevron; always toggles), `Tree.Icon`,
`Tree.Label`, `Tree.Actions` (trailing; its presses do not reach the row), `Tree.Group`
(children container — rendered only while its item is expanded).

## Context

- `TreeContext` (root): size, selection, expanded set, toggle/select fns, indent, lines.
- `TreeItemContext` (per item): `value`, `level` (parent level + 1, from the nearest enclosing
  `Tree.Group`), `isBranch` (`hasChildren` or a `Tree.Group` child found by walking direct
  children), `isExpanded`, `isSelected`, `isDisabled` (root wins), `setSize`/`posInSet` not needed.

## Pure logic (`tree.variants.ts`)

- `toggleExpanded(expanded, value)` → new array.
- `resolveSelection(mode, current, value)` → next selection (`single`: re-press keeps it
  selected — no deselect — matching `Radio.Group`; `multiple`: toggles; `none`: unchanged).
- `isNodeSelected(mode, current, value)`.
- `resolveTreeRowPress({ isBranch, expandOnPress, selectionMode })` →
  `{ toggle: boolean; select: boolean }`.
- `resolveTreeIndent(level, indent)` → `paddingStart` points (level 0 → 0).
- `resolveTreeAccessibility({ isBranch, isExpanded, isSelected, selectionMode, isDisabled, level })`.
- `treeVariants` slots `root`, `item`, `trigger`, `indicator`, `icon`, `label`, `actions`,
  `group`, `line`; axes `size` (`sm` 36pt row / `md` 44pt), `isSelected`
  (`bg-accent` / `text-accent-foreground`), `isDisabled` (opacity on content, not on the
  `Pressable` — see the Radio/Steps note about `Pressable`'s animated opacity).

## Motion

- Indicator rotates 0→90° (RTL: 0→−90°) with the Collapsible spring constants restated (not
  imported — registry rule, see Collapsible AGENTS.md); snaps under reduce motion.
- Group enters with Reanimated `FadeIn` + short height via `LinearTransition` on siblings below;
  closed groups **unmount** (performance with large trees). Reduce motion: no layout animation.

## Accessibility

- Root `accessibilityRole="list"`; each trigger is one element (`accessible`) with
  `accessibilityRole="button"`, `accessibilityState={{ expanded, selected, disabled }}`
  (expanded only on branches), `accessibilityValue.text` "Level 2".
- `accessibilityActions` `expand`/`collapse` (custom) on branches.
- Lines and indicator hidden from AT.
- RTL: `paddingStart`, start-edge border for lines.

## Reuses

`Pressable`, `Text`, `Icon` (`IconChevronRight`), `useControllableState`. Collapsible's spring
numbers restated and pinned in its test.

## Decisions

- No tri-state checkbox cascade in v1 (recorded in README). Multi-select is a flat set.
- No virtualisation in v1. AGENTS.md states the expected ceiling (~ a few hundred visible rows)
  and points at flattening to a `LegendList` as the future path.
- No keyboard/arrow navigation (mobile).

## Playground demos

`file-browser` (hero, capture), `single-select` (capture), `multi-select` (capture),
`lines` (capture), `sizes` (capture), `lazy-load` (`hasChildren` + spinner while fetching),
`controlled-expanded`.

## Acceptance

- [ ] Pure resolvers fully table-tested.
- [ ] Chevron always toggles; `expandOnPress={false}` makes the row select-only.
- [ ] Selecting a branch does not expand it in `selectionMode` + `expandOnPress={false}`.
- [ ] Closed groups unmount; lazy branch shows indicator before children exist.
- [ ] Nesting depth from context, indentation per level, guides when `hasLines`.
- [ ] VoiceOver announces expanded/selected/level.
- [ ] AGENTS.md, Components-table row, gen-exports, registry, demos, docs page, changeset.
- [ ] `bun test`, `bun run typecheck`, `bun run check` green.
