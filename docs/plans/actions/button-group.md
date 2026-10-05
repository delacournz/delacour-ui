# ACT-01-P1 — Button group: spaced and full-width runs

Read [README.md](README.md) first. It holds the conventions and the delivery checklist.

## Status

`Button.Group` **already exists** (`packages/react-native-ui/src/components/button/button-group.tsx`,
documented in `button/AGENTS.md` § Button.Group). It joins members into one shape and computes
corner positions and seams in JavaScript. It takes `Separator` and `Text` parts, `orientation`,
group-owned `size`, `variant`, `isDisabled` and `feedback`, and it reads members through context.

So this phase is **an extension of the existing group, not a new folder**. Two behaviours are
missing.

## Purpose on mobile

1. **A toolbar that shares props but not shape.** Example: a row of `Find · Export · Share`
   buttons that should all be `outline` and `sm`, but stand apart with a gap rather than joining
   into a segmented control.
2. **A run that splits its container equally.** Example: a `Monthly · Annual · One-off` picker
   where each third is the same width whatever its label says. When a run is sized to its labels,
   its dividers move when the copy changes, and a wider segment reads as more important.

## API (additions only)

```ts
type ButtonGroupProps = /* existing */ & {
	/**
	 * Join the members into one shape. On by default, because that is what a group is. Off keeps the
	 * inherited `variant` / `size` / `isDisabled` / `feedback` and drops the joined shape: every
	 * member keeps its own corner, no seam overlap, and the run takes a `gap`.
	 */
	isAttached?: boolean; // default true
	/**
	 * Span the parent and split it equally between members. Horizontal only.
	 * Vertical groups already stretch.
	 */
	isFullWidth?: boolean; // default false
};
```

Publish both on `ButtonGroupContextValue`, so a custom member (an `Input`, or a third-party
control reading `useButtonGroupItem()`) can respond.

## Behaviour

- **`isAttached={false}`**
  - `resolveGroupPositions` is skipped. Every member reports position `"alone"` (or whatever the
    existing "standalone" sentinel is; reuse it, do not add one), so `buttonVariants` emits the
    member's own `rounded-button-*`.
  - `resolveGroupSeams` returns no seams, so there is no `-ms-px` / `-mt-px`.
  - The group root adds `gap-2` (horizontal) or `gap-2` (vertical). The gap is a `tv` variant on
    the group slot, never inline.
  - The feedback default goes back to the lone-button default (`scale`). Tearing a seam is
    impossible when there is no seam, so `resolveButtonFeedback`'s group rung only applies while
    attached. Extend the resolver with an `isAttached` input and test both.
  - `Button.Group.Separator` still renders. It is a visual rule between spaced members, and it
    still suppresses nothing.
- **`isFullWidth`**
  - The group drops `self-start` for `self-stretch w-full`, and every member gets `flex-1 basis-0`
    so the split is equal, not content-weighted. `basis-0` is the important part: with only
    `flex-1` Yoga distributes the *remaining* space and the widths still follow the labels.
  - Members receive `flex-1 basis-0` through the per-member context (`useButtonGroupItem()`
    exposes `isStretched: boolean`). `Button` reads it and adds the classes in its `tv` through
    a new `isStretched` variant. Do not use `cloneElement`.
  - A `Separator` and `Button.Group.Text` do **not** stretch.
  - Vertical + `isFullWidth`: the group fills the width, and members already stretch on the
    cross axis. Document it as having no further effect.
  - Keep the "parent must have a definite width" warning from `button/AGENTS.md` and repeat it
    in the new bullet.

## Pure logic to test first (`button.variants.test.ts`)

- `resolveGroupPositions(children, { isAttached: false })` → every member standalone.
- `resolveGroupSeams(..., { isAttached: false })` → no seams.
- `resolveButtonFeedback({ own, group, isAttached })`, the matrix: attached → `fade` default;
  detached → `scale` default; an explicit `none` is honoured in both.
- `buttonVariants({ isStretched: true })` emits `flex-1 basis-0` on root. `buttonGroupVariants`
  (or whatever the group slot is called) with `isAttached: false` emits a gap, and with
  `isFullWidth: true` emits `w-full self-stretch` and no `self-start`.
- `cn` merge sanity: a caller `className="flex-none"` on a member still wins over `flex-1`.

## A11y

No change. The group has no role, and the members are buttons.

## Motion

None new.

## Files touched

- `button/button-group.tsx`, `button/button.context.tsx`, `button/button.tsx`,
  `button/button.variants.ts`, `button/button.variants.test.ts`, `button/AGENTS.md` (new bullets
  under Button.Group), `button/index.ts` (export any new constants).
- `apps/playground/src/demos/button/`: add `group-spaced.tsx` (detached toolbar) and
  `group-full-width.tsx` (three equal segments in a `w-full` parent), list them in `index.ts`,
  mark one `capture`, then `bun run gen-demos`.
- `apps/web/content/docs/native/components/button.mdx`: extend the Button group section with both
  props and the definite-width caveat.
- Changeset: **minor** on `@delacour/react-native-ui` ("Button.Group takes isAttached and
  isFullWidth").

## Out of scope

- An `xl` size, because the button has `sm/md/lg/icon-*` only.
- Moving the joined border to the container. The existing JS position and seam design is
  deliberate and documented; keep it.

## Acceptance checklist

- [ ] `isAttached={false}` renders separate, individually rounded buttons with a gap, sharing the
      group's variant and size.
- [ ] `isFullWidth` splits a `w-full` parent into equal segments whatever the label lengths
      (verify with "A" / "Annual plan" / "B").
- [ ] Existing attached behaviour is unchanged. All existing button tests pass untouched.
- [ ] Detached members press with `scale` by default, and attached members still `fade`.
- [ ] Custom members can read `isAttached` and `isStretched` from context.
- [ ] `button/AGENTS.md`, `button.mdx`, demos and changeset are updated.
- [ ] `bun test`, `bun run typecheck` and `bun run check` are green. Simulator check is done, or
      its skip is recorded.
