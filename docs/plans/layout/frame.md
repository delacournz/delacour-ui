# Frame

A titled shell around a tray of rows: a header with an action, a card of divided rows (optionally in labelled sections), and a footer.

Plan ID: LAYOUT-03
Folder: `packages/react-native-ui/src/components/frame`
Import: `@delacour/react-native-ui/frame`

## Purpose on mobile

The settings-screen shape: "Notifications" in a small header with a "Manage" link, under it a rounded card of rows (toggles, values, chevrons), and under that a footer line or a pair of decision buttons. Also member lists, API keys, connected devices, status monitors.

Today an app builds this from `Text` + `ListGroup` + `Button` by hand and gets the header spacing, footer placement and inset treatment wrong in three different ways. `Frame` owns the shell and nothing else.

What it is not:

- Not a new row. Rows are the existing `Item` (or `ListGroup.Item`); `Frame` does not mint `Frame.Row`/`Frame.Media`/`Frame.Content`/`Frame.Actions`. See Reuses.
- Not `Card`: Card is one content surface (header/body/footer inside one fill). Frame is a title outside a card of rows.
- Not `ListGroup`: that is the card of rows alone. Frame composes it and adds the title strip, sections and footer.
- Not a screen header: `Screen.Header` / `Screen.Navbar` own screen chrome and scroll insets. Frame is content inside a `Screen`.

## API

```ts
export const FRAME_VARIANTS = ["default", "plain", "inset"] as const;
export const FRAME_SIZES = ["sm", "md", "lg"] as const;
export type FrameVariant = (typeof FRAME_VARIANTS)[number];
export type FrameSize = (typeof FRAME_SIZES)[number];

export type FrameProps = ViewProps & {
	/**
	 * default: a tinted shell; the title sits on it above the tray.
	 * plain: no shell, for a Frame already inside a bordered container.
	 * inset: the tray recessed into a band on all sides; the footer sits in the band.
	 */
	variant?: FrameVariant;
	/** Row metrics for the tray, forwarded to the ListGroup it composes. Default md. */
	size?: FrameSize;
	className?: string;
	children?: ReactNode;
};

export type FrameHeaderProps = ViewProps & { className?: string; children?: ReactNode };
export type FrameTitleProps = TextProps & { className?: string };            // heading role
export type FrameDescriptionProps = TextProps & { className?: string };
export type FrameActionProps = PressableProps & { className?: string };      // a text-link button; string children are wrapped
export type FrameTrayProps = ViewProps & {
	/** Draw a Separator between adjacent children. Default true. */
	isDivided?: boolean;
	className?: string;
	children?: ReactNode;
};
export type FrameSectionProps = ViewProps & {
	/** The cluster's label, rendered as a muted caption above its rows. */
	title?: string;
	className?: string;
	children?: ReactNode;
};
export type FrameFooterProps = ViewProps & {
	/** start | end | between | stretch. How footer children sit on the row. Default end. */
	align?: "start" | "end" | "between" | "stretch";
	className?: string;
	children?: ReactNode;
};

export type FrameContextValue = { variant: FrameVariant; size: FrameSize };

export const Frame: ((props: FrameProps) => ReactElement) & {
	Header: typeof FrameHeader;
	Title: typeof FrameTitle;
	Description: typeof FrameDescription;
	Action: typeof FrameAction;
	Tray: typeof FrameTray;
	Section: typeof FrameSection;
	Footer: typeof FrameFooter;
};
export function useFrame(): FrameContextValue;   // throws outside a Frame
```

Usage:

```tsx
<Frame>
  <Frame.Header>
    <Frame.Title>Notifications</Frame.Title>
    <Frame.Action onPress={openManage}>Manage</Frame.Action>
  </Frame.Header>
  <Frame.Tray>
    <Item>
      <Item.Media variant="icon"><Icon icon={IconBell} /></Item.Media>
      <Item.Content><Item.Title>Push</Item.Title></Item.Content>
      <Item.Actions><Switch isSelected={push} onSelectedChange={setPush} /></Item.Actions>
    </Item>
    <Frame.Section title="Email">
      <ListGroup.Item onPress={openDigest}>Weekly digest</ListGroup.Item>
    </Frame.Section>
  </Frame.Tray>
  <Frame.Footer>
    <Button variant="secondary" onPress={cancel}>Cancel</Button>
    <Button onPress={save}>Save</Button>
  </Frame.Footer>
</Frame>
```

`Frame.Tray` is a `ListGroup`: `Item` and `ListGroup.Item` placed in it become grouped rows (size, fade feedback, no card-in-card) because the tray publishes the ListGroup context through the `list-group.context` leaf.

## Variants & sizes

One slotted `tv()` in `frame.variants.ts`; slots `root`, `header`, `title`, `description`, `action`, `section`, `sectionTitle`, `footer`.

| variant | root | header | tray | footer |
| --- | --- | --- | --- | --- |
| `default` | `Surface`-ladder `secondary` fill, `rounded-lg`, `p-1` (shell reads as a tray lip) | `px-3 pt-2 pb-2` | card (`default`) inside the shell | below tray, `px-3 py-2` |
| `plain` | transparent, no padding | `pb-2` | card, no shell | `pt-3` |
| `inset` | `secondary` fill, `p-2` all sides, `rounded-lg` | `px-2 pb-2` | card recessed in the band | in the band, `px-2 pt-3`, `align` defaults to `end`, buttons stack nothing |

`size` = `sm`/`md`/`lg`, drives only the tray (ListGroup row size) and the title step (`text-sm`/`text-base`/`text-lg` through `Text` presets). Defaults `variant: "default"`, `size: "md"`.

Tokens: semantic only (`bg-secondary`, `text-muted-foreground`, `border-border`). The shell steps via `resolveSurfaceVariant` so a Frame inside a `Card` steps to `tertiary` instead of vanishing. No new tokens. Corners follow the card step (`rounded-lg`, `border-continuous`).

## States

- Stateless: no controlled/uncontrolled state. Row state lives in the rows.
- `Frame.Action` is a `Pressable`: inherits `isDisabled`, `busy`, `haptic`, `feedback` (default `fade`).
- Empty tray: renders nothing special; use `EmptyState` inside the tray or conditionally render the Frame.
- Loading: put `Skeleton` rows in the tray.
- A tray with zero or one child draws no dividers (ListGroup rule).

## Accessibility

- `Frame.Title`: `accessibilityRole="header"`.
- `Frame.Tray`: `accessibilityRole="list"` (via ListGroup); `Frame.Section` with a title is `accessibilityRole="summary"` labelled by its title, so a screen reader announces the cluster name once.
- `Frame.Action`: role `link` when it navigates (`accessibilityRole` prop wins), `button` default; hit slop to 44pt minimum even though it is a text link.
- Footer buttons keep their own roles; no extra grouping.
- Reduce motion: nothing animates here.

## Motion

None. No Reanimated in this component. Press feedback comes from `Pressable`, which already follows calm-motion.

## Reuses

- `Surface` (shell fill, corner, `resolveSurfaceVariant`) via a leaf import of `surface.variants`.
- `ListGroup` as the tray (dividers, sizes, `ListGroupProvider`), so `Item` rows work unchanged. Imports the leaves `list-group.context`/`list-group.variants` or composes the public `ListGroup` root from `frame-tray.tsx` (a part may import another folder's index only if it does not close a cycle; ListGroup does not import Frame, so the public root is safe).
- `Item`, `Switch`, `Button`, `Icon`, `Text`, `Pressable` as consumers, not imports (callers compose them).
- `Slot`/`asChild` on `Frame.Action` through `Pressable`.

Decision: **extend by composition, standalone folder.** Do not change `ListGroup` or `Item`.

## New peer deps

None.

## Cross-category dependencies

None required. `Frame.Action` can open a Menu or Dialog from the caller's `onPress`; Frame never imports one. Section "Footer decision prompts" uses `Button` (already shipped).

## Pure logic to unit-test

`frame.variants.test.ts`, first:

| Function | Input | Expected |
| --- | --- | --- |
| `resolveFrameRootVariant(variant, parentPlane)` | `("default", undefined)` | `"secondary"` |
| | `("default", "secondary")` | `"tertiary"` (never equals parent) |
| | `("plain", any)` | `"transparent"` |
| | `("inset", "default")` | `"secondary"` |
| `resolveFrameTrayVariant(variant)` | `"default"`, `"inset"` | `"default"` (card on the shell); `"plain"` also `"default"` |
| `resolveFrameFooterJustify(align)` | `"start"`, `"end"`, `"between"`, `"stretch"` | `justify-start`, `justify-end`, `justify-between`, `""` plus children `flex-1` |
| `frameVariants({variant}).root()` | each variant | no `text-*` colour class (rule 1); `plain` has no `bg-` class |
| `frameVariants` | no variant emits a `shadow` class | true |
| `resolveFrameTraySize(size)` | `"sm"`/`"md"`/`"lg"` | equal to the same ListGroup size |

Also: `FRAME_VARIANTS` and `FRAME_SIZES` are the exact tuples; every `tv()` slot named above exists.

## File map

```
packages/react-native-ui/src/components/frame/
  AGENTS.md
  index.ts
  frame.tsx                   root + Object.assign surface
  frame-header.tsx
  frame-title.tsx
  frame-description.tsx
  frame-action.tsx
  frame-tray.tsx              composes ListGroup
  frame-section.tsx
  frame-footer.tsx
  frame.context.tsx           FrameProvider, useFrame, useFrameContext, useFramePart
  frame.types.ts              shared slot prop types
  frame.variants.ts           tv() + resolvers, no RN imports
  frame.variants.test.ts
```

Display names: `DelacourUI.Frame`, `DelacourUI.Frame.Header`, `.Title`, `.Description`, `.Action`, `.Tray`, `.Section`, `.Footer`, `DelacourUI.Frame.Provider`.

## Playground demo

`apps/playground/src/demos/frame/`: `index.ts` ordered, then

| File | Shows | Capture |
| --- | --- | --- |
| `settings.tsx` (hero) | default variant, header action, switch rows | yes, `align: "stretch"` |
| `variants.tsx` | default / plain / inset | yes |
| `sections.tsx` | labelled sections in one tray | yes |
| `decision-footer.tsx` | inset with Cancel/Save footer | yes |
| `members.tsx` | avatar rows with chevrons | yes |
| `sizes.tsx` | sm / md / lg | no |

Route `apps/playground/src/app/(components)/frame.tsx`; `components-index.ts` row (group `Layout`, "Titled card of rows"); icon in `app/index.tsx`; `gen-demos`.

## Docs page

`apps/web/content/docs/native/components/frame.mdx`: hero Preview, Installation, Usage, Variants, Sections, Footer and decisions, "Frame vs Card vs ListGroup" table, API. `ITEM_META.frame = { title: "Frame", description: "A titled shell around a card of divided rows, with sections and a footer.", categories: ["layout"] }`. Frame's registry dependencies include `list-group` and `surface` (registry builder resolves intra-library imports; confirm it picks them up from the import scan). `PACKAGE_INSTALL`: no new packages.

## Changeset

`@delacour/react-native-ui` minor: "Add Frame, a titled shell with header action, divided tray, sections and footer."

## Out of scope

- `Frame.Row`, `Frame.Media`, `Frame.Content`, `Frame.Actions`: use `Item`.
- A multi-line wrapping row for chip clusters: `Item` with `Chip` in `Item.Footer` already covers it; revisit if not.
- Collapsible frames (use `Accordion`), drag-reorder, swipe actions.
- Shadows.
- Direction handling: layout is logical (`ps/pe`, `start`) so it mirrors for free once `Direction` ships.

## Acceptance checklist

- [x] `frame.variants.test.ts` written first, red then green (`bun test packages/react-native-ui/src/components/frame`)
- [x] `bun run typecheck`, `bun run check` clean
- [x] All parts and the provider have `DelacourUI.` display names; `display-name.test.ts` passes
- [x] `frame/AGENTS.md` with file map and design notes; Components table row added; `docs.test.ts` passes
- [x] `bun run gen-exports`, `bun run gen-demos` run
- [x] Docs page, `ITEM_META`, changeset; registry build resolves `list-group` and `surface` as dependencies
- [x] No `any`, no comments in JSX, no circular imports (part never imports own index or root)
- [x] `Item` and `ListGroup.Item` inside `Frame.Tray` render as grouped rows (no inner border/fill)
- [x] Simulator via agent-device (2026-10-05, iPhone 17 dev client: action press, switch toggle, footer, both themes; header role asserted in source — agent-device reports no trait) (claim a device with `warden claim ios`): open `frame/settings`, `snapshot -i`, `press id=frame-action`, `is` title has header role, toggle a Switch row and `get` its value, verify inset footer buttons visible above the safe area; `close` and `warden release`
- [x] Dark and light themes both show the tray distinct from the shell

- [x] Previews captured: settings (hero clip), decision-footer and members clips, variants and sections stills.

## Open questions

1. Ship a `Frame.Row` convenience that is literally `Item`? Recommended no, one row API. `1.a` no.
2. Should `default` and `inset` differ more than padding? As written: `default` has a lip of 4pt, `inset` a 8pt band that also holds the footer. `2.a` keep.
3. Does `Frame.Section` need its own divider treatment (full-bleed between sections vs inset)? Recommended full-bleed. `3.a` full-bleed.
