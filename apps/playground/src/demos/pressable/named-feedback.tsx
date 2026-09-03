import { PRESSABLE_FEEDBACKS, Pressable } from "delacour-react-native-ui/pressable";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Named feedback",
	caption:
		"The vocabulary every pressable in the library shares. `scale-fade` moves both axes at once, taking each from the mode that owns it.",
	capture: { align: "stretch", hero: true },
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof PRESSABLE_FEEDBACKS)[number], string> = {
	scale: "Scale",
	fade: "Fade",
	"scale-fade": "Scale Fade",
	none: "None",
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
					<Text className="font-semibold text-base text-card-foreground">{LABELS[feedback]}</Text>
				</Pressable>
			))}
		</View>
	);
}
