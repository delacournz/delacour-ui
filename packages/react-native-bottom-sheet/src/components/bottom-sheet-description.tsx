import type { ReactElement } from "react";
import { Text } from "react-native";
import { Slot } from "../lib/slot";
import { useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetDescriptionProps } from "./bottom-sheet.types";

/**
 * Supporting copy under the title. Publishes a `nativeID` for the same reason
 * `Title` does, so a skin can describe the panel by it. A `Text` on its own;
 * with `asChild`, the id lands on the child.
 */
export function BottomSheetDescription({
	asChild = false,
	children,
	...props
}: BottomSheetDescriptionProps): ReactElement {
	const { descriptionId } = useBottomSheetInternal();

	if (asChild) {
		return (
			<Slot nativeID={descriptionId} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<Text nativeID={descriptionId} {...props}>
			{children}
		</Text>
	);
}
BottomSheetDescription.displayName = "DelacourBottomSheet.BottomSheet.Description";
