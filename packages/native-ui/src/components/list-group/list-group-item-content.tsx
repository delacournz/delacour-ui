import type { ReactElement } from "react";
import { View } from "react-native";
import type { ListGroupSlotProps } from "./list-group.types";
import { listGroupItemContentVariants } from "./list-group.variants";

/** The text column of a row, taking whatever width the prefix and suffix leave. */
export function ListGroupItemContent({ className, ...props }: ListGroupSlotProps): ReactElement {
	return <View className={listGroupItemContentVariants({ className })} {...props} />;
}
