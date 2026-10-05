import type { ReactElement } from "react";
import { View } from "react-native";
import { Text } from "../text";
import { useTablePart } from "./table.context";
import type { TableSlotProps } from "./table.types";
import { tableVariants } from "./table.variants";

/**
 * What a body shows when it has no rows. Written inside `Table.Body`, beside the
 * `.map()`; the body shows it only when the map produced nothing, and the header
 * stays where it is. Bare text is set muted and centred.
 */
export function TableEmpty({ className, children, ...props }: TableSlotProps): ReactElement {
	const { size } = useTablePart("Table.Empty");
	const slots = tableVariants({ size });
	const content =
		typeof children === "string" || typeof children === "number" ? (
			<Text className={slots.emptyText()}>{children}</Text>
		) : (
			children
		);

	return (
		<View className={slots.empty({ className })} {...props}>
			{content}
		</View>
	);
}
TableEmpty.displayName = "DelacourUI.Table.Empty";
