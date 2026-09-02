import { CHART_SIZES, Chart } from "@delacour/native-ui/chart";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	align: "stretch",
	caption:
		"A height token rather than an aspect ratio, so two charts at different widths still line up on a dashboard.",
	note: "The axis font and the tick count step with the height — a small chart asks for fewer labels because they would collide.",
};

const DATA = [
	{ x: "1", y: 12 },
	{ x: "2", y: 28 },
	{ x: "3", y: 19 },
	{ x: "4", y: 34 },
	{ x: "5", y: 26 },
];

const CONFIG = { y: { label: "Value" } };

function SizeRow({ size }: { size: (typeof CHART_SIZES)[number] }): ReactElement {
	return (
		<View className="gap-2">
			<Text className="text-xs text-muted-foreground">{size}</Text>
			<Chart config={CONFIG} data={DATA} size={size} xKey="x">
				<Chart.Grid />
				<Chart.YAxis />
				<Chart.XAxis />
				<Chart.Line yKey="y" />
			</Chart>
		</View>
	);
}

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{CHART_SIZES.map((size) => (
				<SizeRow key={size} size={size} />
			))}
		</View>
	);
}
