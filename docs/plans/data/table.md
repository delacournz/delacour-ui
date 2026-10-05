# Table — DATA-01-P1

> Read [README.md](README.md) § Conventions first. Subpath `@delacour/react-native-ui/table`.

## Purpose on mobile

Rows and columns of short values — an invoice's line items, a fixtures list, a settings matrix — where
the columns must line up across rows. Not a data grid: it renders what it is given, owns no sorting,
filtering or paging, and a long table goes in a virtualised list using the same row parts.

## API

```tsx
<Table columns={[{ flex: 2 }, { width: 72, align: "end" }, { width: 88, align: "end" }]} size="md" striped>
  <Table.Header>
    <Table.Row>
      <Table.Head>Item</Table.Head>
      <Table.Head sort={{ direction: "desc", onPress: toggle }}>Qty</Table.Head>
      <Table.Head>Total</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {rows.map((r) => (
      <Table.Row key={r.id} onPress={() => open(r.id)} isSelected={r.id === selected}>
        <Table.Cell>{r.name}</Table.Cell>
        <Table.Cell>{r.qty}</Table.Cell>
        <Table.Cell>{r.total}</Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
  <Table.Footer>…</Table.Footer>
  <Table.Caption>Prices include GST</Table.Caption>
</Table>

<Table.Frame title="Invoices" description="Last 30 days" action={<Button …/>}>…</Table.Frame>
```

```ts
type TableAlign = "start" | "center" | "end";
type TableColumn =
  | { kind?: "flex"; flex?: number; align?: TableAlign }     // default: flex 1
  | { kind: "fixed"; width: number; align?: TableAlign };
// Ergonomic input also accepts { width } / { flex } without `kind`; normalise with resolveTableColumn.

type TableSortDirection = "asc" | "desc";
type TableHeadSort =
  | { direction: TableSortDirection; onPress: () => void }   // sorted column
  | { direction?: undefined; onPress: () => void };          // sortable, not sorted

type TableProps = ViewProps & {
  columns?: readonly TableColumn[];
  size?: "sm" | "md";            // density: row min-height + cell padding + Text step
  variant?: "plain" | "outline";  // outline = Card-like border + rounded-lg
  striped?: boolean;
  minWidth?: number;              // > container width ⇒ horizontal ScrollView + edge fades
  className?: string;
};
type TableRowProps = { index?: number; isLast?: boolean; isSelected?: boolean; isDisabled?: boolean;
  onPress?: () => void; haptic?: PressableProps["haptic"]; className?: string; children: ReactNode };
type TableHeadProps = { column?: Partial<TableColumn>; sort?: TableHeadSort; labelClassName?: string; … };
type TableCellProps = { column?: Partial<TableColumn>; labelClassName?: string; … };
```

Parts: `Header`, `Body`, `Footer`, `Row`, `Head`, `Cell`, `Caption`, `Empty`, `Frame`. Hook `useTable()`.

- Column N of every row reads `columns[N]` by **cell index**; a `Head`/`Cell` `column` prop overrides
  per cell. The row publishes each child's index via `Children.map` (direct children only — warn in
  dev on a wrapper, as Steps does).
- `Body` publishes row index for striping; a row rendered outside `Body` (FlatList) passes
  `index`/`isLast` itself.
- A string/number child of `Head`/`Cell` is wrapped in `Text` (`Text.Label` for head, `Text.Paragraph`
  scaled by size for cell) with `tabular-nums` (`fontVariant`).
- `Empty` replaces `Body`'s rows; header stays.
- `Frame` = `Card` with a header tray (title, description, action) and the table inside, flush.

## Variants / states

- size `sm | md`; variant `plain | outline`; `striped` (even rows `bg-muted/50`); row `isSelected`
  (`bg-accent`), `isDisabled` (content opacity on cells, not on the Pressable — see Radio AGENTS),
  pressed feedback from `Pressable`.
- Hairline between rows (`border-b border-border`), none after `isLast`.
- Sort arrow: unsorted sortable = muted, dimmed `IconArrowUpDown`-style glyph; sorted = foreground label
  + direction glyph. `resolveTableSortGlyph(sort)` pure.

## A11y

- Root `role="table"` is not supported on iOS; use `accessibilityRole="none"` on root and announce
  structure via each cell's label: a cell's `accessibilityLabel` defaults to `"<header>, <value>"`
  when the header text is a string (Table collects header strings into context). Pure resolver
  `resolveCellAccessibilityLabel`.
- Pressable row = one element, `accessibilityRole="button"`, label = joined cell labels; `selected` state.
- Sortable head = button, `accessibilityValue.text` = "sorted ascending" / "descending" / "not sorted".
- Caption is read after the body.

## Motion

None beyond `Pressable`'s press feedback. Edge fades appear/disappear with scroll position via
Reanimated `useAnimatedScrollHandler` (opacity only).

## Reuses

`Pressable`, `Text`, `Card` (Frame), `Icon` + Central Icons, `expo-linear-gradient` (fade).
No new peers.

## Pure logic to unit-test (`table.variants.ts`)

- `resolveTableColumn(input)` — normalises `{ width }` / `{ flex }` / `{}` into the union; rejects
  `width <= 0` (dev warn, fall back to flex 1).
- `resolveCellLayout(columns, index, override)` → `{ style: { flex } | { width }, align }`; index beyond
  `columns.length` → flex 1 start.
- `resolveTableRowTone({ index, striped, isSelected })` → `"plain" | "striped" | "selected"`.
- `resolveTableSortGlyph(sort)` and `resolveTableSortAccessibility(sort)`.
- `resolveCellAccessibilityLabel(header, value)`.
- `tableVariants` slot classes per size/variant (assert class strings, as `list-group.variants.test.ts`).

## Playground demos (`apps/playground/src/demos/table/`)

`basic` (hero, capture), `columns` (flex + fixed + align, capture), `sortable` (state toggles direction,
capture), `selectable` (press to select, capture), `striped-small`, `frame` (capture), `wide-scroll`
(minWidth 640), `empty`, `virtualised` (FlatList + `Table.Row index/isLast`).

**Captures deferred (2026-10-05).** `bun run previews` shells out to the `argent` CLI, which is
retired and not installed on the build machine, so no media could be recorded. The five demos
above marked "capture" ship without `capture` meta (the BottomSheet arrangement: demos, no
captures), because `demos.test.ts` fails a captured demo with no manifest entry. When the preview
pipeline moves to agent-device, restore `capture: { align: "stretch" }` on `columns`, `sortable`,
`selectable`, `frame`, and `capture: { align: "stretch", hero: true }` on `basic`, run
`bun run previews -- -- --only table`, and add `<Preview>`s to `table.mdx`.

## Docs page

`apps/web/content/docs/native/components/table.mdx`: overview, anatomy, columns, sorting (caller
owns order), selection, wide tables, long tables (FlatList recipe), accessibility, API.

## Acceptance

- [x] `bun test packages/react-native-ui/src/components/table` green; covers every resolver above
- [x] Columns align across header/body/footer with mixed flex + fixed widths (simulator)
- [x] `minWidth` scrolls horizontally with edge fades that hide at the ends
- [x] Pressable row announces as one button with all cell values; sortable head announces sort state
- [x] `Table.Empty` keeps the header
- [x] FlatList demo uses `index`/`isLast` and stripes correctly
- [x] AGENTS.md (folder) + Components row + ITEM_META + gen-exports + registry:build + demos + docs + changeset
- [x] `bun test`, `bun run typecheck`, `bun run check` green at the repo root

Simulator check (2026-10-05, warden-iphone-17-2, dev client): every demo renders with columns aligned
across header, body and footer; the wide table scrolls with each edge fading only while columns
remain past it; a pressable row reads as one button with every cell and moves `selected` on press;
a sortable head is a button whose value reads "sorted ascending" / "not sorted"; `Table.Empty`
keeps the header; the FlatList demo stripes. Demo column widths were sized to the md cell inset
(16 pt a side) so no fixed column wraps mid-word. Preview media is still to be captured (above).
