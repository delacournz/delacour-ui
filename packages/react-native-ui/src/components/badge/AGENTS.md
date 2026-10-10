# Badge

A compact, read-only mark — a status, a category, a count, or a dot. Compound
root plus `Badge.Label`, `Badge.StartContent`, `Badge.EndContent` and
`Badge.Anchor`.

`import { Badge } from "@delacour/react-native-ui/badge";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/badge` |
| `badge.tsx` | Root + the `Object.assign` compound surface |
| `badge-label.tsx` | `Badge.Label` |
| `badge-start-content.tsx` | `Badge.StartContent` |
| `badge-end-content.tsx` | `Badge.EndContent` |
| `badge-anchor.tsx` | `Badge.Anchor`, the content-sized box a placed badge is pinned to |
| `badge.context.tsx` | `BadgeContext`, `useBadge()`, `useBadgeContext()`, `useBadgePart()` |
| `badge.types.ts` | Prop types shared by two or more parts |
| `badge.variants.ts` | Pure `tv()` slots, `BADGE_SURFACE_CELLS`, the foreground map, `resolveBadgeShape` / `resolveBadgeCount` — no RN imports |
| `badge.variants.test.ts` | |

## Design

- **Two axes, not one.** `variant` says how the surface is painted — `solid`,
  `soft`, `outline`, `ghost` — and `color` says what it means — `default`,
  `primary`, `success`, `warning`, `destructive`, `info`. **Sizes**: `sm`, `md`, `lg`.
  [`Button`](../button/AGENTS.md) collapses the two into a single enum, and a
  badge deliberately does not: six semantic colours are the point of this
  component rather than an afterthought, and one axis would need thirteen names
  to say what two say with ten. Neither axis paints a surface alone, so all
  twenty-four pairings live in `BADGE_SURFACE_CELLS`; a test asserts every cell
  is distinct, because two cells collapsing means a caller can set an axis and
  see nothing change.
- **`BADGE_SURFACE_CELLS` is exported because Chip rests on it.** Chip spreads
  the `soft` and `outline` rows into its own `tv()` instead of restating them,
  so the two components cannot drift apart. The strings are literal in this
  file, which is all Tailwind's static scanner needs.
- **A badge is never pressed.** It is a plain `View`: no gesture detector, and
  nothing announced to assistive technology as a control. It used to take
  `onPress` and `onClose`, and that made it a second
  [`Chip`](../chip/AGENTS.md) with a worse close control — iOS folds every
  descendant of an accessible view into one element, so the dismiss inside a
  pressable badge was unreachable by swipe, the bug Chip's `remove` action
  exists to fix. Something to tap, toggle or remove is a chip. The split is the
  one every platform draws: a badge is read, a chip is aimed at.
- **What it draws is read from what it is given, never from a flag.**
  `resolveBadgeShape` returns `label`, `count` or `dot`: children are a label, a
  `count` is a count even at zero, and a badge with neither is a dot — the rule
  [`Avatar.Badge`](../avatar/AGENTS.md) follows for its presence dot. The props
  are a discriminated union, so `count` beside children is a compile error
  rather than one of the two silently winning.
- **A count hides itself at zero.** `resolveBadgeCount` returns `null` and the
  root renders nothing, so a caller never wraps the badge in a condition of
  their own; `showZero` keeps it. Past `max` (default `99`) it reads `99+`,
  which caps how wide a count can grow across the thing it sits on. A negative
  or `NaN` count is read as zero, and a fraction is truncated, never printed.
- **A count is the label's paint in a tighter box.** No vertical padding and a
  `min-w-*` equal to the height that leaves — the label's line plus the border
  — so one digit sits in a circle and three in a capsule. It is still padding
  and a floor, never a height, so the number grows with OS font scaling.
- **A dot is solid on every variant.** Its cells come after the surface cells,
  so tailwind-merge lets them win. A soft tint six points wide is not a status
  and a ghost one is not there, so `variant` deliberately changes nothing. A
  `default` dot takes `foreground` rather than solid's `secondary`, which this
  theme sets a hair from the page. The dot is the one shape with a fixed edge —
  it holds no text to scale — and it drops the border the other two reserve.
- **`placement` pins by the inner edge.** `top-right` is `left-full
  bottom-full` pulled back over the corner by a negative margin, rather than
  `right-0` — so a count that gains a digit grows away from the glyph
  underneath instead of across it. A dot is pulled back less: it is a third the
  size, and the same overlap would bury it inside the corner.
- **`Badge.Anchor` exists for `self-start` and `flex-row`.** A placed badge
  positions against its parent, and a plain `View` in a gap column is stretched
  to the column — the corner is then the far edge of the screen. The row is as
  load-bearing: Yoga caps an absolute child at its parent's width when the
  parent is a column, so a `99+` over a 24pt glyph wrapped onto two lines
  (seen on a simulator); a row measures it unconstrained. The anchor
  publishes no context: the badge is pinned by its own `placement`, so a
  `Badge` deeper in the subtree is left where it was put. An `Avatar` needs
  neither — it is content-sized already and `Avatar.Badge` is its pin.
- **A dot and a count mean nothing to a screen reader alone.** "3" is not "3
  unread". The meaning goes into the `accessibilityLabel` of the thing the badge
  sits on, the way an avatar's presence does.
- **A size is padding, never a height.** `Text` respects OS font scaling, so a
  fixed height clips the label at a large accessibility step instead of growing
  with it — and unlike `h-button-*` or `h-navbar-row`, a badge lines up against
  no chrome that would force the number. A test asserts the root carries no
  `h-*` at any size. The icon step indexes the shared `--spacing-icon-*` scale,
  so a glyph in a badge matches every other glyph in the library.
- **`self-start` is load-bearing.** A badge is sized by its content, and inside a
  gap column every child is stretch-aligned by default — without it a one-word
  badge spans the whole screen.
- **The border is reserved on every variant, transparent until `outline`
  colours it.** Declaring it only where it shows would make the badge two points
  wider the moment a caller switched variant.
- **The neutral end of the matrix reuses tokens the theme already has.** This
  theme's `primary` is a near-black whose tint *is* the neutral fill, so a
  `--primary-soft` would duplicate `secondary` exactly. `soft` takes
  `tertiary` for `primary` and `muted` for `default` instead — two fills the
  theme already tunes per mode. The four semantic colours did get real tokens:
  `success-soft`, `warning-soft` and `info-soft` joined the existing
  `destructive-soft` in `theme.css`, foregrounds included.
- **`BADGE_FOREGROUND_TOKEN` is nested, `Record<variant, Record<color, string>>`,**
  so adding a colour is a compile error in four places rather than a silent gap
  in one. A test pins each entry to the token its own `label` slot resolves to —
  two maps that can drift is how a badge ends up with a grey glyph beside white
  text — and asserts every token it names is declared in **both** variants of
  `theme.css`.
- **Icons are composed, never passed as props**, the way
  [`Button`](../button/AGENTS.md) does it. The root wraps its subtree in an
  `IconDefaultsProvider` and a `TextClassProvider`, so a bare `<Icon>` or
  `<Text>` inside a badge comes out at the right size and colour with nothing
  said at the call site. One text treatment covers the whole subtree, which is
  the condition [Text](../text/AGENTS.md) sets for publishing into the cascade.
- **String children** are wrapped in a `Badge.Label` automatically, consecutive
  strings collapsing into one — the same rule, and the same reason, as
  [`Button`](../button/AGENTS.md). The walk is `lib/wrap-text-children`, which
  Chip shares; each passes its own label part.
