# Table

Rows and columns of short values whose columns line up across every row — an invoice's line
items, a fixtures list, a settings matrix. Compound root plus `Table.Header`, `Table.Body`,
`Table.Footer`, `Table.Row`, `Table.Head`, `Table.Cell`, `Table.Caption`, `Table.Empty` and
`Table.Frame`, with `useTable()` for a custom row or cell.

`import { Table } from "@delacour/react-native-ui/table";`

It is not a data grid. It renders what it is given and owns no sorting, filtering or paging; a
long table goes in a `FlatList` using the same row parts.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/table` |
| `table.tsx` | Root — header-label collection, caption split, `minWidth`, and the `Object.assign` |
| `table-header.tsx` | `Table.Header` |
| `table-body.tsx` | `Table.Body` — row positions, and `Table.Empty` when there are no rows |
| `table-footer.tsx` | `Table.Footer` |
| `table-section.tsx` | `withRowPositions` — the index / isLast wrapper the three sections share |
| `table-row.tsx` | `Table.Row` — cell indices, tone, the pressable row and its label |
| `table-head.tsx` | `Table.Head` — the column heading, and the sort button |
| `table-cell.tsx` | `Table.Cell` — one value, with its column-prefixed accessible name |
| `table-caption.tsx` | `Table.Caption` |
| `table-empty.tsx` | `Table.Empty` |
| `table-frame.tsx` | `Table.Frame` — a `Card` with a header tray around a flush table |
| `table-scroll.tsx` | The horizontal scroller and its edge fades — internal |
| `table.context.tsx` | The table, section, row-position and cell contexts, with `useTable` |
| `table.types.ts` | `TableSlotProps`, `TableCellBaseProps` |
| `table.variants.ts` | Pure `tv()` slots + every resolver, no RN imports |
| `table.variants.test.ts` | |

## Design

- **Sizes**: `sm`, `md` — row min-height, cell padding and the cells' type step on one axis.
  **Variants**: `plain` (nothing drawn around it) and `outline` (`border-border bg-card
  rounded-lg`, clipped — the same corner a card takes). `striped` paints every second body row
  `bg-muted/50`; `isSelected` paints `bg-accent` and sets the cells' text on
  `accent-foreground`. Selected outranks striped (`resolveTableRowTone`).
- **Columns are declared once, on the table, and read by cell index.** Each row tells its
  direct children their position; the Nth cell reads `columns[N]` through `resolveCellLayout`.
  A header, the body and a footer therefore line up without a width on any cell, and a cell's
  `column` prop overrides its own. Past the end of `columns` a cell is `flex: 1` at the start.
- **A column is a style, not a class.** `{ flex }` and `{ width }` are numbers the caller chose,
  and Tailwind cannot compile a `w-[${n}px]` built at runtime — so the layout is an inline
  style, and only alignment is a class. A width that is not a positive number warns in
  development and falls back to `flex: 1`: a zero-width column hides a whole column of data
  with no error.
- **`min-w-0` on every cell.** Without it a flex column will not shrink below its longest word,
  and a long product name pushes the fixed price column off the end of the row.
- **A cell's inset is `Card`'s at the same size** — 3 at `sm`, 4 at `md` — so a table in a
  `Table.Frame` holds its first column under the frame's title instead of a few points off it.
- **Bare text is wrapped, in tabular figures.** A string or number child of `Head` becomes a
  muted `Text.Label`; of `Cell`, a `Text.Paragraph` stepped by size. Both carry
  `tabular-nums`, so a column of prices lines up digit for digit rather than drifting with
  each `1`.
- **Direct children only.** Rows count their cells and sections count their rows from direct
  children, which a `.map()` is flattened into — `Steps`' rule. A cell behind a wrapper
  component reads as column zero, and the row warns in development.
- **The row never fades.** `isDisabled` puts `opacity-50` on each cell and blocks the press;
  the row itself carries no opacity. `Pressable` multiplies a className's opacity into its
  press, so a faded row would also draw, and the two would compound — `Radio`'s arrangement.
- **The hairline is the row's own `border-b`, and the last row drops it.** `Table.Body`
  publishes `isLast`; the footer rules itself off with a `border-t`. A header row is never
  last, because its rule is what separates it from the body.
- **`Table.Empty` lives inside `Table.Body`.** The body shows it only when the rows came out
  empty, so a caller writes it once beside the `.map()` and never branches on the array's
  length — and the header stays where it was.
- **A caption sits outside the scroller.** The root lifts every `Table.Caption` out of its
  children and draws them after the table, so a wide table's note does not scroll off with
  its last column, and VoiceOver reads it after the body.

## Sorting

- **The caller owns the order.** `sort={{ direction, onPress }}` makes a head a button that
  draws the state; `onPress` is where the caller reorders. A head with no `direction` is
  sortable but not sorted and draws a dimmed `IconSortArrowUpDown`; the sorted head steps its
  label up to the foreground and draws `IconArrowUp` / `IconArrowDown`.
  `resolveTableSortGlyph` is that whole decision.
- **The sort state is the head's value.** "Qty, button, sorted descending" — the label stays
  the column's name, so a reader hears which column before which way.

## Accessibility

- **There is no table role on iOS.** The root is `accessibilityRole="none"`, and each cell
  instead names its column: its accessible name defaults to "<header>, <value>" when the
  matching head holds text (`resolveCellAccessibilityLabel`). The root reads the head text out
  of its element tree (`collectTableHeaderLabels`) rather than collecting it as heads mount,
  so the first frame's cells are already named.
- **A pressable row is one element.** `Pressable` is `accessible`, which merges the cells into
  it; its label is every cell's label joined in order (`resolveTableRowAccessibilityLabel`),
  and `isSelected` is its `selected` state. Built from the cells' props, not measured, so it
  changes with the data on the same render.

## Wide tables

- **`minWidth` wider than the container scrolls sideways.** The table lays out at the larger of
  the two, so on a wide screen it still fills; before the container is measured it holds
  `minWidth` without claiming to scroll (`resolveTableContentWidth`).
- **Each edge fades only when there are columns past it.** `resolveTableEdgeFade` runs in an
  animated style off the scroll offset — opacity only — so the start fade arrives as the first
  column leaves and the end fade goes as the last arrives. It is a self-contained worklet; a
  module-scope helper called from it would not be captured.
- **The fade dissolves into what is behind the table.** `outline` fades into its own `card`;
  `plain` takes the plane of the surface it is on — a `Table.Frame` is a card — and the page's
  `background` on no surface (`resolveTableFadeToken`). The far stop is the near colour at zero
  alpha via `transparentOf`, never `transparent`, which is transparent black and drags the
  gradient through grey. `expo-linear-gradient` is an existing peer; the fade is internal
  because nothing else in the package needs a horizontal one yet.

## Long tables

- **A `FlatList` renders `Table.Row`s directly, passing `index` and `isLast`.** There is no body
  around them to publish a position, so the row takes both as props — and stripes and drops its
  last hairline exactly as a body row does. A row with no section reads as body. Put the
  `Table.Header` above the list inside the same `<Table>` so both read one `columns`.

## Frame

- **`Table.Frame` is a `Card` with `pb-0` and the table flush.** The card's `padding="none"`
  clips, so a striped last row takes the card's corners; the header tray is `Card.Header` with
  `Card.Title`, `Card.Description` and `Card.Action`. Give it the table's `size` so the title
  and the first column share an inset, and leave the table `plain` — the frame is the outline.
