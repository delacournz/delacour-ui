import type { ReactElement } from "react";
import { Text } from "react-native";
import { Slot } from "../lib/slot";
import { useBottomSheetInternal } from "./bottom-sheet.context";
import type { BottomSheetTitleProps } from "./bottom-sheet.types";

/**
 * The sheet's heading, and what labels the panel for a screen reader: it
 * publishes a `nativeID` the container names in `accessibilityLabelledBy`, so
 * focus entering the sheet announces its purpose first. A `Text` on its own;
 * with `asChild`, the id and the heading role land on the child instead.
 */
export function BottomSheetTitle({ asChild = false, children, ...props }: BottomSheetTitleProps): ReactElement {
	const { titleId } = useBottomSheetInternal();

	if (asChild) {
		return (
			<Slot accessibilityRole="header" nativeID={titleId} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<Text accessibilityRole="header" nativeID={titleId} {...props}>
			{children}
		</Text>
	);
}
BottomSheetTitle.displayName = "DelacourBottomSheet.BottomSheet.Title";
