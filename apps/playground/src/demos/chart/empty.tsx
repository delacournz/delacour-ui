import { Chart } from "@delacour/native-ui/chart";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Nothing to draw",
	align: "stretch",
	caption: "An empty series, and a single point. Both are real states and neither is allowed to crash.",
	note: "A constant series draws flat through the middle rather than being expanded to fill the height — the domain is genuinely zero-width, and inventing a spread would misreport the data.",
};

const CONFIG = { y: { label: "Value" } };
const ONE_POINT = [{ x: "Only", y: 42 }];
const CONSTANT = [
	{ x: "1", y: 50 },
	{ x: "2", y: 50 },
	{ x: "3", y: 50 },
];

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">No rows</Text>
				<Chart config={CONFIG} data={[]} size="sm" xKey="x">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.Line yKey="y" />
				</Chart>
			</View>
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">One row</Text>
				<Chart config={CONFIG} data={ONE_POINT} size="sm" xKey="x">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.Line yKey="y" />
				</Chart>
			</View>
			<View className="gap-2">
				<Text className="text-xs text-muted-foreground">Every value the same</Text>
				<Chart config={CONFIG} data={CONSTANT} size="sm" xKey="x">
					<Chart.Grid />
					<Chart.YAxis />
					<Chart.Line yKey="y" />
				</Chart>
			</View>
		</View>
	);
}
