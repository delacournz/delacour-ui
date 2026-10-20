import { createContext, type ReactElement, type ReactNode, use, useEffect } from "react";
import type { GridItemLabelParts, GridItemSize, GridItemVariant } from "./grid-item.variants";
import { readGridItemText } from "./grid-item.variants";

export type GridItemGroupContextValue = {
	/** Track count, normalised to an integer of at least one. */
	columns: number;
	/** Gutter between cells, both axes, in points. */
	gap: number;
	/** One cell's width in points — 0 until the group has been measured. */
	cellWidth: number;
	/** One cell's height in points — 0 until the group has been measured. */
	cellHeight: number;
	/** Density for every tile that does not set its own. */
	size?: GridItemSize;
	/** Variant for every tile that does not set its own. */
	variant?: GridItemVariant;
};

/** The box the group gave one direct child. */
export type GridItemCellContextValue = {
	colSpan: number;
	rowSpan: number;
	width: number;
	height: number;
};

export type GridItemContextValue = GridItemCellContextValue & {
	/** Resolved variant — the tile's own, else its group's, else `default`. */
	variant: GridItemVariant;
	/** Resolved size — the tile's own, else its group's, else `default`. */
	size: GridItemSize;
	isDisabled: boolean;
	/** Records one text part's text for the tile's joined accessibility label. */
	registerLabel: (part: keyof GridItemLabelParts, text: string | undefined) => void;
};

const GridItemGroupContext = createContext<GridItemGroupContextValue | null>(null);
const GridItemCellContext = createContext<GridItemCellContextValue | null>(null);
const GridItemContext = createContext<GridItemContextValue | null>(null);

/**
 * Supplies the group's columns, gap and measured cell size to its tiles.
 *
 * Lives in this leaf, importing nothing but the variants' types, so a part can
 * read it without importing `./grid-item` and closing a cycle through the root.
 * See AGENTS.md rule 3.
 */
export function GridItemGroupProvider({
	value,
	children,
}: {
	value: GridItemGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <GridItemGroupContext value={value}>{children}</GridItemGroupContext>;
}
GridItemGroupProvider.displayName = "DelacourUI.GridItem.GroupProvider";

/** Supplies one direct child of the group with the spans and box it was placed at. Internal. */
export function GridItemCellProvider({
	value,
	children,
}: {
	value: GridItemCellContextValue;
	children: ReactNode;
}): ReactElement {
	return <GridItemCellContext value={value}>{children}</GridItemCellContext>;
}
GridItemCellProvider.displayName = "DelacourUI.GridItem.Group.CellProvider";

/** Supplies a tile's resolved variant, size and box to its parts. */
export function GridItemProvider({
	value,
	children,
}: {
	value: GridItemContextValue;
	children: ReactNode;
}): ReactElement {
	return <GridItemContext value={value}>{children}</GridItemContext>;
}
GridItemProvider.displayName = "DelacourUI.GridItem.Provider";

/** The enclosing group's context, or null outside a `<GridItem.Group>`. */
export function useGridItemGroupContext(): GridItemGroupContextValue | null {
	return use(GridItemGroupContext);
}

/** The box the enclosing group placed this subtree at, or null outside a group. Internal. */
export function useGridItemCellContext(): GridItemCellContextValue | null {
	return use(GridItemCellContext);
}

/**
 * Reads the enclosing group's columns, gap and measured cell size.
 *
 * `cellHeight` is how a caller adapts to large text: content taller than a
 * cell clips, so a screen can read it against `PixelRatio.getFontScale()` and
 * ask for fewer columns. Throws outside a `<GridItem.Group>`.
 */
export function useGridItemGroup(): Pick<GridItemGroupContextValue, "columns" | "gap" | "cellWidth" | "cellHeight"> {
	const context = useGridItemGroupContext();
	if (!context) {
		throw new Error("useGridItemGroup must be called inside a <GridItem.Group>.");
	}
	const { columns, gap, cellWidth, cellHeight } = context;
	return { cellHeight, cellWidth, columns, gap };
}

/** The enclosing tile's context, or null outside a `<GridItem>`. */
export function useGridItemContext(): GridItemContextValue | null {
	return use(GridItemContext);
}

/**
 * Reads the enclosing tile's resolved variant and size, its spans and the box
 * it was given, so a custom part — a chart sized to the tile, say — can match
 * it without props passed down. Throws outside a `<GridItem>`.
 */
export function useGridItem(): Omit<GridItemContextValue, "registerLabel" | "isDisabled"> {
	const context = useGridItemContext();
	if (!context) {
		throw new Error("useGridItem must be called inside a <GridItem>.");
	}
	const { variant, size, colSpan, rowSpan, width, height } = context;
	return { colSpan, height, rowSpan, size, variant, width };
}

/**
 * The enclosing tile's context, for a compound part that cannot work without
 * one. Internal: not re-exported from `index.ts`.
 */
export function useGridItemPart(component: string): GridItemContextValue {
	const context = useGridItemContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <GridItem>.`);
	}
	return context;
}

/**
 * Registers a text part's plain text with its tile, so the tile can announce
 * itself as one VoiceOver stop. Unregisters on unmount. Internal.
 */
export function useGridItemLabelPart(
	register: GridItemContextValue["registerLabel"],
	part: keyof GridItemLabelParts,
	children: unknown
): void {
	const text = readGridItemText(children);
	useEffect(() => {
		register(part, text);
		return () => register(part, undefined);
	}, [register, part, text]);
}
