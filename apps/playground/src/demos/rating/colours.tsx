import { RATING_COLORS, Rating } from "@delacour/react-native-ui/rating";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Colours",
	align: "center",
	note: "The colour paints the filled stars only. An empty star is the same faint outline at all six, and the default is Warning — a star reads as amber before it reads as a star.",
	capture: {},
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof RATING_COLORS)[number], string> = {
	default: "Default",
	primary: "Primary",
	success: "Success",
	warning: "Warning",
	destructive: "Destructive",
	info: "Info",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-1">
			{RATING_COLORS.map((color, index) => (
				<View className="flex-row items-center justify-between gap-4" key={color}>
					<Text.Caption className="w-20" color="muted">
						{LABELS[color]}
					</Text.Caption>
					<Rating color={color} defaultValue={(index % 5) + 1} size="sm">
						<Rating.Stars accessibilityLabel={`${LABELS[color]} rating`} testID={`rating-${color}`} />
					</Rating>
				</View>
			))}
		</View>
	);
}
