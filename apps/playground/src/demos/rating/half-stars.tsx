import { Rating } from "@delacour/react-native-ui/rating";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Half stars",
	align: "center",
	caption:
		"`step={0.5}` splits every star at its centre: the left half of a star is the half, the right half the whole.",
	capture: { flow: "rating/half-stars" },
};

export function Demo(): ReactElement {
	const [value, setValue] = useState(2.5);

	return (
		<View className="items-center gap-2">
			<Rating onChange={setValue} step={0.5} value={value}>
				<Rating.Stars accessibilityLabel="Half-star rating" testID="rating-half" />
			</Rating>
			<Text.Caption color="muted">{`${value} of 5`}</Text.Caption>
		</View>
	);
}
