import { Button } from "@delacour/react-native-ui/button";
import { Rating } from "@delacour/react-native-ui/rating";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Controlled",
	align: "center",
	caption:
		"`value` and `onChange` hand the score to you. `onChange` fires as a drag crosses each star; `onChangeEnd` fires once when the finger lifts, which is where a network write belongs.",
};

export function Demo(): ReactElement {
	const [value, setValue] = useState(2);
	const [saved, setSaved] = useState<number | null>(null);

	return (
		<View className="items-center gap-3">
			<Rating onChange={setValue} onChangeEnd={setSaved} value={value}>
				<Rating.Stars accessibilityLabel="Controlled rating" testID="rating-controlled" />
			</Rating>
			<Text.Caption color="muted" testID="rating-controlled-live">{`onChange: ${value}`}</Text.Caption>
			<Text.Caption color="muted" testID="rating-controlled-saved">
				{`onChangeEnd: ${saved ?? "—"}`}
			</Text.Caption>
			<Button onPress={() => setValue(5)} size="sm" testID="rating-controlled-max" variant="secondary">
				<Button.Label>Set to five</Button.Label>
			</Button>
		</View>
	);
}
