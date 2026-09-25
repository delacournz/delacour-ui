import { Chip } from "@delacour/react-native-ui/chip";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Single choice",
	caption:
		"One value, held by the screen. Selecting a chip deselects the others; tapping the selected one leaves it on, so there is always an answer.",
};

type Range = "any" | "today" | "week" | "month";

const RANGES: Record<Range, string> = {
	any: "Any time",
	today: "Today",
	week: "This week",
	month: "This month",
};

export function Demo(): ReactElement {
	const [range, setRange] = useState<Range>("week");

	return (
		<View className="gap-3">
			<View className="flex-row flex-wrap gap-2">
				{(Object.keys(RANGES) as Range[]).map((value) => (
					<Chip
						isSelected={range === value}
						key={value}
						onSelectedChange={() => setRange(value)}
						testID={`range-${value}`}
					>
						{RANGES[value]}
					</Chip>
				))}
			</View>
			<Text.Caption color="muted" testID="range-value">
				Showing: {RANGES[range]}
			</Text.Caption>
		</View>
	);
}
