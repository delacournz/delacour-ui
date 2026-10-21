# Breadcrumb

The path to the current screen — `Settings › Account › Security` — at the top of a deep detail
screen or a file browser. Compound root plus `Breadcrumb.List`, `Breadcrumb.Item`,
`Breadcrumb.Link`, `Breadcrumb.Page`, `Breadcrumb.Separator` and `Breadcrumb.Ellipsis`. Every crumb
before the last navigates back to that level; the last is the current page and is plain text.

`import { Breadcrumb } from "@delacour/react-native-ui/breadcrumb";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/breadcrumb` |
| `breadcrumb.tsx` | Root — the size and separator context, and the `Object.assign` |
| `breadcrumb-list.tsx` | `Breadcrumb.List` — counts the items, inserts separators, collapses or scrolls |
| `breadcrumb-item.tsx` | `Breadcrumb.Item` — one crumb's row |
| `breadcrumb-link.tsx` | `Breadcrumb.Link` — a `Pressable` announced as a link |
| `breadcrumb-page.tsx` | `Breadcrumb.Page` — the current page, announced selected |
| `breadcrumb-separator.tsx` | `Breadcrumb.Separator` — the chevron, or the caller's mark |
| `breadcrumb-ellipsis.tsx` | `Breadcrumb.Ellipsis` — the collapsed levels, static or a button |
| `breadcrumb-glyph.tsx` | The `IconDefaultsProvider` every breadcrumb glyph sits under — internal |
| `breadcrumb.context.tsx` | The root's context, `useBreadcrumb` and the part hook |
| `breadcrumb.types.ts` | `BreadcrumbSlotProps`, shared by item, separator and ellipsis |
| `breadcrumb.variants.ts` | Pure `tv()` slots + every resolver, no RN imports |
| `breadcrumb.variants.test.ts` | |

## Design

- **Sizes**: `sm` (labels on the `sm` `Text` step — the caption step — glyphs `icon-xs`) and `md`
  (the `md` body step, glyphs `icon-sm`). The label size is a `Text` `size`, not a `text-*` class in
  a slot — `BREADCRUMB_TEXT_SIZE` names it, the rule `Steps.Title` follows, so the type scale keeps
  one owner.
- **Colour.** A link's label is `text-muted-foreground`, the page `text-foreground font-medium`: where
  the reader is stands out from where they could go. Colour sits on the label `Text`, never on the
  link's `Pressable` (rule 1). Every glyph — chevron, dots, an icon a caller puts in a link — is
  `muted-foreground` through one `IconDefaultsProvider` (`BreadcrumbGlyph`); the test asserts the
  token and both colour classes exist in `theme.css`.
- **No `isDisabled` on the root.** A trail has no reason to disable every level at once; a single
  `Breadcrumb.Link` takes `isDisabled`, and fades on its `Pressable` root — safe, since `Pressable`
  multiplies a className's opacity into its press rather than overwriting it.

## The list lays the trail out

- **Separators are inserted, never written.** `Breadcrumb.List` walks its direct children with
  `Children.toArray` and `resolveBreadcrumbSequence` puts a separator before every crumb but the
  first — so none trails the last. A `.map()` is flattened and counts; an item behind a wrapper is
  not counted and the list warns in development, the same trade `Steps` makes.
- **A separator the caller writes stands in for the automatic one beside it.** The sequence emits no
  automatic separator when the entry just before the crumb was a caller's separator, so one custom
  gap needs one element, not a second `separator` prop. A caller's separator that follows a hidden
  item is hidden with it.
- **Automatic separator keys name the child they precede**, so a crumb keeps its separator across a
  re-render that collapses others rather than remounting the row.
- **Collapse is a discriminated union.** `resolveBreadcrumbCollapse` returns `{ kind: "all" }` or
  `{ kind: "collapsed", visibleBefore, hidden, visibleAfter }`. It never collapses without
  `maxItems` or at/under it. Negative or fractional `itemsBeforeCollapse`/`itemsAfterCollapse` read
  as whole numbers ≥ 0, the last item always stays (`after` is at least one), and `before + after`
  is clamped so at least one item is hidden — an ellipsis standing for no levels would be a lie.
  `after` wins that clamp because the end of the trail is where the reader is.
- **`overflow` decides which mechanism applies.** `collapse` (the default once `maxItems` is set),
  `wrap` (the default otherwise — a long trail flows onto a second line) and `scroll` (a horizontal
  `ScrollView` that scrolls to its end on every content size change, so the current page is in view
  on mount and after the trail changes). `maxItems` only collapses under `collapse`.

## Accessibility

- **The list** is `accessibilityRole="none"` with the label "Breadcrumb", overridable.
- **A link** is `accessibilityRole="link"`, named by its text — the `Pressable` merges its children.
- **The page** is `accessibilityRole="text"`, `accessibilityState={{ selected: true }}` and the value
  "current page". It is a `Text`, never a `Pressable`, so it cannot be activated.
- **Separators are hidden** — `accessibilityElementsHidden` plus
  `importantForAccessibility="no-hide-descendants"`, like `Separator`: the order of the links already
  says what the chevron draws.
- **The ellipsis** is a `Pressable` announced "Show 3 hidden levels" when the list has an
  `onEllipsisPress`, and a plain accessible view announced "3 hidden levels" when it does not. A
  static mark rendered as a button would be a control that does nothing.
  `resolveBreadcrumbEllipsisLabel` holds both strings and the singular.
- **Touch targets reach 44 points.** A link is one line of text (20 or 24 points), so
  `BREADCRUMB_LINK_HIT_SLOP` adds 12 or 10 above and below; the test holds the sum to 44. The
  ellipsis' box is held to the same line height (`h-5`/`h-6`) so the same slop covers it. The sides
  get 4 points only — more would reach across a separator into the neighbouring crumb.
- **RTL.** The chevron points along the reading direction — `resolveBreadcrumbSeparatorGlyph`
  reads `I18nManager.isRTL` — and the row is laid out by flex, which mirrors itself.

## Motion

None beyond `Pressable`'s press feedback — `fade` on links and the ellipsis, since a scale spring on
a word in a row of words reads as a jitter. No underline on press: that is a pointer affordance.

## Deviations from the design spec

- **`resolveBreadcrumbSeparatorGlyph` returns `"chevron-right" | "chevron-left"`, not the icon
  components.** `*.variants.ts` must stay free of React Native imports so it stays unit-testable,
  and a Central Icon pulls in `react-native-svg`. `Breadcrumb.Separator` maps the name to the glyph.
- **`Breadcrumb.Ellipsis` takes `hiddenCount`, `onPress` and `haptic`** beyond the spec's
  `ViewProps`. The list wires them itself; a hand-placed ellipsis in a custom layout needs the same
  three to be a working button with a truthful name.
- **`resolveBreadcrumbEllipsisLabel(count, isInteractive)`** names the static mark as well as the
  button, and handles the singular.
- **`Breadcrumb.Link` takes `isDisabled`**, the house spelling, rather than `Pressable`'s `disabled`,
  which it omits.

## What it does not do

- **No menu of hidden levels.** `onEllipsisPress` hands the caller the hidden indices; the caller
  opens whatever it likes — the playground opens a `BottomSheet`.
- **No router coupling and no `asChild`.** Links take `onPress` (rule 4).
- **No haptic by default.** Navigating back is not a confirmation; pass `haptic` to a link or the
  ellipsis if a design wants one.
- **No measuring.** Collapse is by count, not by width — a width-driven collapse needs an
  `onLayout` pass and paints a frame late.
