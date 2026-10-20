import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { TableColumnInput, TableRowTone, TableSection, TableSize, TableVariant } from "./table.variants";

export type TableContextValue = {
	/** The column rules every row reads by cell index. */
	columns: readonly TableColumnInput[] | undefined;
	size: TableSize;
	variant: TableVariant;
	striped: boolean;
	/**
	 * Each header cell's text, by column — `undefined` where a head holds
	 * something other than text. A cell's accessible name is prefixed with it.
	 */
	headerLabels: readonly (string | undefined)[];
};

/** Where a row sits, as published by the section around it. */
export type TableRowPositionValue = {
	section: TableSection;
	index: number;
	isLast: boolean;
};

/** What a cell needs from the row it sits in. */
export type TableCellContextValue = {
	/** This cell's column, zero-based. */
	index: number;
	section: TableSection;
	tone: TableRowTone;
	isDisabled: boolean;
};

const TableContext = createContext<TableContextValue | null>(null);
const TableSectionContext = createContext<TableSection | null>(null);
const TableRowPositionContext = createContext<TableRowPositionValue | null>(null);
const TableCellContext = createContext<TableCellContextValue | null>(null);

/**
 * Supplies the table's columns and axes to its rows and cells.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./table` — which would close a cycle and leave the
 * context `undefined` on a cold start. See AGENTS.md rule 3.
 */
export function TableProvider({ value, children }: { value: TableContextValue; children: ReactNode }): ReactElement {
	return <TableContext value={value}>{children}</TableContext>;
}
TableProvider.displayName = "DelacourUI.Table.Provider";

/** Names the block — header, body or footer — its rows sit in. */
export function TableSectionProvider({ value, children }: { value: TableSection; children: ReactNode }): ReactElement {
	return <TableSectionContext value={value}>{children}</TableSectionContext>;
}
TableSectionProvider.displayName = "DelacourUI.Table.SectionProvider";

/** Tells one row its index and whether it is the last in its section. */
export function TableRowPositionProvider({
	value,
	children,
}: {
	value: TableRowPositionValue;
	children: ReactNode;
}): ReactElement {
	return <TableRowPositionContext value={value}>{children}</TableRowPositionContext>;
}
TableRowPositionProvider.displayName = "DelacourUI.Table.RowPositionProvider";

/** Tells one cell its column and its row's state. */
export function TableCellProvider({
	value,
	children,
}: {
	value: TableCellContextValue;
	children: ReactNode;
}): ReactElement {
	return <TableCellContext value={value}>{children}</TableCellContext>;
}
TableCellProvider.displayName = "DelacourUI.Table.CellProvider";

/** The enclosing table's context, or null outside a `<Table>`. */
export function useTableContext(): TableContextValue | null {
	return use(TableContext);
}

/**
 * Reads the enclosing table's columns and axes.
 *
 * For a custom row or cell — a skeleton row while data loads, a cell of your
 * own — that has to line up with the table it sits in. Throws outside one.
 */
export function useTable(): TableContextValue {
	const context = useTableContext();
	if (!context) {
		throw new Error("useTable must be called inside a <Table>.");
	}
	return context;
}

/**
 * The enclosing table, for a part that cannot work without one.
 *
 * Internal: not re-exported from `index.ts`. A caller wants {@link useTable},
 * whose error names the hook rather than a part.
 */
export function useTablePart(component: string): TableContextValue {
	const context = useTableContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Table>.`);
	}
	return context;
}

/** The section around a row, or null — a row in a `FlatList` has none and reads as body. Internal. */
export function useTableSection(): TableSection | null {
	return use(TableSectionContext);
}

/** The position a section published for this row, or null outside one. Internal. */
export function useTableRowPosition(): TableRowPositionValue | null {
	return use(TableRowPositionContext);
}

/** The column and row state of the enclosing cell, or null outside a row. Internal. */
export function useTableCell(): TableCellContextValue | null {
	return use(TableCellContext);
}
