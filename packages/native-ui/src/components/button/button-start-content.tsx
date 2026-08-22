import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import type { ButtonSlotProps } from "./button.types";

/**
 * A centred wrapper for leading content that is not an `Icon`.
 *
 * An `Icon` needs no wrapper — it inherits the button's icon size and its
 * variant's colour from the root's `IconDefaultsProvider`.
 */
export function ButtonStartContent({ className, ...props }: ButtonSlotProps): ReactElement {
	return <View className={cn("items-center justify-center", className)} {...props} />;
}
