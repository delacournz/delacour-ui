import { Field } from "@delacour/react-native-ui/field";
import { Rating } from "@delacour/react-native-ui/rating";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Disabled and invalid",
	note: "Both cascade from a Field. Invalid paints the empty stars destructive too — a required rating left at zero has no filled star to carry the signal. Rate the second one and the error leaves.",
};

export function Demo(): ReactElement {
	const [score, setScore] = useState(0);

	return (
		<View className="gap-6">
			<Field isDisabled>
				<Field.Label>Disabled</Field.Label>
				<Rating defaultValue={3}>
					<Rating.Stars accessibilityLabel="Disabled rating" testID="rating-disabled" />
				</Rating>
			</Field>
			<Field isInvalid={score === 0}>
				<Field.Label>Required</Field.Label>
				<Rating onChange={setScore} value={score}>
					<Rating.Stars accessibilityLabel="Required rating" testID="rating-required" />
				</Rating>
				<Field.Error>{score === 0 ? "Choose at least one star." : undefined}</Field.Error>
			</Field>
		</View>
	);
}
