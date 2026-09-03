import { TEXT_ALIGNS, Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Alignment",
};

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const LABELS: Record<(typeof TEXT_ALIGNS)[number], string> = {
	left: "Left",
	center: "Center",
	right: "Right",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-2 rounded-lg border border-border p-3">
			{TEXT_ALIGNS.map((align) => (
				<Text align={align} className="w-full" key={align}>
					{LABELS[align]}
				</Text>
			))}
		</View>
	);
}
