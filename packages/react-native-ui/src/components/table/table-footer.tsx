import type { ReactElement } from "react";
import { View } from "react-native";
import { TableSectionProvider, useTablePart } from "./table.context";
import type { TableSlotProps } from "./table.types";
import { tableVariants } from "./table.variants";
import { withRowPositions } from "./table-section";

/**
 * Totals under the body, ruled off from it. Its cells' text is set heavier, so a
 * total reads as a total rather than as one more line item.
 */
export function TableFooter({ className, children, ...props }: TableSlotProps): ReactElement {
	const { size } = useTablePart("Table.Footer");
	return (
		<TableSectionProvider value="footer">
			<View className={tableVariants({ size }).footer({ className })} {...props}>
				{withRowPositions(children, "footer")}
			</View>
		</TableSectionProvider>
	);
}
TableFooter.displayName = "DelacourUI.Table.Footer";
