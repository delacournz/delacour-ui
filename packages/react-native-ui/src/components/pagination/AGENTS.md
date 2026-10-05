# Pagination

Moves through the pages of a result set — an order history, search results, an admin table —
where the reader needs to say "page 7" rather than scroll. Compound root plus
`Pagination.Item`, `.Previous`, `.Next`, `.Ellipsis`, `.Summary` and `.Status`; the compact
readout and the shared control are internal.

`import { Pagination } from "@delacour/react-native-ui/pagination";`

The component owns the arithmetic — which numbers to draw, where the gaps fall, which arrow is
disabled. The caller owns fetching and slicing.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/pagination` |
| `pagination.tsx` | Root — the page state, the clamp report, the default run, and the `Object.assign` |
| `pagination-item.tsx` | `Pagination.Item` — one page number and its cross-fading fill |
| `pagination-control.tsx` | The arrow both `Previous` and `Next` render — internal |
| `pagination-previous.tsx` | `Pagination.Previous` |
| `pagination-next.tsx` | `Pagination.Next` |
| `pagination-ellipsis.tsx` | `Pagination.Ellipsis` — a gap that jumps `pageJump` pages |
| `pagination-compact.tsx` | The `compact` variant's "3 / 12" readout — internal |
| `pagination-summary.tsx` | `Pagination.Summary` — leading content that pushes the run to the end |
| `pagination-status.tsx` | `Pagination.Status` — "41–60 of 472" |
| `pagination.context.tsx` | The root's context, `usePagination` and the internal part guard |
| `pagination.types.ts` | `PaginationTargetProps`, shared by every pressable part |
| `pagination.variants.ts` | Pure `tv()` slots + every resolver and formatter, no RN imports |
| `pagination.variants.test.ts` | |

## Design

- **Variants**: `numbers` (the run of pages and gaps between the arrows), `compact` (one
  "3 / 12" readout between them) and `simple` (the arrows alone, labelled "Previous" and
  "Next"). **Sizes**: `sm` and `md`, on the button scale — `h-button-*` with `min-w-button-*`,
  so every target is a square at least as wide as it is tall and "128" grows sideways rather
  than clipping.
- **The `numbers` run is fixed-length.** Once `count` exceeds
  `resolvePaginationRunLength` — `2 × boundaries + 2 × siblings + 3` — every page draws exactly
  that many tokens. The window of siblings slides *inside* the run, pinned against an end until
  the current page is far enough in to centre it, so the number under the reader's thumb never
  slides away as they tap through. `resolvePaginationRange` is that whole decision, and the suite
  checks it across counts 0/1/5/7/24/100 × siblings 0–2 × boundaries 0–2 × every page.
- **An ellipsis never hides one page.** The slot either side of the window is a gap only when
  it stands for two or more pages; standing for one, it shows that page — same width, nothing
  hidden behind a "…" that would take a tap to reveal a single number.
- **A gap is a target, not a decoration.** Pressing it jumps `pageJump` pages (default 5) the
  way it points, clamped — the quickest way across a long count on a screen with no room to
  type a number.
- **Children are leading content, unless they are a run.** Without children the root draws its
  variant's default run. A `Pagination.Summary` child sits at the start and grows, pushing the
  run to the trailing edge. Children that include a run part (`Item`, `Previous`, `Next`,
  `Ellipsis`) replace the default run outright — the escape hatch for a hand-built run that
  still reads the root's page, clamp and `select`.

## State

- **`useControllableState`** for `page` / `defaultPage` / `onPageChange`.
- **A held page outside `[1, count]` is drawn as its clamp at once and reported once.** A
  controlled `page` left behind by a shrinking result set renders clamped, and an effect calls
  `onPageChange(clamped)` — once per out-of-range `(page, count)` pair, so a parent that
  ignores the report is not called again on every render. `resolvePageCorrection` is the rule.
- **Re-pressing the current page is quiet** — `shouldEmitPage`, the rule `Radio.Group` and
  `Steps` keep. A disabled root never emits.
- **`usePagination`** is exported for a custom part — a jump-to-page field, a page-size picker —
  that has to agree with the pagination it sits in. It throws outside one.

## Interaction

- **Every target is a `Pressable`** with `feedback="fade"` and the root's `haptic` (default
  `"selection"`) unless it names its own.
- **Controls are disabled at their end** (`resolveControlState`) and announced so. A disabled
  root disables every target.
- **The fade lands on each element, never on the root.** A control already disabled at its end
  would otherwise fade twice under a disabled root.
- **44pt targets in `sm`.** An `sm` target draws at 36 and carries 4pt of `hitSlop` on every
  side (`PAGINATION_HIT_SLOP`). The `sm` run's gap is eight, so one target's slop meets its
  neighbour's exactly and never overlaps it — an overlap would hand the press to whichever
  sibling sits later in the tree. The suite reads both numbers back out of `tokens.css` and the
  `run` slot.

## Accessibility

- **Root**: `accessibilityRole="toolbar"`, named by `accessibilityLabel` ("Pagination").
- **Item**: a button named "Page 3", `selected` when current.
- **Previous / Next**: "Previous page" / "Next page", disabled at the ends.
- **Ellipsis**: "Jump forward 5 pages" / "Jump back 5 pages" — "…" names nothing.
- **Compact**: one `adjustable` element whose value is "Page 3 of 12" and whose increment and
  decrement actions move a page, so a VoiceOver swipe works the whole control from one stop. Its
  readout does not scale with the OS text size: it shares a row with fixed-size targets, and the
  page is already in the accessibility value.
- **RTL**: the row flips by itself; `resolveControlGlyph` mirrors the chevrons so Previous
  still points to the start.

## Colour

- **Current page**: `bg-primary` fill with `text-primary-foreground`; every other target is
  ghost with `text-foreground`. Colour is on the `Text` (rule 1). The chevrons take theirs as a
  token through one `IconDefaultsProvider`; `resolveItemForeground` and
  `resolveControlForeground` name the tokens and the suite asserts that the slot classes agree
  and that `theme.css` declares them.

## Motion

- **The current page's fill is its own layer and cross-fades** over
  `PAGINATION_FILL_DURATION_MS` (150ms) with `withTiming`, while the label's colour changes
  outright. Reanimated's `System` reduce-motion policy snaps it. The fill is seeded at its
  settled value, so an item that mounts current — the window sliding a new page in — is drawn
  filled rather than fading up from nothing.
- **No layout animation.** The run is fixed-width by design; nothing moves but the fill.

## What it does not do

- **No localisation in v1.** Every string — "Page 3", "41–60 of 472", "Jump forward 5 pages" —
  is English, from the `format*` functions. A `labels` prop is the planned way in.
- **No jump-to-page field and no page-size picker.** Build either as a custom part with
  `usePagination`, inside `Pagination.Summary`.
- **No fetching, slicing or infinite scroll.** The caller turns a page into rows.
- **No scrolling run.** A run wider than its row is the caller's cue to lower `siblings` or
  `boundaries`, or switch to `compact`.
