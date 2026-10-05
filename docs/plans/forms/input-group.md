# Input.Group (extension)

- **Status**: spec, not started
- **Wave**: 1 (independent). Extends the existing `packages/react-native-ui/src/components/input/` folder. No new folder, no new export subpath.
- **Depends on**: existing `input`, `button` (leaf variants/context), `field`, `textarea` (guard lifted). No new peers.

## Decision: it stays `Input.Group`
`Input.Group` with `Prefix` and `Suffix` already ships and already does the core of the job: one box (the `root` slot of `inputVariants`) worn by the group's row, axes owned by the group, Field cascade, press-to-focus, bare-string wrapping, icon colour defaults, `Button.Group` membership. Creating `components/input-group/` would duplicate the box and break the "one slot, two homes" invariant documented in `input/AGENTS.md`. So this spec is a gap-fill inside `input/`. Registry/docs: `input` item and `input.mdx` grow; no new registry item, no new docs page (a new "Input group" section in the existing page).

## Behaviour reference (summary)
Behaviour a grouped field is expected to have:
- Leading and trailing decorators inside the field's box: currency symbols, units, icons, text, buttons, any interactive or presentational content.
- The text never runs under a decorator, however wide it is (decorators take layout space; nothing is overlaid).
- Decorators can be marked purely decorative: touches pass through to the field and screen readers skip them; otherwise they are interactive.
- Disabling the group dims the field and both decorators together.
- Conditional decorators (mount/unmount) leave no stale spacing.

## Gap analysis (reference behaviour vs. what exists)
| Behaviour | Today | Verdict |
| --- | --- | --- |
| Prefix / Suffix content | `Input.Group.Prefix/Suffix`, flex-row so no overlap, no measuring needed, conditional mount is free | Covered; no change. Note: do NOT port measured absolute padding — flex row is strictly better |
| Disabled dims all together | group `isDisabled` fades the box | Covered |
| Decorative decorator (touch pass-through, a11y-hidden) | Not present. Every decorator is an accessible `View`; presses on it bubble to the group `Pressable` which focuses the field (so pass-through already works), but screen readers still read an icon/affix | **Gap 1: `isDecorative`** |
| Interactive decorator (button) | Works by composing `Button`; sizing is ad hoc | **Gap 2: `Input.Group.Button`** convenience |
| Textarea in a group | Explicitly unsupported (`textarea/AGENTS.md`) | **Gap 3** |
| Content above/below the field (toolbar, counter, attachments) inside the same box | Not present (row only) | **Gap 4: `Input.Group.Block`** |
| Divider between decorator and field | Not present | **Gap 5: `Input.Group.Separator`** |
| Text kind with explicit semantics (unit, currency) | Bare strings become `Text` with decorator treatment | Covered; add docs examples |

## API (additions only)

```ts
// input-group-decorator.tsx — added to InputSlotProps for Prefix/Suffix
export type InputGroupDecoratorProps = InputSlotProps & {
  /**
   * Purely visual content (icon, currency symbol). Hidden from screen readers
   * and never claims a press: `accessible={false}`, `importantForAccessibility="no-hide-descendants"`,
   * `pointerEvents="none"`. Default false for interactive content.
   * Default flips to TRUE when every child is a bare string/number or an <Icon>
   * (resolved by pure `resolveIsDecorative`), and an explicit prop wins.
   */
  isDecorative?: boolean;
};

// Input.Group.Button — a Button preconfigured for a decorator
export type InputGroupButtonProps = Omit<ButtonProps, "size" | "variant" | "isDisabled"> & {
  /** Default "ghost". "secondary" suits a trailing Apply/Go. */
  variant?: "ghost" | "secondary";
};
// size is derived from the group's size (resolveGroupButtonSize), isDisabled from group context.

// Input.Group.Separator — hairline between a decorator and the field
export type InputGroupSeparatorProps = { className?: string };

// Input.Group.Block — full-width addon above or below the field row
export type InputGroupBlockProps = {
  /** "start" renders above the field, "end" below. */
  position: "start" | "end";
  className?: string;
  children?: ReactNode;
};
```

No new `InputGroupProps` (no `orientation` prop; see decisions).

Decisions:
- No `orientation` prop. The box becomes a column automatically when any `Block` is present: `Block` registers itself on group context (`registerBlock(position)` in a layout effect; same pattern as Field's `registerLabel`), and the group switches `flex-row` to `flex-col` with the original row preserved as an inner row. To avoid a re-layout flash, render the field row inside an inner `View` ALWAYS (`group` slot = outer box, `row` slot = inner row). This is the one structural change: the box classes stay on the outer element (the single `root` slot home is unchanged), the inner `row` slot only holds `flex-row items-center gap-*`.
- Textarea inside a group: `Textarea` reads `useInputGroupContext()` the way `Input` does (variant/size/isInvalid/isDisabled/focus reporting/fieldRef) and drops its own `root` chrome via `resolveInputFieldClass({ isMultiline: true })`, which already supports multiline. The group aligns decorators to the top for multiline (existing rule). This lifts the "Not for Input.Group" paragraph in `textarea/AGENTS.md`; update that file in the same change. Auto-grow height math: the field row's `min-h` stays; the box height is the content (no fixed `h-input-*` when multiline: already the case).
- `Block` has no border of its own; separation from the field row is an optional `Input.Group.Separator` (horizontal hairline) rather than baked in, so a toolbar can sit flush or divided.
- `Separator` orientation is derived: inside the row → vertical hairline (`w-px self-stretch my-2 bg-border`), as a direct child of `Block`'s parent group (between Blocks and the row) → horizontal. Resolved through a tiny context flag `placement: "row" | "box"` that `Block` and the row provide.

```tsx
<Input.Group>
  <Input.Group.Prefix><Icon icon={IconMagnifyingGlass} /></Input.Group.Prefix>
  <Input placeholder="Search" />
  <Input.Group.Button accessibilityLabel="Clear" onPress={clear}><Icon icon={IconXmark} /></Input.Group.Button>
</Input.Group>

<Input.Group size="lg">
  <Input.Group.Prefix isDecorative>$</Input.Group.Prefix>
  <Input.Group.Separator />
  <Input inputMode="decimal" placeholder="0.00" />
  <Input.Group.Suffix>NZD</Input.Group.Suffix>
</Input.Group>

<Input.Group>
  <Input.Group.Block position="start"><AttachmentChips /></Input.Group.Block>
  <Textarea rows={3} placeholder="Message" />
  <Input.Group.Block position="end">
    <Input.Group.Button variant="secondary" onPress={send}>Send</Input.Group.Button>
  </Input.Group.Block>
</Input.Group>
```

## Variants & sizes
Unchanged axes (`primary|secondary`, `sm|md|lg`), owned by the group. New slots in `inputVariants`: `row`, `block` (`px-3 py-2 gap-2 flex-row items-center`; size-keyed padding, matching decorator's horizontal inset), `separator` (row and box placements via a `placement` variant). Group `Button` size mapping `resolveGroupButtonSize(size)`: group sm → button `sm`, md → `sm`, lg → `md` (a nested control is one step smaller than the box so it sits inside with breathing room); icon-only → matching `icon-*`.

## States
Covered by the group: focused (any field inside; a `Block` button does not focus the box), invalid (decorators/Block text turn destructive; Block buttons keep their own variant), disabled (whole box fades once; nested `Button` receives `isDisabled` from group context so it is also inert, but does not fade twice: the group fades, the group `Button` passes `feedback` only), readOnly (n/a, field-level), empty. `isDecorative` decorators never take pressed state.

## Accessibility
- `isDecorative` hides from the a11y tree (see API). Non-decorative decorators stay reachable; a Button inside has its own role/label (dev warning if icon-only with no `accessibilityLabel`).
- Group `Pressable` stays `accessible={false}` (existing). `Block` is a plain `View`, `accessible={false}` so its children are individually reachable.
- Separator: `accessibilityElementsHidden`, `importantForAccessibility="no"`.
- Order: DOM order equals reading order (start Block, row, end Block).

## Motion & haptics
None added. Group Button inherits `Button`'s feedback; no haptic by default.

## Reuses / new internal pieces / peer deps
Reuses `Button` (leaf `../button/button` and `../button/button.variants`; the group already imports `button.context`), `Pressable`, `Icon` defaults provider, `Text`. New: `input-group-button.tsx`, `input-group-block.tsx`, `input-group-separator.tsx`, `resolveIsDecorative`, `resolveGroupButtonSize`, new slots. Peer deps: none.

## Files (changes inside `input/`)
```
input/
  AGENTS.md                      updated: Files table, Design bullets for gaps 1-5, remove the Textarea exclusion note
  index.ts                       export new part types
  input-group.tsx                inner row, Block registration, new Object.assign members
  input-group-decorator.tsx      isDecorative
  input-group-button.tsx         NEW  DelacourUI.Input.Group.Button
  input-group-block.tsx          NEW  DelacourUI.Input.Group.Block
  input-group-separator.tsx      NEW  DelacourUI.Input.Group.Separator
  input.context.tsx              + registerBlock / blocks / placement flag
  input.variants.ts              + row/block/separator slots, resolveIsDecorative, resolveGroupButtonSize
  input.variants.test.ts         extended
textarea/textarea.tsx            reads input group context
textarea/AGENTS.md               lift exclusion
```
The Textarea touch is the only edit outside `input/`.

## Pure logic to unit-test (extend `input.variants.test.ts`)
- `resolveIsDecorative({ explicit, kinds })`: explicit true/false wins; all strings → true; `["icon"]` → true; any element kind `other` → false; empty → false.
- `resolveGroupButtonSize(size, isIconOnly)`: sm→sm, md→sm, lg→md; icon-only → `icon-sm|icon-sm|icon-md`.
- `resolveInputGroupClass` regression: the existing "every chrome utility a lone field wears is on the group's row" sweep still passes with `row` as an inner slot (assert chrome is on outer, `row` has no border/bg/h-*).
- `row` slot has no `border`, `bg-`, `rounded`, `h-input-*` (box not duplicated).
- `block` slot: padding step per size; contains no raw palette colour.
- `separator` slot: row placement vertical (`w-px`), box placement horizontal (`h-px`); both use `bg-border`.
- Multiline: group with `hasBlocks` and multiline resolves `items-start` row and no fixed height.
- Invalid outranks focus still holds for the box with blocks present.

## Playground demos
Extend `apps/playground/src/demos/input/` (do not create a new demo folder): `group-decorative` (icon + currency; capture), `group-button` (clear/apply buttons; capture), `group-separator` (unit with divider), `group-textarea-blocks` (message composer with start/end Blocks; capture, candidate hero for the group section). Update `input` route and `gen-demos`.

## Docs page outline
Add to `apps/web/content/docs/native/components/input.mdx`: "Input.Group" section split into Prefix and Suffix, Decorative vs. interactive, Group.Button, Separator, Blocks and Textarea, Disabled/invalid cascade, API table additions.

## Out of scope / follow-ups
- Absolute-positioned measured decorators (flex row replaces them).
- Animated show/hide of decorators; character counter part (compose in a `Block`); an anchored popover/menu in a decorator (needs Overlays' Popover, not merged).
- Markdown-editor will compose `Input.Group` + `Textarea` + `Block` for its toolbar: coordinate (cross-category dependency below).

## Acceptance checklist
- [ ] Decision recorded: stays `Input.Group`, no new folder
- [ ] `isDecorative` hides from a11y and passes presses; smart default for bare text/Icon
- [ ] `Input.Group.Button` sized from group, inert when disabled, label warning
- [ ] `Input.Group.Separator` row and box placements
- [ ] `Input.Group.Block` start/end with Textarea; box stays one border/ring
- [ ] Textarea in a group reads context; `textarea/AGENTS.md` updated
- [ ] No second border/bg/height slot (variants test proves it)
- [ ] All new displayNames `DelacourUI.Input.Group.*`
- [ ] `input/AGENTS.md` Files table and design notes; `gen-exports`; demos + `gen-demos`; docs updated; changeset (minor ui + delacour); registry `input` item file list updated
- [ ] No JSX comments, no `any`, `bun test packages/react-native-ui/src/components/input` green
