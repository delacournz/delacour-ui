import { PRESSABLE_FEEDBACKS, Pressable } from "@delacour/native-ui/pressable";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Named feedback",
	caption:
		"The vocabulary every pressable in the library shares. `scale-fade` moves both axes at once, taking each from the mode that owns it.",
	capture: { align: "stretch", hero: true },
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			{PRESSABLE_FEEDBACKS.map((feedback) => (
				<Pressable
					className="rounded-xl border border-border bg-card p-4"
					feedback={feedback}
					key={feedback}
					testID={`feedback-${feedback}`}
				>
					<Text className="font-semibold text-base text-card-foreground">{feedback}</Text>
				</Pressable>
			))}
		</View>
	);
}
