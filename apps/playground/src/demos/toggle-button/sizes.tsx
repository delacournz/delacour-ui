import { BUTTON_LABEL_SIZES, type ButtonLabelSize } from "@delacour/react-native-ui/button";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconStar } from "@delacour/react-native-ui/icons/central";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption:
		"The button's own steps. A square `icon-*` size holds a single glyph and needs an `accessibilityLabel` — there is no text for a screen reader to fall back on.",
	align: "center",
	capture: {},
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<ButtonLabelSize, string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

/** The square size built on each labelled step. */
const SQUARE: Record<ButtonLabelSize, "icon-sm" | "icon-md" | "icon-lg"> = {
	sm: "icon-sm",
	md: "icon-md",
	lg: "icon-lg",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{BUTTON_LABEL_SIZES.map((size) => (
				<View className="flex-row items-center gap-3" key={size}>
					<ToggleButton defaultSelected size={size} testID={`size-${size}`} variant="outline">
						<Icon icon={IconStar} />
						<ToggleButton.Label>{LABELS[size]}</ToggleButton.Label>
					</ToggleButton>
					<ToggleButton
						accessibilityLabel={`Star, ${LABELS[size].toLowerCase()}`}
						size={SQUARE[size]}
						testID={`size-${SQUARE[size]}`}
						variant="outline"
					>
						<Icon icon={IconStar} />
					</ToggleButton>
				</View>
			))}
		</View>
	);
}
