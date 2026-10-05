import { isValidElement, type ReactElement, type ReactNode, useCallback, useMemo, useState } from "react";
import { type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { type TableContextValue, TableProvider } from "./table.context";
import {
	collectTableHeaderLabels,
	resolveTableContentWidth,
	splitTableCaption,
	TABLE_DEFAULT_SIZE,
	TABLE_DEFAULT_VARIANT,
	type TableColumnInput,
	type TableSize,
	type TableVariant,
	tableVariants,
} from "./table.variants";
import { TableBody } from "./table-body";
import { TableCaption } from "./table-caption";
import { TableCell } from "./table-cell";
import { TableEmpty } from "./table-empty";
import { TableFooter } from "./table-footer";
import { TableFrame } from "./table-frame";
import { TableHead } from "./table-head";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";
import { TableScroll } from "./table-scroll";

export type TableProps = ViewProps & {
	/**
	 * One rule per column, read by every row by cell index: `{ flex }` shares the
	 * width left over by weight, `{ width }` is fixed points, and either takes an
	 * `align`. A cell past the end is `flex: 1` at the start.
	 */
	columns?: readonly TableColumnInput[];
	/** Density — the row height, the cell padding and the cells' type step. */
	size?: TableSize;
	/** `outline` draws a hairlined, rounded card around the table; `plain` draws nothing. */
	variant?: TableVariant;
	/** Paints every second body row on the muted fill. */
	striped?: boolean;
	/**
	 * The narrowest the table lays out at. Wider than its container, the table
	 * scrolls sideways with a fade at each edge that has more columns past it.
	 */
	minWidth?: number;
	className?: string;
	children?: ReactNode;
};

const is =
	(type: unknown) =>
	(node: ReactNode): boolean =>
		isValidElement(node) && node.type === type;

const HEADER_PREDICATES = { isHead: is(TableHead), isHeader: is(TableHeader), isRow: is(TableRow) };
const isCaption = is(TableCaption);

function TableRoot({
	columns,
	size = TABLE_DEFAULT_SIZE,
	variant = TABLE_DEFAULT_VARIANT,
	striped = false,
	minWidth,
	className,
	onLayout,
	children,
	...props
}: TableProps): ReactElement {
	const [containerWidth, setContainerWidth] = useState(0);

	const headerLabels = useMemo(() => collectTableHeaderLabels(children, HEADER_PREDICATES), [children]);
	const { content, captions } = splitTableCaption(children, isCaption);
	const layout = resolveTableContentWidth(minWidth, containerWidth);

	const context = useMemo<TableContextValue>(
		() => ({ columns, headerLabels, size, striped, variant }),
		[columns, headerLabels, size, striped, variant]
	);

	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			onLayout?.(event);
			setContainerWidth(event.nativeEvent.layout.width);
		},
		[onLayout]
	);

	const body =
		layout.contentWidth === undefined ? (
			content
		) : (
			<TableScroll contentWidth={layout.contentWidth} isScrollable={layout.isScrollable} size={size} variant={variant}>
				{content}
			</TableScroll>
		);

	// `none` rather than a table role, which iOS does not have: each cell names
	// its own column instead, and the caption is read last because it is drawn last.
	return (
		<TableProvider value={context}>
			<View
				accessibilityRole="none"
				className={tableVariants({ size, variant }).root({ className })}
				onLayout={minWidth === undefined ? onLayout : handleLayout}
				{...props}
			>
				{body}
				{captions}
			</View>
		</TableProvider>
	);
}

/**
 * Rows and columns of short values — an invoice's line items, a fixtures list —
 * where the columns line up across every row.
 *
 * **Columns are declared once, on the table.** Each row's Nth cell reads
 * `columns[N]`, so a header, a hundred body rows and a footer line up without a
 * width on any cell; a cell's `column` prop overrides its own.
 *
 * It renders what it is given. Sorting, filtering and paging are the caller's —
 * a sortable `Table.Head` draws the state and calls `onPress`. A long table goes
 * in a `FlatList` rendering `Table.Row`s with `index` and `isLast`.
 *
 * There is no table role on iOS, so each cell announces its column — "Qty, 3" —
 * and a pressable row is one button named by all of its cells.
 *
 * @example
 * <Table columns={[{ flex: 2 }, { width: 56, align: "end" }, { width: 88, align: "end" }]} striped>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head>Item</Table.Head>
 *       <Table.Head>Qty</Table.Head>
 *       <Table.Head>Total</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     {lines.map((line) => (
 *       <Table.Row key={line.id}>
 *         <Table.Cell>{line.name}</Table.Cell>
 *         <Table.Cell>{line.qty}</Table.Cell>
 *         <Table.Cell>{line.total}</Table.Cell>
 *       </Table.Row>
 *     ))}
 *     <Table.Empty>No line items</Table.Empty>
 *   </Table.Body>
 *   <Table.Caption>Prices include GST</Table.Caption>
 * </Table>
 *
 * @example
 * <Table.Frame title="Invoices" description="Last 30 days">
 *   <Table minWidth={560}>…</Table>
 * </Table.Frame>
 */
export const Table = Object.assign(TableRoot, {
	/** The column headings — one `Table.Row` of `Table.Head`s. */
	Header: TableHeader,
	/** The rows. Stripes them, drops the last hairline, and shows `Table.Empty` when there are none. */
	Body: TableBody,
	/** Totals under the body, ruled off and set heavier. */
	Footer: TableFooter,
	/** One row. With `onPress` it is one button named by its cells. */
	Row: TableRow,
	/** One column heading; with `sort`, a button that draws the sort state. */
	Head: TableHead,
	/** One value. Bare text is set in tabular figures and named by its column. */
	Cell: TableCell,
	/** A note drawn under the table and read after it. */
	Caption: TableCaption,
	/** What a body shows in place of rows when it has none. Write it inside `Table.Body`. */
	Empty: TableEmpty,
	/** A `Card` with a title, description and action, holding a table flush. */
	Frame: TableFrame,
	displayName: "DelacourUI.Table",
});
