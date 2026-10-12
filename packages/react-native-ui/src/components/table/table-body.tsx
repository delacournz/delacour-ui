import { isValidElement, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";
import { TableSectionProvider, useTablePart } from "./table.context";
import type { TableSlotProps } from "./table.types";
import { splitTableBodyChildren, tableVariants } from "./table.variants";
import { TableEmpty } from "./table-empty";
import { withRowPositions } from "./table-section";

function isTableEmpty(node: ReactNode): boolean {
	return isValidElement(node) && node.type === TableEmpty;
}

/**
 * The table's rows. Publishes each row's index, which is what stripes a
 * `striped` table and drops the hairline after the last row.
 *
 * A `Table.Empty` among its children is shown in place of the rows when there
 * are none.
 */
export function TableBody({ className, children, ...props }: TableSlotProps): ReactElement {
	const { size } = useTablePart("Table.Body");
	const { rows, empty } = splitTableBodyChildren(children, isTableEmpty);

	return (
		<TableSectionProvider value="body">
			<View className={tableVariants({ size }).body({ className })} {...props}>
				{empty ?? withRowPositions(rows, "body")}
			</View>
		</TableSectionProvider>
	);
}
TableBody.displayName = "DelacourUI.Table.Body";
