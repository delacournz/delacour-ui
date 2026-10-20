import type { ReactElement } from "react";
import { View } from "react-native";
import { TableSectionProvider, useTablePart } from "./table.context";
import type { TableSlotProps } from "./table.types";
import { tableVariants } from "./table.variants";
import { withRowPositions } from "./table-section";

/**
 * The table's column headings — usually one `Table.Row` of `Table.Head`s.
 *
 * Its heads' text is what each body cell's accessible name is prefixed with, so
 * a screen reader landing on "3" hears "Qty, 3".
 */
export function TableHeader({ className, children, ...props }: TableSlotProps): ReactElement {
	const { size } = useTablePart("Table.Header");
	return (
		<TableSectionProvider value="header">
			<View className={tableVariants({ size }).header({ className })} {...props}>
				{withRowPositions(children, "header")}
			</View>
		</TableSectionProvider>
	);
}
TableHeader.displayName = "DelacourUI.Table.Header";
