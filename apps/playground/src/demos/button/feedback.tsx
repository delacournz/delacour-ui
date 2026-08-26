import { Button } from "@delacour/native-ui/button";
import { PRESSABLE_FEEDBACKS } from "@delacour/native-ui/pressable";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Feedback",
	caption: "Inherited from Pressable, so a button takes the whole vocabulary. `scale` is the default.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{PRESSABLE_FEEDBACKS.map((feedback) => (
				<Button feedback={feedback} key={feedback} testID={`feedback-${feedback}`} variant="secondary">
					{feedback}
				</Button>
			))}
		</View>
	);
}
