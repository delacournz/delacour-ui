# PageHeader

The head of a profile or place screen — a cover, a face lifted over its lower
edge, a title block, actions and a strip of numbers. For a *someone* or a
*somewhere*: a person, a team, a venue, a playlist. Compound root plus nine
parts, every one optional.

`import { PageHeader } from "@delacour/react-native-ui/page-header";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/page-header` |
| `page-header.tsx` | Root + the `Object.assign` compound surface |
| `page-header-cover.tsx` | `PageHeader.Cover` — gradient, picture over it, inset growth |
| `page-header-avatar.tsx` | `PageHeader.Avatar`, plus its internal `Rosette` leaf |
| `page-header-content.tsx` | `PageHeader.Content` — the title column |
| `page-header-title.tsx` | `PageHeader.Title` — `Text.Title`, one line, a heading |
| `page-header-description.tsx` | `PageHeader.Description` — muted `Text.Paragraph`, three lines |
| `page-header-meta.tsx` | `PageHeader.Meta` — a glyph and a caption |
| `page-header-actions.tsx` | `PageHeader.Actions` — a wrapping row of the caller's buttons |
| `page-header-stats.tsx` | `PageHeader.Stats`, plus its internal `Divider` leaf |
| `page-header-stat.tsx` | `PageHeader.Stat` — a value and a label; a button with `onPress` |
| `page-header.context.tsx` | `PageHeaderProvider`, `usePageHeader()`, `usePageHeaderContext()`, `usePageHeaderPart()`, the cover registry and the stats context |
| `page-header.types.ts` | `PageHeaderSlotProps`, shared by `Content`, `Actions`, `Meta` and `Stats` |
| `page-header.variants.ts` | The slotted `tv()`, constants, and the size, overlap, cover and padding resolvers |
| `page-header.variants.test.ts` | |
| `page-header.utils.ts` | `formatStatCount`, `resolveStatLabel`, `resolvePageHeaderAvatarLabel`, `resolvePageHeaderCoverStops`, `isEmptyText` |
| `page-header.utils.test.ts` | |

## Axes

| Axis | Values | Effect |
| --- | --- | --- |
| `variant` | `page` (default) / `card` | `page` paints nothing, bleeds through a `Screen`'s gutter and runs its cover under the status bar. `card` is a clipped `Surface` with `padding="none"` and a 16pt inner gutter |
| `align` | `center` (default) / `start` | `center` is a column centred under a 96pt face; `start` puts a 64pt face and the text on the leading edge |
| `Stats` `layout` | `stacked` (default) / `inline` | `stacked` is value over label in equal-width cells; `inline` runs `1.2K Followers` together and wraps |

## Design

- **Every part is optional and drawn in source order.** The root never walks
  its children. Reordering, omitting or wrapping a part is the caller's call;
  the header degrades one part at a time — no cover, no avatar, no stats.
- **The cover registers itself; that is the only thing the root learns.**
  `PageHeader.Cover` calls a registry callback from a layout effect, and the
  root flips `hasCover` in context. `PageHeader.Avatar` reads it to decide
  whether to lift. Inspecting `children` for a `Cover` element would miss one
  wrapped in a caller's own component; a layout effect lands before paint, so
  the avatar never draws flat for a frame. The callback travels in a second
  context so a part that only registers does not re-render when the flag flips.
- **The lift is a number, so the face size is an `Avatar` step.** The avatar's
  top margin is `-(AVATAR_SIZE_POINTS[size] / 2 + PAGE_HEADER_RING_WIDTH)` —
  the middle of the ringed face on the cover's edge. That is why `Avatar` gained
  a `2xl` (96pt) step rather than this component passing `className="size-24"`:
  a class would make `AVATAR_SIZE_POINTS` lie, and the overlap, the group maths
  and the initials size would all drift. `PAGE_HEADER_RING_WIDTH` is pinned by a
  test to the `avatarRing` slot's `p-1`.
- **The ring is the ground below.** `bg-background` on a page, `bg-card` in a
  card (`resolvePageHeaderRing`), so a face over a picture is cut out cleanly
  instead of carrying a grey or white halo. The rosette's border uses the same
  fill.
- **No root `gap`; each part owns its top margin.** The lift is a negative
  margin; a root gap would push the avatar down by the gap and off the cover's
  line. The lift is written as a style only when there is one, so it replaces
  the ring's `mt-3` rather than adding to it.
- **Full-width parts say `w-full`, never `self-stretch`.** A centred root is
  `items-center`, which shrink-wraps its children; the cover, content, actions
  and stats keep the width without overriding the parent's alignment. A test
  forbids `self-*` on every slot.
- **A page header takes the gutter back.** `Screen`'s scrollables pad by
  `px-screen-gutter`; inside a `Screen` the root adds `-mx-screen-gutter`
  (`isBleeding`) so the cover meets both edges, and content, actions and stats
  restore the gutter on themselves. Outside a `Screen` there is nothing to take
  back, and the flag is off.
- **In `page` the cover reaches the top edge.** Inside a `Screen` it pulls
  itself up under the scrollable's top spacer (`resolvePageHeaderCoverOffset`)
  and grows by the same amount (`resolvePageHeaderCoverHeight`), reading the
  navbar's shared values on the UI thread so it moves in the same frame the
  navbar measures — under an `overlay` navbar it runs to the top, under a
  `static` one the spacer is zero and nothing changes. Outside a `Screen` it
  grows by the safe-area inset. A card never grows. The cover's `children`
  overlay starts below that inset, so a back button pinned `top-2` is never
  under the clock. Never `pt-safe` — it resolves to zero on React Native (see
  [Screen](../screen/AGENTS.md)).
- **A coverless page outside a `Screen` pads itself.** With no cover to grow,
  `resolvePageHeaderTopPadding` adds the safe-area inset so the face is never
  under the status bar; inside a `Screen` the spacer already clears it.
- **The gradient is always painted; the picture goes over it** — `Avatar`'s
  rule. A slow or dead URL shows the theme's gradient, never an empty box, and
  there is no loading state. The default fades `primary` into its own zero
  alpha via `transparentOf` (never the `transparent` keyword, which is
  transparent black and greys the fade); if primary arrives in a notation
  `transparentOf` cannot read, the far stop is the ground colour — the page, or the card.
  `resolvePageHeaderCoverStops` holds both rules. Colour lookups are a fixed
  four `useThemeColor` calls so hook order never depends on how many colours
  were passed.
- **Stacked stats are equal-width cells.** `flex-1` per stat, so with
  "Followers", "Posts" and "Following" the middle one stays under the title.
  Labels may wrap to two lines rather than clip at a large font scale.
- **Compaction is visual only.** `formatStatCount` is hand-rolled — Hermes does
  not guarantee `Intl`'s compact notation — and rounds across a unit boundary
  (`999_950` → `1M`, never `1000K`). What a screen reader hears is
  `resolveStatLabel`: the full, locale-grouped number and the label, as one
  element.
- **A stat is content until it is given something to do.** No `onPress`, it is
  a plain view; with one, a `Pressable` announced as a button. The same rule as
  `Avatar` and `Badge`.
- **The heading role is on the title, not the block.** `accessibilityRole="header"`
  on the root would fold the actions into one element a screen reader cannot
  step into. A decorative cover hides its picture layer (not itself), so an
  overlaid back button stays reachable. `isVerified` appends ", verified" to
  the avatar's label, since the rosette is drawn inside a single accessible
  element. Dividers are hidden.
- **An empty title or description renders nothing** (`isEmptyText`), so the
  column leaves no gap for a missing bio.
- **Not inside `Screen.Header`.** `Screen.Header` is a gutter-less `gap-1` block;
  wrapping this in it stacks a second view for nothing. Pass `PageHeader` to a
  scrollable's `header` prop directly.
- **No new tokens and no new peers.** The gradient is `expo-linear-gradient`,
  already a peer through `Screen.ScrollShadow`; the picture is React Native's
  `Image`, not `expo-image`.

## Out of scope

Parallax and stretch-on-overscroll (a follow-up `<PageHeader.Cover stretch>`
reading `Screen`'s scroll offset, gated by `useCalmMotion()`), collapsing into
the navbar, breadcrumbs and back buttons, upload UI for the cover or the face, a
`PageHeader.Skeleton` (the `no-cover` demo shows the recipe with `Skeleton`), and
`expo-image`.

## Verification

Pure logic is covered by the two test files. Checked on an iPhone 17 simulator
(dev client, 2026-10-05):

- **Inside a `Screen` with an overlay navbar** (`in-a-screen`): the cover's
  frame is `y=0`, full width — under the status bar and the navbar, no gap — and
  the avatar's centre sits on the cover's lower edge. The navbar's resting
  background paints over the top of the cover; that is the navbar's, not this
  component's.
- **Ring and fade match the ground** in light and dark, on the page and in a
  card. The card check found the cover's base fill was `bg-background`, which
  left a band of page colour across every card; the `cover` slot now takes the
  variant's fill and a test holds it.
- **Equal-width stats**: two stacked stats measured 180.7 and 180.3pt.
- **VoiceOver labels**: "Kate Austen, verified", "1,234 Followers" as a button,
  "87 Posts" as plain content. The stat press fired.
- **Largest Dynamic Type**: no stat clipped. Inline stats with `isDivided` that
  wrap leave a hairline at the end of the first row — a divider cannot know
  where the row breaks. Prefer `stacked` when dividers matter.

**Preview capture is deferred.** `bun run previews` needs the argent CLI, which
is not installed here, so no demo carries `meta.capture` and the docs page has
no `<Preview>`. When the tool is back: mark `profile` (hero), `gradient-cover`,
`aligned-start`, `stats` and `card-in-list` as captures, all
`align: "stretch"`, and add the `<Preview>` blocks to `page-header.mdx`.
