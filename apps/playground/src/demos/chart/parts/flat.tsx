import { Chart } from "delacour-react-native-ui/chart";
import { Text } from "delacour-react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "A series that never moves",
	align: "stretch",
	capture: { align: "stretch" },
	caption:
		"Every value the same. The line draws flat through the middle rather than being stretched to fill the height.",
	note: "The domain is genuinely zero-width, and `scaleValue` maps that to the range midpoint. Expanding it would invent a spread the data does not have — and a chart that dramatises noise is worse than one that reports none.",
};

const CONFIG = { y: { label: "Value" } };

const CONSTANT = [
	{ x: "1", y: 50 },
	{ x: "2", y: 50 },
	{ x: "3", y: 50 },
	{ x: "4", y: 50 },
];

const NEARLY_CONSTANT = [
	{ x: "1", y: 50 },
	{ x: "2", y: 50.4 },
	{ x: "3", y: 49.7 },
	{ x: "4", y: 50.1 },
];

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Every value the same</Text>
				<Chart config={CONFIG} data={CONSTANT} size="sm" xKey="x">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.Line yKey="y" />
				</Chart>
			</View>
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Almost the same</Text>
				<Chart config={CONFIG} data={NEARLY_CONSTANT} size="sm" xKey="x">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.Line yKey="y" />
				</Chart>
			</View>
		</View>
	);
}
