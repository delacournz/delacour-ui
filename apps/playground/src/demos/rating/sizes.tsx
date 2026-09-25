import { RATING_SIZES, Rating } from "@delacour/react-native-ui/rating";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	align: "center",
	note: "The star steps up the icon scale — 20, 24 and 32 points — while the row stays a 44-point target at all three. The readout names a Text size to match.",
	capture: {},
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof RATING_SIZES)[number], string> = {
	sm: "Small",
	md: "Medium",
	lg: "Large",
};

export function Demo(): ReactElement {
	return (
		<View className="items-center gap-3">
			{RATING_SIZES.map((size) => (
				<View className="items-center" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Rating className="flex-row items-center gap-2" defaultValue={4} size={size}>
						<Rating.Stars accessibilityLabel={`${LABELS[size]} rating`} testID={`rating-${size}`} />
						<Rating.Output />
					</Rating>
				</View>
			))}
		</View>
	);
}
