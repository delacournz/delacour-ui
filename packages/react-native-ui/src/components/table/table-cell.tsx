import type { ReactElement } from "react";
import { View } from "react-native";
import { Text } from "../text";
import { useTableCell, useTablePart } from "./table.context";
import type { TableCellBaseProps } from "./table.types";
import { readNodeText, resolveCellAccessibilityLabel, resolveCellLayout, tableVariants } from "./table.variants";

export type TableCellProps = TableCellBaseProps;

/**
 * One value in a row.
 *
 * Its width and alignment come from the table's `columns`, read by this cell's
 * position in its row, so every row's third cell lines up under the third head.
 * A `column` prop overrides that for this cell alone.
 *
 * Bare text is wrapped in a `Text` at the table's size, in tabular figures so a
 * column of numbers lines up digit for digit. Its accessible name is prefixed
 * with the column's header — "Qty, 3" — because there is no table role on iOS to
 * say which column a value belongs to.
 */
export function TableCell({
	column,
	labelClassName,
	className,
	style,
	accessibilityLabel,
	children,
	...props
}: TableCellProps): ReactElement {
	const { columns, size, headerLabels } = useTablePart("Table.Cell");
	const cell = useTableCell();
	const index = cell?.index ?? 0;
	const layout = resolveCellLayout(columns, index, column);
	const slots = tableVariants({
		align: layout.align,
		isDisabled: cell?.isDisabled ?? false,
		section: cell?.section ?? "body",
		size,
		tone: cell?.tone ?? "plain",
	});

	const text = readNodeText(children);
	const label = accessibilityLabel ?? resolveCellAccessibilityLabel(headerLabels[index], text);

	return (
		<View
			accessibilityLabel={label}
			accessible={label !== undefined}
			className={slots.cell({ className })}
			style={[layout.style, style]}
			{...props}
		>
			{text === undefined ? (
				children
			) : (
				<Text.Paragraph className={slots.cellText({ className: labelClassName })}>{text}</Text.Paragraph>
			)}
		</View>
	);
}
TableCell.displayName = "DelacourUI.Table.Cell";
