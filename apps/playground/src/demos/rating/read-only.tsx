import { Rating } from "@delacour/react-native-ui/rating";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Read-only",
	align: "center",
	caption:
		"`isReadOnly` shows a score without taking a touch, and without fading. Any value is drawn — an average of 4.3 fills three tenths of the fifth star; only a finger is held to `step`.",
	capture: {},
};

const REVIEWS = [
	{ average: 4.3, count: 128, name: "Flat white" },
	{ average: 3.7, count: 42, name: "Pour over" },
	{ average: 2.5, count: 9, name: "Decaf" },
] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{REVIEWS.map((review) => (
				<View className="gap-0.5" key={review.name}>
					<Text.Label>{review.name}</Text.Label>
					<Rating className="flex-row items-center gap-2" isReadOnly size="sm" value={review.average}>
						<Rating.Stars accessibilityLabel={`${review.name}, average rating`} testID={`rating-${review.count}`} />
						<Rating.Output color="muted">
							{({ value }) => `${value.toFixed(1)} · ${review.count} reviews`}
						</Rating.Output>
					</Rating>
				</View>
			))}
		</View>
	);
}
