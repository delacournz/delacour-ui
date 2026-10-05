# Frame

A titled shell around a card of rows — the settings-screen shape. Compound root
plus seven parts: `Header`, `Title`, `Description`, `Action`, `Tray`, `Section`,
`Footer`.

`import { Frame } from "@delacour/react-native-ui/frame";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/frame` |
| `frame.tsx` | Root + the `Object.assign` compound surface |
| `frame-header.tsx` | `Frame.Header`, and the bare-text wrap it owns |
| `frame-title.tsx` | `Frame.Title` |
| `frame-description.tsx` | `Frame.Description` |
| `frame-action.tsx` | `Frame.Action` |
| `frame-tray.tsx` | `Frame.Tray` — publishes the ListGroup context |
| `frame-section.tsx` | `Frame.Section` |
| `frame-footer.tsx` | `Frame.Footer` |
| `frame-dividers.tsx` | `withFrameDividers`, shared by the tray and a section |
| `frame.context.tsx` | `FrameProvider`, `useFrame()`, `useFrameContext()`, `useFramePart()`, and the tray's internal `isDivided` context |
| `frame.types.ts` | Prop types shared by two or more parts |
| `frame.variants.ts` | The slotted `tv()` and every resolver — no RN imports |
| `frame.variants.test.ts` | |

## Design

- **Frame owns the shell and nothing else — there is no `Frame.Row`.** Rows are
  `Item` and `ListGroup.Item`. A second row API would be a third way to draw the
  same row, and the first two already disagree with nothing. A wrapping cluster
  of chips is an `Item` with `Chip`s in `Item.Footer`.
- **The tray is a ListGroup in everything but its dividers.** `Frame.Tray`
  publishes `ListGroupProvider` from the `list-group.context` leaf and paints
  `listGroupVariants`' root, so an `Item` inside it reads the group, takes its
  size, switches to fade feedback and drops its own surface — no card drawn
  inside the card. It does not render `ListGroup` itself because ListGroup
  insets every divider, and a section needs a full-bleed one.
- **Two rules, picked by `resolveFrameDivider`.** Between two rows, a rule
  inset to the rows' padding — the ListGroup divider slot, so it tracks the row
  size. Next to a `Frame.Section` on either side, full-bleed, so a cluster reads
  as a break in the card rather than as one more row. A hand-placed `Separator`
  suppresses the rule on both sides of it, the ListGroup convention. A section
  divides its own rows inset, following the tray's `isDivided` through an
  internal context rather than a restated prop.
- **The shell's fill is a step on the surface ladder, not a colour.**
  `resolveFrameRootVariant` returns `secondary` on the page and, inside another
  surface, the same step a nested `Surface` would take — so a frame in a `Card`
  is secondary and a frame in a secondary panel is tertiary. The root publishes
  that fill as a surface, so a `Surface` nested in a header keeps stepping. The
  `tv()` names `bg-secondary` in the variant and the resolved fill after it;
  tailwind-merge keeps the later one.
- **The tray is always the card fill.** `resolveFrameTrayVariant` returns
  `default` for every variant: on a filled shell that is what makes the rows read
  as a card set into a tray; on `plain` it is the card the rows would be in anyway.
- **Variants are padding, and one of them is a fill.** `default` is a 4pt lip
  (`p-1`) with the header and footer inset a further 12pt, which puts the title
  at the 16pt a `md` row's text starts at. `inset` is an 8pt band on every side,
  wide enough that the footer sits in it. `plain` paints and pads nothing, for a
  frame already inside a bordered container. Corners are the card step,
  `rounded-lg` with `border-continuous`, like `Surface`.
- **Size drives the tray, the title and the section caption — nothing else.**
  `resolveFrameTraySize` hands the ListGroup the same step, the title steps
  `text-sm`/`text-base`/`text-lg`, and a section caption's inset tracks the row
  padding at that size (3/4/5) so it starts where the row text below it starts.
- **The title is on its plane's foreground token**, written out per plane in the
  `tv()` because Tailwind's scanner cannot see a class built at runtime. A plain
  frame on the page has no plane and reads `text-foreground`.
- **`Frame.Header` lifts the action out of the text column wherever it is
  written**, with `splitFrameHeaderChildren`, so a long title wraps in the width
  the action leaves. Bare text in a header is its title, the same wrap `Card`
  does, because a raw string inside a `View` is a red box.
- **`Frame.Action` is a text link with a button's hit target.** `min-h-11`
  reserves 44pt and `-my-2` gives the height back to the header, so the strip
  stays as tall as its type. It is a `Pressable` defaulting to `fade` — a link
  that scales reads as the header twitching — and announced as a button; a
  caller's `accessibilityRole="link"` is spread last and wins.
- **`Frame.Footer`'s `stretch` wraps each child in a `flex-1` cell** rather than
  cloning a `className` onto it, so any element takes an equal share the same
  way. `start`, `end` (the default) and `between` are a justify class and leave
  the children alone — `resolveFrameFooterJustify` returns both halves.
- **Accessibility.** The title is a header, the tray a list, a titled section a
  summary labelled by its title. Footer buttons keep their own roles; nothing
  groups them.
- **No motion and no shadow.** Press feedback is `Pressable`'s, which already
  follows calm motion; depth is carried by fill, as everywhere in this package.
- **No text treatment on the root, header, section or footer** (rule 1). The
  tests assert it across every combination.

## Verification notes

- **Checked on an iOS simulator (iPhone 17, dev client), 2026-10-05.** All six
  gallery demos in dark, `variants` in light: the tray reads distinct from the
  shell in both. `Frame.Action` presses, a `Switch` row in the tray toggles
  (`value` 0 → 1), and the inset footer's stretched Cancel/Save sit in the band.
- **Five demos are captured** (2026-10-06, dev client, iPhone 17 Pro):
  `settings` (the hero), `decision-footer` and `members` as clips, `variants`
  and `sections` as stills, every one `capture.align: "stretch"`. `sizes` is
  gallery-only.
- **A shrink-wrapped frame squeezes its title, not its action.** At the preview
  route's default `center` the header's text column collapses to the width the
  action leaves — a frame is a container and is only ever captured `stretch`.
