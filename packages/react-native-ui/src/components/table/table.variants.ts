import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import type { VariantProps } from "tailwind-variants";
import { tv } from "../../lib/tv";
import type { SurfacePlane } from "../surface/surface.variants";

export const TABLE_SIZES = ["sm", "md"] as const;
export const TABLE_VARIANTS = ["plain", "outline"] as const;
export const TABLE_ALIGNS = ["start", "center", "end"] as const;
export const TABLE_ROW_TONES = ["plain", "striped", "selected"] as const;
export const TABLE_SORT_DIRECTIONS = ["asc", "desc"] as const;
/** Which block of the table a row sits in. Only `body` rows stripe. */
export const TABLE_SECTIONS = ["header", "body", "footer"] as const;

export type TableSize = (typeof TABLE_SIZES)[number];
export type TableVariant = (typeof TABLE_VARIANTS)[number];
export type TableAlign = (typeof TABLE_ALIGNS)[number];
export type TableRowTone = (typeof TABLE_ROW_TONES)[number];
export type TableSortDirection = (typeof TABLE_SORT_DIRECTIONS)[number];
export type TableSection = (typeof TABLE_SECTIONS)[number];

export const TABLE_DEFAULT_SIZE: TableSize = "md";
export const TABLE_DEFAULT_VARIANT: TableVariant = "plain";

/**
 * One column's width rule. A `flex` column shares what the fixed ones leave, by
 * weight; a `fixed` column is exactly `width` points.
 */
export type TableColumn =
	| { kind?: "flex"; flex?: number; align?: TableAlign }
	| { kind: "fixed"; width: number; align?: TableAlign };

/**
 * What a caller may write: a {@link TableColumn}, or the shorthand `{ width }`
 * with no `kind`. {@link resolveTableColumn} normalises either.
 */
export type TableColumnInput = TableColumn | { kind?: undefined; width: number; align?: TableAlign };

/** A per-cell override. Any field it names wins over the column's. */
export type TableColumnOverride = {
	kind?: "flex" | "fixed";
	flex?: number;
	width?: number;
	align?: TableAlign;
};

/** A column with every default filled in. */
export type ResolvedTableColumn =
	| { kind: "flex"; flex: number; align: TableAlign }
	| { kind: "fixed"; width: number; align: TableAlign };

/** The style a cell's box takes, and how its content sits in it. */
export type TableCellLayout = {
	style: { flex: number } | { width: number };
	align: TableAlign;
};

/** A sortable head's state. `direction` absent means sortable but not the sorted column. */
export type TableHeadSort =
	| { direction: TableSortDirection; onPress: () => void }
	| { direction?: undefined; onPress: () => void };

/** What a head's trailing glyph draws. `none` is a head that cannot sort. */
export type TableSortGlyph = "none" | "unsorted" | TableSortDirection;

export type TableSortAccessibility =
	| { isSortable: false }
	| { isSortable: true; valueText: "not sorted" | "sorted ascending" | "sorted descending" };

/** How far, in points, the content scrolls before an edge fade is fully in. */
export const TABLE_EDGE_FADE_RAMP = 24;

const DEFAULT_ALIGN: TableAlign = "start";

function warnColumn(message: string): void {
	if (process.env.NODE_ENV !== "production") console.warn(`Table: ${message}`);
}

function isPositive(value: number): boolean {
	return Number.isFinite(value) && value > 0;
}

/**
 * Normalises a column into the {@link ResolvedTableColumn} union.
 *
 * `{}` and `undefined` are `flex: 1` at the start. A bare `{ width }` is fixed. A
 * width that is not a positive finite number warns in development and falls back
 * to `flex: 1` rather than rendering a zero-width column — a column that vanishes
 * takes its whole column of data with it, silently. A non-positive `flex` falls
 * back to 1 for the same reason.
 */
export function resolveTableColumn(input?: TableColumnInput | TableColumnOverride): ResolvedTableColumn {
	const align = input?.align ?? DEFAULT_ALIGN;
	if (!input) return { align, flex: 1, kind: "flex" };

	const width = "width" in input ? input.width : undefined;
	const isFixed = input.kind === "fixed" || (input.kind === undefined && width !== undefined);

	if (isFixed) {
		if (width !== undefined && isPositive(width)) return { align, kind: "fixed", width };
		warnColumn(`a column width must be a positive number, got ${String(width)}. Falling back to flex 1.`);
		return { align, flex: 1, kind: "flex" };
	}

	const flex = "flex" in input ? input.flex : undefined;
	if (flex === undefined) return { align, flex: 1, kind: "flex" };
	if (isPositive(flex)) return { align, flex, kind: "flex" };
	warnColumn(`a column flex must be a positive number, got ${String(flex)}. Falling back to 1.`);
	return { align, flex: 1, kind: "flex" };
}

/**
 * The layout of the cell at `index`, read from `columns[index]` with a cell's own
 * `column` prop layered over it.
 *
 * An override naming a `width` makes the cell fixed and one naming a `flex` makes
 * it flex, whatever the column said; an override naming only `align` keeps the
 * column's width rule. A cell past the end of `columns` is `flex: 1` at the start.
 */
export function resolveCellLayout(
	columns: readonly TableColumnInput[] | undefined,
	index: number,
	override?: TableColumnOverride
): TableCellLayout {
	const base = resolveTableColumn(columns?.[index]);
	const align = override?.align ?? base.align;

	let column: ResolvedTableColumn = base;
	if (override?.width !== undefined || override?.kind === "fixed") {
		column = resolveTableColumn({ align, kind: "fixed", width: override.width ?? Number.NaN });
	} else if (override?.flex !== undefined) {
		column = resolveTableColumn({ align, flex: override.flex, kind: "flex" });
	}

	return {
		align,
		style: column.kind === "fixed" ? { width: column.width } : { flex: column.flex },
	};
}

/**
 * How a row is painted. Selected outranks striped; a striped table paints every
 * second row, starting with the second, so the first body row always reads as
 * the page.
 */
export function resolveTableRowTone({
	index,
	striped = false,
	isSelected = false,
}: {
	index?: number;
	striped?: boolean;
	isSelected?: boolean;
}): TableRowTone {
	if (isSelected) return "selected";
	if (striped && index !== undefined && index % 2 === 1) return "striped";
	return "plain";
}

/** What a head draws after its label. */
export function resolveTableSortGlyph(sort: TableHeadSort | undefined): TableSortGlyph {
	if (!sort) return "none";
	return sort.direction ?? "unsorted";
}

/** Whether a head is announced as a button, and the sort state it reads as its value. */
export function resolveTableSortAccessibility(sort: TableHeadSort | undefined): TableSortAccessibility {
	if (!sort) return { isSortable: false };
	if (sort.direction === "asc") return { isSortable: true, valueText: "sorted ascending" };
	if (sort.direction === "desc") return { isSortable: true, valueText: "sorted descending" };
	return { isSortable: true, valueText: "not sorted" };
}

/**
 * A cell's accessible name: its column's header, then its value — "Qty, 3".
 *
 * There is no table role on iOS, so a screen reader landing on a cell has no
 * other way to know which column it is in. A cell whose value is not text
 * returns `undefined` and is left to name itself.
 */
export function resolveCellAccessibilityLabel(
	header: string | undefined,
	value: string | number | undefined
): string | undefined {
	if (value === undefined) return undefined;
	const name = header?.trim();
	return name ? `${name}, ${value}` : String(value);
}

/** A pressable row's accessible name: every cell's label, in order. */
export function resolveTableRowAccessibilityLabel(labels: readonly (string | undefined)[]): string | undefined {
	const joined = labels.filter((label): label is string => Boolean(label)).join(", ");
	return joined || undefined;
}

export type TableContentWidth =
	| { isScrollable: false; contentWidth?: undefined }
	| {
			isScrollable: boolean;
			contentWidth: number;
	  };

/**
 * The width a table with a `minWidth` lays out at, and whether it scrolls.
 *
 * It takes the larger of `minWidth` and the container, so a table on a wide
 * screen still fills it. Before the container is measured it holds `minWidth`
 * but does not claim to scroll — that would flash the edge fade for a frame on
 * a screen wide enough not to need it.
 */
export function resolveTableContentWidth(minWidth: number | undefined, containerWidth: number): TableContentWidth {
	if (minWidth === undefined) return { isScrollable: false };
	if (containerWidth <= 0) return { contentWidth: minWidth, isScrollable: false };
	return { contentWidth: Math.max(minWidth, containerWidth), isScrollable: minWidth > containerWidth };
}

/**
 * The opacity of each horizontal edge fade at a scroll offset.
 *
 * The start fade is out at rest and arrives over the first
 * {@link TABLE_EDGE_FADE_RAMP} points; the end fade is in until the last ramp's
 * worth, then leaves. Content that fits draws neither — a fade promising columns
 * that do not exist is worse than none.
 *
 * Self-contained, because it runs inside an animated style on the UI thread: a
 * module-scope helper is not captured into a worklet's closure.
 */
export function resolveTableEdgeFade({
	offset,
	contentWidth,
	viewportWidth,
}: {
	offset: number;
	contentWidth: number;
	viewportWidth: number;
}): { start: number; end: number } {
	"worklet";
	const maxScroll = contentWidth - viewportWidth;
	if (maxScroll <= 0) return { end: 0, start: 0 };
	const start = Math.min(1, Math.max(0, offset / TABLE_EDGE_FADE_RAMP));
	const end = Math.min(1, Math.max(0, (maxScroll - offset) / TABLE_EDGE_FADE_RAMP));
	return { end, start };
}

/** The theme token an edge fade dissolves into. */
export type TableFadeToken = "background" | "card" | "secondary" | "tertiary";

const PLANE_FADE_TOKENS: Record<SurfacePlane, TableFadeToken> = {
	default: "card",
	secondary: "secondary",
	tertiary: "tertiary",
};

/**
 * The colour a wide table's edge fades into: whatever is painted behind it.
 *
 * An `outline` table paints `card` itself. A `plain` one is transparent, so it
 * takes the plane of the surface it sits on — a `Table.Frame` is a card — and
 * the page's `background` on no surface at all. A fade into the wrong colour
 * reads as a grey band rather than as the columns running on.
 */
export function resolveTableFadeToken({
	variant,
	plane,
}: {
	variant: TableVariant;
	plane: SurfacePlane | null;
}): TableFadeToken {
	if (variant === "outline") return "card";
	return plane ? PLANE_FADE_TOKENS[plane] : "background";
}

/** The text a node holds directly — strings and numbers, joined. `undefined` if it holds anything else. */
export function readNodeText(node: ReactNode): string | undefined {
	const parts = Children.toArray(node);
	if (parts.length === 0) return undefined;
	let text = "";
	for (const part of parts) {
		if (typeof part !== "string" && typeof part !== "number") return undefined;
		text += String(part);
	}
	return text;
}

type ElementPredicate = (node: ReactNode) => boolean;

function childrenOf(node: ReactNode): ReactNode {
	return isValidElement<{ children?: ReactNode }>(node) ? node.props.children : undefined;
}

/**
 * The text of each `Table.Head` in the table's header, by column.
 *
 * Read from the element tree rather than collected as the heads mount, so the
 * first frame's cells already carry their column names. It walks direct
 * children only — `Table` › `Header` › `Row` › `Head` — the way `Steps` counts
 * its items; a head behind a wrapper component reads as `undefined`, and its
 * column's cells announce their value alone.
 */
export function collectTableHeaderLabels(
	children: ReactNode,
	{ isHeader, isRow, isHead }: { isHeader: ElementPredicate; isRow: ElementPredicate; isHead: ElementPredicate }
): (string | undefined)[] {
	const header = Children.toArray(children).find(isHeader);
	if (!header) return [];
	const row = Children.toArray(childrenOf(header)).find(isRow);
	if (!row) return [];
	return Children.toArray(childrenOf(row))
		.filter(isHead)
		.map((head) => readNodeText(childrenOf(head)));
}

/**
 * Splits a body's children into its rows and its `Table.Empty`.
 *
 * The empty state is shown only when there are no rows, so a caller writes it
 * once beside the `.map()` and never branches on the array's length.
 */
export function splitTableBodyChildren(
	children: ReactNode,
	isEmpty: ElementPredicate
): { rows: ReactElement[]; empty: ReactElement | null } {
	const rows: ReactElement[] = [];
	let empty: ReactElement | null = null;
	for (const child of Children.toArray(children)) {
		if (!isValidElement(child)) continue;
		if (isEmpty(child)) empty = empty ?? child;
		else rows.push(child);
	}
	return { empty: rows.length === 0 ? empty : null, rows };
}

/**
 * Lifts `Table.Caption`s out of the table's other children.
 *
 * A caption sits under the table, outside its horizontal scroller, so a wide
 * table's note does not scroll away with its last column.
 */
export function splitTableCaption(
	children: ReactNode,
	isCaption: ElementPredicate
): { content: ReactNode[]; captions: ReactNode[] } {
	const content: ReactNode[] = [];
	const captions: ReactNode[] = [];
	for (const child of Children.toArray(children)) {
		(isCaption(child) ? captions : content).push(child);
	}
	return { captions, content };
}

/**
 * Styling for every part of a table.
 *
 * One slotted `tv()` because size drives the row height, the cell padding and
 * the cell's type step together — three numbers that must move as one or the
 * header and the body stop lining up.
 *
 * **Columns are styles, not classes.** A column's `flex` or `width` is a number
 * the caller chose, and Tailwind's scanner cannot see a `w-[${n}px]` built at
 * runtime — so {@link resolveCellLayout} returns a style, and only alignment is
 * a class here.
 *
 * **The row never fades.** `isDisabled` lands on the `cell` slot. `Pressable`
 * multiplies a className's opacity into its press, so a faded row would also
 * draw, but the cells already fade and the two would compound — `Radio`'s
 * arrangement, for the same reason.
 *
 * Rule 1: `root`, `row` and `cell` carry no `text-*`. The text tokens live on
 * `cellText` and `headText`, because a `View` does not cascade colour.
 *
 * A cell's horizontal padding is `Card`'s inset at the same size — 3 at `sm`, 4
 * at `md` — so a table in a `Table.Frame` holds its first column under the
 * frame's title rather than a few points off it.
 *
 * `min-w-0` on the cell lets a flex column shrink below its longest word, so a
 * long name wraps inside its column instead of shoving the fixed columns off
 * the row.
 */
export const tableVariants = tv({
	slots: {
		root: "",
		scroll: "",
		header: "",
		body: "",
		footer: "border-border border-t",
		row: "w-full flex-row items-stretch border-border border-b",
		cell: "min-w-0 justify-center",
		head: "min-w-0 justify-center",
		cellText: "tabular-nums",
		headText: "font-medium tabular-nums",
		sort: "flex-row items-center gap-1",
		sortIcon: "size-icon-xs",
		caption: "pt-2 text-muted-foreground text-sm",
		empty: "items-center justify-center gap-1 py-8",
		emptyText: "text-center text-muted-foreground text-sm",
		fadeStart: "absolute top-0 bottom-0 left-0 w-6",
		fadeEnd: "absolute top-0 right-0 bottom-0 w-6",
	},
	variants: {
		variant: {
			plain: { root: "bg-transparent" },
			outline: { root: "overflow-hidden rounded-lg border border-border bg-card" },
		},
		size: {
			sm: {
				row: "min-h-9",
				cell: "px-3 py-1.5",
				head: "px-3 py-1.5",
				cellText: "text-sm",
				headText: "text-xs",
				caption: "px-3 text-xs",
				empty: "py-6",
			},
			md: {
				row: "min-h-11",
				cell: "px-4 py-2.5",
				head: "px-4 py-2",
				cellText: "text-base",
				headText: "text-sm",
				caption: "px-4",
			},
		},
		tone: {
			plain: { cellText: "text-foreground" },
			striped: { row: "bg-muted/50", cellText: "text-foreground" },
			selected: { row: "bg-accent", cellText: "text-accent-foreground" },
		},
		section: {
			header: {},
			body: {},
			footer: { cellText: "font-semibold" },
		},
		align: {
			start: {
				cell: "items-start",
				head: "items-start",
				cellText: "text-left",
				headText: "text-left",
				sort: "justify-start",
			},
			center: {
				cell: "items-center",
				head: "items-center",
				cellText: "text-center",
				headText: "text-center",
				sort: "justify-center",
			},
			end: {
				cell: "items-end",
				head: "items-end",
				cellText: "text-right",
				headText: "text-right",
				sort: "justify-end",
			},
		},
		// The empty `false` branches type each prop as `boolean` rather than `true`.
		// See the note in button.variants.ts.
		isSorted: {
			true: { headText: "text-foreground" },
			false: { headText: "text-muted-foreground", sortIcon: "opacity-60" },
		},
		isLast: { true: { row: "border-b-0" }, false: {} },
		isDisabled: { true: { cell: "opacity-50" }, false: {} },
	},
	defaultVariants: {
		variant: TABLE_DEFAULT_VARIANT,
		size: TABLE_DEFAULT_SIZE,
		tone: "plain",
		section: "body",
		align: "start",
		isSorted: false,
		isLast: false,
		isDisabled: false,
	},
});

export type TableVariantProps = VariantProps<typeof tableVariants>;
