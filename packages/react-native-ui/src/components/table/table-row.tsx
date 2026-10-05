import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Pressable, type PressableProps } from "../pressable";
import { TableCellProvider, useTablePart, useTableRowPosition, useTableSection } from "./table.context";
import {
	readNodeText,
	resolveCellAccessibilityLabel,
	resolveTableRowAccessibilityLabel,
	resolveTableRowTone,
	tableVariants,
} from "./table.variants";
import { TableCell } from "./table-cell";
import { TableHead } from "./table-head";

export type TableRowProps = Omit<ViewProps, "children"> & {
	/**
	 * This row's position in its list, zero-based. A `Table.Body` publishes it for
	 * you; pass it from a `FlatList`'s `renderItem`, where there is no body, so a
	 * striped table still stripes.
	 */
	index?: number;
	/** Drops the hairline under the row. A `Table.Body` sets it on its last row; pass it from a `FlatList`. */
	isLast?: boolean;
	/** Paints the row on the accent and announces it selected. */
	isSelected?: boolean;
	/** Fades the cells and, on a pressable row, blocks the press. */
	isDisabled?: boolean;
	/** Makes the whole row one button, named by its cells. */
	onPress?: () => void;
	onLongPress?: () => void;
	haptic?: PressableProps["haptic"];
	feedback?: PressableProps["feedback"];
	className?: string;
	children?: ReactNode;
};

function isTableCellElement(
	node: ReactNode
): node is ReactElement<{ children?: ReactNode; accessibilityLabel?: string }> {
	return isValidElement(node) && (node.type === TableCell || node.type === TableHead);
}

/**
 * One row of cells.
 *
 * Tells each direct child its column index, which is how the third cell finds
 * the third column. Cells behind a wrapper component all read as column zero,
 * and the row warns in development.
 *
 * With `onPress` the row is one button: its cells merge into a single
 * accessibility element named by every cell's label in order, and
 * `isSelected` reads as its selected state. The press fades rather than scales
 * — a full-width row that scales reads as the whole table flexing.
 */
export function TableRow({
	index: indexProp,
	isLast: isLastProp,
	isSelected = false,
	isDisabled = false,
	onPress,
	onLongPress,
	haptic,
	feedback = "fade",
	className,
	accessibilityLabel,
	accessibilityState,
	children,
	...props
}: TableRowProps): ReactElement {
	const { size, striped, headerLabels } = useTablePart("Table.Row");
	const section = useTableSection() ?? "body";
	const position = useTableRowPosition();
	const index = indexProp ?? position?.index;
	const isLast = isLastProp ?? position?.isLast ?? false;

	const tone =
		section === "body"
			? resolveTableRowTone({ index, isSelected, striped })
			: resolveTableRowTone({ isSelected, striped: false });
	const rowClassName = tableVariants({ isLast, size, tone }).row({ className });

	const items = Children.toArray(children);
	if (
		process.env.NODE_ENV !== "production" &&
		items.some((item) => isValidElement(item) && !isTableCellElement(item))
	) {
		console.warn(
			"Table.Row: found a child that is not a <Table.Cell> or <Table.Head>. Cells read their column by their " +
				"position among the row's direct children, so render them directly rather than behind a wrapper."
		);
	}

	const cells = items.map((item, column) => (
		<TableCellProvider
			key={isValidElement(item) ? (item.key ?? column) : column}
			value={{ index: column, isDisabled, section, tone }}
		>
			{item}
		</TableCellProvider>
	));

	// Built from the cells' own props rather than measured, so the label is there
	// on the first frame and changes with the data.
	if (onPress || onLongPress) {
		const label =
			accessibilityLabel ??
			resolveTableRowAccessibilityLabel(
				items.map((item, column) => {
					if (!isTableCellElement(item)) return undefined;
					return (
						item.props.accessibilityLabel ??
						resolveCellAccessibilityLabel(headerLabels[column], readNodeText(item.props.children))
					);
				})
			);

		return (
			<Pressable
				accessibilityLabel={label}
				accessibilityState={{ ...accessibilityState, selected: isSelected }}
				className={rowClassName}
				disabled={isDisabled}
				feedback={feedback}
				haptic={haptic}
				onLongPress={onLongPress}
				onPress={onPress}
				{...props}
			>
				{cells}
			</Pressable>
		);
	}

	return (
		<View
			accessibilityLabel={accessibilityLabel}
			accessibilityState={accessibilityState}
			className={rowClassName}
			{...props}
		>
			{cells}
		</View>
	);
}
TableRow.displayName = "DelacourUI.Table.Row";
