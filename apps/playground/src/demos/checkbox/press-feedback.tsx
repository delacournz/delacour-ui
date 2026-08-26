import { Checkbox } from "@delacour/native-ui/checkbox";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Press feedback",
	caption:
		"The root is a `Pressable`, so its whole vocabulary comes through. Only two defaults differ from a bare one: `fade`, and a `selection` haptic.",
};

export function Demo(): ReactElement {
	const [feedbackCount, setFeedbackCount] = useState(0);

	const bump = () => setFeedbackCount((count) => count + 1);

	return (
		<View className="gap-3">
			<Checkbox color="primary" onCheckedChange={bump} testID="checkbox-default">
				<Checkbox.Label>Default — fade, selection haptic</Checkbox.Label>
			</Checkbox>
			<Checkbox color="primary" haptic={false} onCheckedChange={bump} testID="checkbox-silent">
				<Checkbox.Label>haptic={"{false}"} — silent</Checkbox.Label>
			</Checkbox>
			<Checkbox color="primary" feedback="scale" haptic="heavy" onCheckedChange={bump} testID="checkbox-scale">
				<Checkbox.Label>feedback="scale", haptic="heavy"</Checkbox.Label>
			</Checkbox>
			<Text.Caption color="muted">{`Toggled ${feedbackCount} times`}</Text.Caption>
		</View>
	);
}
