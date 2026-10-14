import { Children, isValidElement, type ReactElement, type ReactNode, useEffect, useMemo, useState } from "react";
import { type LayoutChangeEvent, PixelRatio, View, type ViewProps, type ViewStyle } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useCalmMotion } from "../../hooks/use-calm-motion";
import {
	type GridItemCellContextValue,
	GridItemCellProvider,
	type GridItemGroupContextValue,
	GridItemGroupProvider,
} from "./grid-item.context";
import {
	type GridItemRect,
	type GridItemRowSizing,
	gridHeight,
	normalizeColumns,
	placeTiles,
	readGridItemSpan,
	resolveCellSize,
	resolveInitialAspect,
	tileRect,
} from "./grid-item.layout";
import { type GridItemSize, type GridItemVariant, gridItemVariants } from "./grid-item.variants";

export type GridItemGroupProps = ViewProps &
	GridItemRowSizing & {
		/** Track count. An integer of at least one; default 2. */
		columns?: number;
		/** Gutter between cells, both axes, in points. Default 12. */
		gap?: number;
		/** Density for every tile that does not set its own. Default `default`. */
		size?: GridItemSize;
		/** Variant for every tile that does not set its own. Default `default`. */
		variant?: GridItemVariant;
		className?: string;
		children?: ReactNode;
	};

/** How long a relayout — a rotation, a new column count — takes to glide tiles to their new cells. */
const RELAYOUT_DURATION = 220;

const RELAYOUT_TRANSITION = LinearTransition.duration(RELAYOUT_DURATION);

/**
 * A bento grid: whole-cell tiles of mixed sizes, every edge on the same
 * columns.
 *
 * Measures its own width, sizes a cell from `columns`, `gap` and either
 * `aspect` or `rowHeight`, places each **direct** child first-fit in writing
 * order from the `colSpan` / `rowSpan` on its props, and positions it
 * absolutely on the logical `start` inset — so the grid mirrors under
 * right-to-left with no code of its own. Its own height is the rows it used.
 *
 * Before the first measure it reserves its height — `rowHeight` rows, or an
 * `aspectRatio` — and keeps the tiles invisible, so nothing jumps when they
 * appear. Later relayouts glide each tile to its new cell, and jump instead
 * under reduce motion.
 */
export function GridItemGroup({
	columns = 2,
	gap = 12,
	size,
	variant,
	aspect,
	rowHeight,
	className,
	children,
	onLayout,
	style,
	...props
}: GridItemGroupProps): ReactElement {
	const [width, setWidth] = useState(0);
	const [isSettled, setIsSettled] = useState(false);
	const isMotionCalm = useCalmMotion();

	const tracks = normalizeColumns(columns);
	const items = Children.toArray(children).filter(isValidElement);
	const spans = items.map((child) => readGridItemSpan(child.props));
	// Recomputed every render on purpose: tens of tiles is microseconds, and a
	// memo keyed on the children would miss every time anyway.
	const { placements, rows } = placeTiles(spans, tracks);

	const cell = resolveCellSize(width, tracks, gap, rowHeight !== undefined ? { rowHeight } : { aspect });
	const isMeasured = width > 0;
	const pixelRatio = PixelRatio.get();

	// The first measured frame lands without a transition — only a change after
	// it (rotation, split view, a new column count) is animated.
	useEffect(() => {
		if (isMeasured && !isSettled) setIsSettled(true);
	}, [isMeasured, isSettled]);

	const context = useMemo<GridItemGroupContextValue>(
		() => ({ cellHeight: cell.cellHeight, cellWidth: cell.cellWidth, columns: tracks, gap, size, variant }),
		[cell.cellHeight, cell.cellWidth, tracks, gap, size, variant]
	);

	const handleLayout = (event: LayoutChangeEvent) => {
		setWidth(event.nativeEvent.layout.width);
		onLayout?.(event);
	};

	const reserve: ViewStyle =
		rows === 0
			? { height: 0 }
			: isMeasured
				? { height: gridHeight(rows, cell.cellHeight, gap) }
				: rowHeight !== undefined
					? { height: gridHeight(rows, rowHeight, gap) }
					: { aspectRatio: resolveInitialAspect(tracks, rows, aspect ?? 1) };

	const transition = isSettled && !isMotionCalm ? RELAYOUT_TRANSITION : undefined;

	return (
		<GridItemGroupProvider value={context}>
			<View
				accessibilityRole="list"
				className={gridItemVariants().group({ className })}
				onLayout={handleLayout}
				style={[style, reserve]}
				{...props}
			>
				{items.map((child, index) => {
					const placement = placements[index];
					if (!placement) return null;
					return (
						<GridItemGroupCell
							colSpan={placement.colSpan}
							isMeasured={isMeasured}
							key={child.key ?? index}
							rect={tileRect(placement, cell, gap, pixelRatio)}
							rowSpan={placement.rowSpan}
							transition={transition}
						>
							{child}
						</GridItemGroupCell>
					);
				})}
			</View>
		</GridItemGroupProvider>
	);
}
GridItemGroup.displayName = "DelacourUI.GridItem.Group";

type GridItemGroupCellProps = {
	rect: GridItemRect;
	colSpan: number;
	rowSpan: number;
	isMeasured: boolean;
	transition: typeof RELAYOUT_TRANSITION | undefined;
	children: ReactNode;
};

/**
 * The absolutely positioned box one direct child of the group sits in.
 *
 * The child fills it, so a tile never sizes itself — and a child that is not a
 * `GridItem` is placed just the same. `start`, not `left`, so the box mirrors
 * under right-to-left. Hidden until the group has been measured, so the first
 * visible frame is the final one.
 */
function GridItemGroupCell({
	rect,
	colSpan,
	rowSpan,
	isMeasured,
	transition,
	children,
}: GridItemGroupCellProps): ReactElement {
	const value = useMemo<GridItemCellContextValue>(
		() => ({ colSpan, height: rect.height, rowSpan, width: rect.width }),
		[colSpan, rowSpan, rect.width, rect.height]
	);
	const style: ViewStyle = {
		height: rect.height,
		opacity: isMeasured ? 1 : 0,
		position: "absolute",
		start: rect.start,
		top: rect.top,
		width: rect.width,
	};

	return (
		<Animated.View layout={transition} style={style}>
			<GridItemCellProvider value={value}>{children}</GridItemCellProvider>
		</Animated.View>
	);
}
GridItemGroupCell.displayName = "DelacourUI.GridItem.Group.Cell";
